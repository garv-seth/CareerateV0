"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeB2CTokenForJWT = exports.generateToken = exports.msalInstance = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = require("passport-jwt");
const db_1 = require("../lib/db");
const jwt_simple_1 = __importDefault(require("jwt-simple"));
const msal_node_1 = require("@azure/msal-node");
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
exports.msalInstance = msalConfig ? new msal_node_1.ConfidentialClientApplication(msalConfig) : null;
const fromQueryParam = (req) => {
    let token = null;
    if (req && req.query) {
        token = req.query.auth_token;
    }
    return token;
};
// JWT Strategy for API authentication
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
        passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
        fromQueryParam,
    ]),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    algorithms: ['HS256']
};
passport_1.default.use(new passport_jwt_1.Strategy(jwtOptions, async (payload, done) => {
    try {
        // Find user by ID from JWT payload
        const user = await db_1.db.user.findUnique({
            where: { id: payload.sub }
        });
        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    }
    catch (error) {
        return done(error, false);
    }
}));
// Helper function to generate JWT tokens
const generateToken = (userId) => {
    const payload = {
        sub: userId,
        iat: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    return jwt_simple_1.default.encode(payload, process.env.JWT_SECRET || 'your-secret-key');
};
exports.generateToken = generateToken;
// Helper function to verify and exchange Azure AD B2C tokens for JWT
const exchangeB2CTokenForJWT = async (b2cToken) => {
    var _a;
    try {
        // Decode the B2C token (in production, validate with B2C public keys)
        const decoded = jwt_simple_1.default.decode(b2cToken, process.env.JWT_SECRET || 'your-secret-key', false);
        // Find or create user based on B2C token claims
        let user = await db_1.db.user.findUnique({ where: { oidc: decoded.oid } });
        if (!user) {
            // Create a new user and a new team for them
            user = await db_1.db.user.create({
                data: {
                    oidc: decoded.oid,
                    email: ((_a = decoded.emails) === null || _a === void 0 ? void 0 : _a[0]) || decoded.email,
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
        const token = (0, exports.generateToken)(user.id);
        return { token, user };
    }
    catch (error) {
        throw new Error('Invalid B2C token');
    }
};
exports.exchangeB2CTokenForJWT = exchangeB2CTokenForJWT;
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await db_1.db.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map