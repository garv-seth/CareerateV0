import * as oidc from "openid-client";
import { Strategy as OpenIDConnectStrategy, type VerifyCallbackWithRequest } from "passport-openidconnect";

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

async function upsertUserFromClaims(
  claims: oidc.UserinfoResponse
) {
  await (storage as IStorage).upsertUser({
    id: claims.sub!,
    email: claims.email,
    firstName: claims.given_name,
    lastName: claims.family_name,
    profileImageUrl: claims.picture,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const oidcClient = await getOidcConfig();

  const verify: VerifyCallbackWithRequest = async (
    req: Request,
    issuer: string,
    profile: any,
    context: any,
    idToken: string | object,
    accessToken: string,
    refreshToken: string | undefined,
    cb: (err: any, user?: Express.User | false, info?: any) => void
  ) => {
    try {
      const user = { id: profile.sub };
      if (context && context.tokens) {
        updateUserSession(user, new oidc.TokenSet(context.tokens));
      }
      await upsertUserFromClaims(profile);
      cb(null, user as Express.User);
    } catch (err) {
      cb(err);
    }
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new OpenIDConnectStrategy(
      {
        issuer: oidcClient.issuer.issuer,
        authorizationURL: oidcClient.issuer.authorization_endpoint!,
        tokenURL: oidcClient.issuer.token_endpoint!,
        userInfoURL: oidcClient.issuer.userinfo_endpoint!,
        clientID: oidcClient.metadata.client_id,
        callbackURL: `https://${domain}/api/callback`,
        scope: "openid email profile offline_access",
        passReqToCallback: true,
      },
      verify
    );
    passport.use(`replitauth:${domain}`, strategy);
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
