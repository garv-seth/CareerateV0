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
    // Ensure the sessions table is created automatically in new environments
    createTableIfMissing: true,
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
  const fullName = payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' ') || (payload.preferred_username || payload.email || '');
  await storage.upsertUser({
    id: payload.sub || payload.oid || '',
    email: payload.preferred_username || payload.email || '',
    name: fullName,
    metadata: {
      authProvider: payload.oid ? 'azure-b2c' : 'oauth',
      given_name: payload.given_name,
      family_name: payload.family_name,
      preferred_username: payload.preferred_username,
    }
  } as any);
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
    
    if (!tenantName || !policyName || !clientId) {
      console.error("Azure B2C env vars missing. Expected B2C_TENANT_NAME, B2C_SIGNUP_SIGNIN_POLICY_NAME, AZURE_CLIENT_ID");
      return res.status(500).send("Authentication not configured");
    }

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

  // GitHub OAuth login
  app.get("/api/login/github", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).send("GitHub auth not configured");
    }
    const redirectUri = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/callback/github`);
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user user:email`;
    res.redirect(authUrl);
  });

  // GitHub OAuth callback
  app.get("/api/callback/github", async (req, res) => {
    const { code } = req.query as { code?: string };
    if (!code) {
      return res.status(400).json({ error: "Authorization code not received" });
    }
    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${req.protocol}://${req.get('host')}/api/callback/github`,
        }),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenJson.access_token) {
        console.error("GitHub token exchange failed:", tokenJson);
        return res.status(400).json({ error: "GitHub authentication failed" });
      }

      // Get user info
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenJson.access_token}`, "User-Agent": "careerate-app" },
      });
      const ghUser: any = await userRes.json();

      // Get primary email (may require separate call)
      let email = ghUser.email || "";
      if (!email) {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${tokenJson.access_token}`, "User-Agent": "careerate-app" },
        });
        const emails: any[] = await emailsRes.json();
        const primary = emails?.find((e) => e.primary && e.verified) || emails?.[0];
        email = primary?.email || "";
      }

      const payload: UserPayload = {
        sub: `github-${ghUser.id}`,
        preferred_username: email,
        name: ghUser.name || ghUser.login,
      };

      await upsertUser(payload);

      req.login(payload, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }
        res.redirect("/");
      });
    } catch (error) {
      console.error("GitHub auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};