import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { db } from '../lib/db';
import jwt from 'jwt-simple';
import { ConfidentialClientApplication } from '@azure/msal-node';

const B2C_TENANT_NAME = process.env.B2C_TENANT_NAME;
const B2C_CLIENT_ID = process.env.B2C_CLIENT_ID;
const B2C_SIGNUP_SIGNIN_POLICY_NAME = process.env.B2C_SIGNUP_SIGNIN_POLICY_NAME;

// Configure MSAL for Azure AD B2C
const msalConfig = B2C_TENANT_NAME && B2C_CLIENT_ID ? {
    auth: {
        clientId: B2C_CLIENT_ID,
        authority: `https://${B2C_TENANT_NAME}.b2clogin.com/${B2C_TENANT_NAME}.onmicrosoft.com/${B2C_SIGNUP_SIGNIN_POLICY_NAME}`,
        clientSecret: process.env.MICROSOFT_PROVIDER_AUTHENTICATION_SECRET,
        knownAuthorities: [`${B2C_TENANT_NAME}.b2clogin.com`]
    }
} : null;

export const msalInstance = msalConfig ? new ConfidentialClientApplication(msalConfig) : null;

// JWT Strategy for API authentication
const jwtOptions: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    algorithms: ['HS256']
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
        // Find user by ID from JWT payload
        const user = await db.user.findUnique({
            where: { id: payload.sub }
        });

        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        return done(error, false);
    }
}));

// Helper function to generate JWT tokens
export const generateToken = (userId: string): string => {
    const payload = {
        sub: userId,
        iat: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    return jwt.encode(payload, process.env.JWT_SECRET || 'your-secret-key');
};

// Helper function to verify and exchange Azure AD B2C tokens for JWT
export const exchangeB2CTokenForJWT = async (b2cToken: string): Promise<{ token: string, user: any }> => {
    try {
        // Decode the B2C token (in production, validate with B2C public keys)
        const decoded = jwt.decode(b2cToken, process.env.JWT_SECRET || 'your-secret-key', false);
        
        // Find or create user based on B2C token claims
        let user = await db.user.findUnique({ where: { oidc: decoded.oid } });

        if (!user) {
            // Create a new user and a new team for them
            user = await db.user.create({
                data: {
                    oidc: decoded.oid,
                    email: decoded.emails?.[0] || decoded.email,
                    name: decoded.name || decoded.displayName,
                    team: {
                        create: {
                            name: `${decoded.name || decoded.displayName}'s Team`
                        }
                    }
                }
            });
        }
        
        // Generate our own JWT
        const token = generateToken(user.id);
        
        return { token, user };
    } catch (error) {
        throw new Error('Invalid B2C token');
    }
};

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await db.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport; 