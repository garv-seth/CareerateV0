import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.AZURE_TENANT_ID) {
  throw new Error("Environment variable AZURE_TENANT_ID not provided");
}

if (!process.env.AZURE_CLIENT_ID) {
  throw new Error("Environment variable AZURE_CLIENT_ID not provided");
}

interface UserPayload {
  sub?: string;
  oid?: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax'
    },
  });
}

async function upsertUser(payload: UserPayload) {
  await storage.upsertUser({
    id: payload.sub || payload.oid || '',
    email: payload.preferred_username || payload.email || '',
    firstName: payload.given_name || payload.name?.split(' ')[0] || '',
    lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
    profileImageUrl: '',
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Azure B2C login redirect
  app.get("/api/login", (req, res) => {
    const tenantName = process.env.B2C_TENANT_NAME;
    const policyName = process.env.B2C_SIGNUP_SIGNIN_POLICY_NAME;
    const clientId = process.env.AZURE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/callback`);
    
    const authUrl = `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${redirectUri}&` +
      `response_mode=query&` +
      `scope=openid%20profile%20email%20offline_access&` +
      `state=12345&` +
      `p=${policyName}`;
    
    res.redirect(authUrl);
  });

  // Azure B2C callback
  app.get("/api/callback", async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: "Authorization code not received" });
    }

    try {
      // Exchange code for tokens
      const tokenUrl = `https://${process.env.B2C_TENANT_NAME}.b2clogin.com/${process.env.B2C_TENANT_NAME}.onmicrosoft.com/oauth2/v2.0/token?p=${process.env.B2C_SIGNUP_SIGNIN_POLICY_NAME}`;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/callback`;
      
      const tokenParams = new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        scope: 'openid profile email offline_access',
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      });

      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenParams
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        console.error('Token exchange error:', tokens);
        return res.status(400).json({ error: tokens.error_description });
      }

      // Decode the ID token to get user info
      const idToken = tokens.id_token;
      const payload: UserPayload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      
      await upsertUser(payload);
      
      // Store user in session
      req.login(payload, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed' });
        }
        res.redirect('/');
      });

    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Azure B2C logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const logoutUrl = `https://${process.env.B2C_TENANT_NAME}.b2clogin.com/${process.env.B2C_TENANT_NAME}.onmicrosoft.com/oauth2/v2.0/logout?` +
        `post_logout_redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get('host')}`)}`;
      res.redirect(logoutUrl);
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};