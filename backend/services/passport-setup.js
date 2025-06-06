import passport from 'passport';
import { BearerStrategy } from 'passport-azure-ad';

const config = {
  credentials: {
    tenantName: process.env.B2C_TENANT_NAME,
    clientID: process.env.B2C_CLIENT_ID,
  },
  policyName: process.env.B2C_SIGNUP_SIGNIN_POLICY_NAME,
  isB2C: true,
  validateIssuer: true,
  loggingLevel: 'info',
  passReqToCallback: false,
};

const bearerStrategy = new BearerStrategy(config, (token, done) => {
  // Send user info back to callback
  return done(null, token, null);
});

passport.use(bearerStrategy);

export default passport; 