import * as msal from '@azure/msal-node';
import dotenv from 'dotenv';

dotenv.config();

const b2cTenantName = process.env.B2C_TENANT_NAME;
const signUpSignInPolicy = process.env.B2C_SIGNUP_SIGNIN_POLICY_NAME;
const b2cClientId = process.env.B2C_CLIENT_ID;
const b2cRedirectUri = process.env.B2C_REDIRECT_URI;

if (!b2cTenantName || !signUpSignInPolicy || !b2cClientId || !b2cRedirectUri) {
  console.error(
    'Azure AD B2C configuration missing. Please set B2C_TENANT_NAME, B2C_SIGNUP_SIGNIN_POLICY_NAME, B2C_CLIENT_ID, and B2C_REDIRECT_URI in your environment variables.'
  );
  // Optionally, exit if critical for startup, or allow app to run with auth disabled for some routes
  // process.exit(1);
}

const msalConfig: msal.Configuration = {
  auth: {
    clientId: b2cClientId || '',
    authority: `https://${b2cTenantName}.b2clogin.com/${b2cTenantName}.onmicrosoft.com/${signUpSignInPolicy}`,
    knownAuthorities: [`${b2cTenantName}.b2clogin.com`],
    // clientSecret: process.env.B2C_CLIENT_SECRET, // Only if using confidential client flows like auth code flow directly on backend
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose, // Or Info, Warning, Error for less noise
    },
  },
};

const msalInstance = new msal.ConfidentialClientApplication(msalConfig);
// Or PublicClientApplication if your backend is just validating tokens acquired by a public client (SPA)
// However, for web APIs, often you are validating tokens. If the backend itself needs to acquire tokens
// on behalf of a user (e.g. for a different resource), ConfidentialClientApplication might be needed.
// For simple bearer token validation from an SPA, you might not even need to instantiate the full client like this,
// but rather use a library like 'jsonwebtoken' with 'jwks-rsa' to verify against B2C's public keys.
// Given the direct use of msal-node, this setup implies more active participation by the backend.

// This is a simplified setup. Token validation would typically involve fetching the token from the 
// Authorization header and using msalInstance.acquireTokenByClientCredential or similar, or verifying 
// the token signature against B2C's public keys.

// For now, let's export the config and instance for use in middleware/routes.
export { msalConfig, msalInstance };

// More robust token validation middleware will be created separately. 