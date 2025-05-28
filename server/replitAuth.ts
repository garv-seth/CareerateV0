import * as oidc from "openid-client";
// import { Strategy as OpenIDConnectStrategy, VerifyCallbackWithRequest } from 'passport-openidconnect';

import passport from "passport";
import session from "express-session";
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage, IStorage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    const issuer = await oidc.Issuer.discover(process.env.ISSUER_URL ?? "https://replit.com/oidc");
    return new issuer.Client({
      client_id: process.env.REPL_ID!,
      redirect_uris: process.env.REPLIT_DOMAINS!.split(",").map(d => `https://${d}/api/callback`),
      response_types: ['code'],
    });
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
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
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: oidc.TokenSet
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = tokens.expires_at;
}

async function upsertUserFromClaims(profile: any) {
  const userData = {
    id: String(profile.sub),
    username: String(profile.name || ''),
    email: String(profile.email || ''),
    profileImageUrl: String(profile.picture || ''),
    bio: String(profile.bio || ''),
    firstName: String(profile.given_name || ''),
    lastName: String(profile.family_name || ''),
  };

  await (storage as IStorage).upsertUser(userData);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const oidcClient = await getOidcConfig();

  // const verify: VerifyCallbackWithRequest = async (req, issuer, uiProfile, idProfile, context, idToken, accessToken, refreshToken, params, done) => {
  // ... existing code ...

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    if (!oidcClient) throw new Error("OIDC client not configured");
    /* const strategy = new OpenIDConnectStrategy(
      {
        client: oidcClient,
        params: {
          // these are non-standard params that we pass to replit
          // see: https://gist.github.com/commanderpoole/853b5861e55265c74a80310ea9a44a9c
          prompt: "none",
          redirect_uri: `${process.env.REPLIT_BASE_URL}/auth/replit/callback?domain=${domain}`,
          scope: "openid email profile" // Add any other scopes you need
        },
        passReqToCallback: true,
      },
      // verify
    );
    passport.use(`replitauth:${domain}`, strategy); */
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res) => {
    const user = req.user as any;
    const idTokenHint = user?.id_token;
    req.logout(async (err) => {
      if (err) {
        return res.redirect('/');
      }
      try {
        const oidcClientInstance = await getOidcConfig();
        const endSessionUrl = oidcClientInstance.endSessionUrl({
          id_token_hint: idTokenHint,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        });
        res.redirect(endSessionUrl);
      } catch (e) {
        res.redirect('/');
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    next();
    return;
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.redirect("/api/login");
    return;
  }

  try {
    const oidcClientInstance = await getOidcConfig();
    const tokenSet = await oidcClientInstance.refresh(refreshToken);
    updateUserSession(user, tokenSet);
    req.login(user, (err) => {
      if (err) { return next(err); }
      next();
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.redirect("/api/login");
  }
};

export async function initReplitAuth(app: Express) {
  // await configureReplitOidcStrategy();

  // app.use(passport.initialize());
  // app.use(passport.session());

  // app.get(
  //   "/auth/replit/callback",
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const domain = req.query.domain as string;
  //     if (!domain) {
  //       return res.status(400).send("Missing domain parameter");
  //     }
  //     passport.authenticate(`replitauth:${domain}`, {
  //       successRedirect: "/", 
  //       failureRedirect: "/login?error=Authentication failed", 
  //     })(req, res, next);
  //   }
  // );

  // app.get("/logout", (req, res) => {
  //   req.logout((err) => {
  //     if (err) { return next(err); }
  //     res.redirect("/");
  //   });
  // });

  // app.use(replitAuthMiddleware);
}
