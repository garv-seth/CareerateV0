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
  try {
    console.log('Upserting user with payload:', payload);
    const fullName = payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' ') || (payload.preferred_username || payload.email || '');

    const userToUpsert = {
      id: payload.sub || payload.oid || '',
      email: payload.preferred_username || payload.email || '',
      name: fullName,
      metadata: {
        authProvider: payload.oid ? 'azure-ad' : (payload.sub?.startsWith('github-') ? 'github' : 'oauth'),
        given_name: payload.given_name,
        family_name: payload.family_name,
        preferred_username: payload.preferred_username,
      }
    };

    console.log('User object to upsert:', userToUpsert);
    const dbUser = await storage.upsertUser(userToUpsert as any);
    console.log('User upserted successfully:', dbUser);
    return dbUser;
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  console.log('=== Setting up Authentication ===');
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    AZURE_TENANT_ID: process.env.AZURE_TENANT_ID ? 'set' : 'missing',
    AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID ? 'set' : 'missing',
    AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET ? 'set' : 'missing',
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'set' : 'missing',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'set' : 'missing',
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'missing'
  });

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Auth status endpoint for debugging
  app.get('/api/auth/status', (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null,
      session: {
        id: req.sessionID,
        exists: !!req.session
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        AZURE_TENANT_ID: process.env.AZURE_TENANT_ID ? 'configured' : 'missing',
        AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID ? 'configured' : 'missing',
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'configured' : 'missing'
      }
    });
  });

  // Microsoft OAuth login redirect (using Azure AD instead of B2C)
  app.get("/api/login", (req, res) => {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/callback`);

    console.log('Microsoft OAuth Login attempt:', { tenantId, clientId: clientId ? 'set' : 'missing', redirectUri });

    if (!tenantId || !clientId) {
      console.error("Azure AD env vars missing. Expected AZURE_TENANT_ID, AZURE_CLIENT_ID");
      return res.status(500).json({
        error: "Microsoft authentication is temporarily unavailable",
        details: "Azure AD configuration incomplete"
      });
    }

    // Use standard Azure AD OAuth instead of B2C
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${redirectUri}&` +
      `response_mode=query&` +
      `scope=openid%20profile%20email%20offline_access&` +
      `state=12345`;

    console.log('Azure AD Auth URL:', authUrl);
    res.redirect(authUrl);
  });

  // Microsoft OAuth callback (Azure AD)
  app.get("/api/callback", async (req, res) => {
    console.log('=== Microsoft OAuth Callback ===');
    console.log('Full request URL:', req.url);
    console.log('Query params:', req.query);
    console.log('Headers host:', req.get('host'));
    console.log('Protocol:', req.protocol);

    const { code, state, error, error_description } = req.query;

    // Check for OAuth errors first
    if (error) {
      console.error('OAuth error received:', { error, error_description });
      return res.status(400).json({
        error: 'OAuth error',
        details: { error, error_description }
      });
    }

    if (!code) {
      console.error('No authorization code received');
      return res.status(400).json({ error: "Authorization code not received" });
    }

    console.log('Authorization code received:', code ? 'YES' : 'NO');

    try {
      // Exchange code for tokens using Azure AD
      const tokenUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/callback`;

      const tokenParams = new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        scope: 'openid profile email offline_access',
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      });

      console.log('Token exchange attempt:', {
        tokenUrl,
        redirectUri,
        clientId: process.env.AZURE_CLIENT_ID ? 'set' : 'missing',
        clientSecret: process.env.AZURE_CLIENT_SECRET ? 'set' : 'missing',
        tenantId: process.env.AZURE_TENANT_ID
      });

      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenParams
      });

      console.log('Token response status:', tokenResponse.status);
      console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));

      const tokens = await tokenResponse.json();
      console.log('Token response body:', tokens);

      if (tokens.error) {
        console.error('Token exchange error:', tokens);
        return res.status(400).json({
          error: 'Token exchange failed',
          details: tokens
        });
      }

      // Decode the ID token to get user info
      const idToken = tokens.id_token;
      if (!idToken) {
        console.error('No ID token received in response');
        return res.status(400).json({ error: 'No ID token received' });
      }

      console.log('ID token received:', idToken ? 'YES' : 'NO');

      const payload: UserPayload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      console.log('Decoded user payload:', payload);

      console.log('Upserting user...');
      const dbUser = await upsertUser(payload);
      console.log('User upserted successfully:', dbUser);

      // Store user in session (use the database user object, not the OAuth payload)
      console.log('Attempting session login...');
      req.login(dbUser, (err) => {
        if (err) {
          console.error('Session login error:', err);
          return res.status(500).json({ error: 'Login failed', details: err.message });
        }
        console.log('Session login successful, redirecting to /');
        res.redirect('/');
      });

    } catch (error) {
      console.error('=== Microsoft OAuth Error ===');
      console.error('Error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Microsoft OAuth logout (Azure AD)
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const logoutUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/logout?` +
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

    // Use the configured redirect URI from environment or fallback to request host
    const configuredRedirectUri = process.env.GITHUB_REDIRECT_URI;
    const redirectUri = configuredRedirectUri || `${req.protocol}://${req.get('host')}/api/callback/github`;

    console.log('GitHub OAuth redirect URI:', redirectUri);
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email`;
    res.redirect(authUrl);
  });

  // GitHub OAuth callback
  app.get("/api/callback/github", async (req, res) => {
    console.log('=== GitHub OAuth Callback ===');
    console.log('Full request URL:', req.url);
    console.log('Query params:', req.query);
    console.log('Headers host:', req.get('host'));
    console.log('Protocol:', req.protocol);

    const { code, error, error_description } = req.query as { code?: string; error?: string; error_description?: string };

    // Check for OAuth errors first
    if (error) {
      console.error('GitHub OAuth error received:', { error, error_description });
      return res.status(400).json({
        error: 'GitHub OAuth error',
        details: { error, error_description }
      });
    }

    console.log('GitHub callback received:', { code: code ? 'present' : 'missing', query: req.query });

    if (!code) {
      console.error('No GitHub authorization code received');
      return res.status(400).json({ error: "Authorization code not received" });
    }

    try {
      const redirectUri = `${req.protocol}://${req.get('host')}/api/callback/github`;
      console.log('GitHub token exchange attempt:', {
        clientId: process.env.GITHUB_CLIENT_ID ? 'set' : 'missing',
        clientSecret: process.env.GITHUB_CLIENT_SECRET ? 'set' : 'missing',
        redirectUri
      });

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      });

      console.log('GitHub token response status:', tokenRes.status);
      console.log('GitHub token response headers:', Object.fromEntries(tokenRes.headers.entries()));

      const tokenJson = await tokenRes.json();
      console.log('GitHub token response body:', tokenJson);

      if (!tokenJson.access_token) {
        console.error("GitHub token exchange failed:", tokenJson);
        return res.status(400).json({ error: "GitHub authentication failed", details: tokenJson });
      }

      // Get user info
      console.log('Fetching GitHub user info...');
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenJson.access_token}`, "User-Agent": "careerate-app" },
      });

      console.log('GitHub user response status:', userRes.status);
      const ghUser: any = await userRes.json();
      console.log('GitHub user info:', ghUser);

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

      console.log('GitHub user payload:', payload);
      console.log('Upserting GitHub user...');
      const dbUser = await upsertUser(payload);
      console.log('GitHub user upserted successfully:', dbUser);

      console.log('Attempting GitHub session login...');
      req.login(dbUser, (err) => {
        if (err) {
          console.error('GitHub session login error:', err);
          return res.status(500).json({ error: "Login failed", details: err.message });
        }
        console.log('GitHub session login successful, redirecting to /');
        res.redirect("/");
      });
    } catch (error) {
      console.error('=== GitHub OAuth Error ===');
      console.error('Error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        error: "GitHub authentication failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  next();
};