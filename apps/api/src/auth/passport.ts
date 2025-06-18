import passport from 'passport';
import { OIDCStrategy } from 'passport-azure-ad';
import { db } from '../lib/db';

const B2C_TENANT_NAME = process.env.B2C_TENANT_NAME;
const B2C_CLIENT_ID = process.env.B2C_CLIENT_ID;
const B2C_SIGNUP_SIGNIN_POLICY_NAME = process.env.B2C_SIGNUP_SIGNIN_POLICY_NAME;

if (!B2C_TENANT_NAME || !B2C_CLIENT_ID || !B2C_SIGNUP_SIGNIN_POLICY_NAME) {
    throw new Error('Azure B2C environment variables must be set.');
}

passport.use(new OIDCStrategy({
    identityMetadata: `https://{B2C_TENANT_NAME}.b2clogin.com/${B2C_TENANT_NAME}.onmicrosoft.com/${B2C_SIGNUP_SIGNIN_POLICY_NAME}/v2.0/.well-known/openid-configuration`,
    clientID: B2C_CLIENT_ID,
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: process.env.CORS_ORIGIN ? `${process.env.CORS_ORIGIN}/api/auth/callback` : 'http://localhost:3000/api/auth/callback',
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.MICROSOFT_PROVIDER_AUTHENTICATION_SECRET,
    scope: ['openid', 'profile', 'email'],
    passReqToCallback: false,
}, async (iss, sub, profile, accessToken, refreshToken, done) => {
    if (!profile.oid) {
        return done(new Error("No OID found in profile"));
    }

    try {
        let user = await db.user.findUnique({ where: { oidc: profile.oid } });

        if (!user) {
            // Create a new user and a new team for them
            user = await db.user.create({
                data: {
                    oidc: profile.oid,
                    email: profile.emails[0],
                    name: profile.displayName,
                    team: {
                        create: {
                            name: `${profile.displayName}'s Team`
                        }
                    }
                }
            });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

export default passport; 