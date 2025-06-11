import { Configuration } from "@azure/msal-browser";

// B2C user flows and custom policies
export const b2cPolicies = {
    names: {
        signUpSignIn: import.meta.env.VITE_B2C_SIGNUP_SIGNIN_POLICY_NAME || "B2C_1_signupsignin",
    },
    authorities: {
        signUpSignIn: {
            authority: `https://${import.meta.env.VITE_B2C_TENANT_NAME}.b2clogin.com/${import.meta.env.VITE_B2C_TENANT_NAME}.onmicrosoft.com/${import.meta.env.VITE_B2C_SIGNUP_SIGNIN_POLICY_NAME || "B2C_1_signupsignin"}`,
        },
    },
    authorityDomain: `${import.meta.env.VITE_B2C_TENANT_NAME}.b2clogin.com`,
};

// MSAL configuration
export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_B2C_CLIENT_ID || "", // Fallback to empty string
        authority: b2cPolicies.authorities.signUpSignIn.authority,
        knownAuthorities: [b2cPolicies.authorityDomain],
        redirectUri: window.location.origin + '/auth/callback', // Must match with AAD B2C configuration
        postLogoutRedirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case 0: // Error
                        console.error(message);
                        return;
                    case 1: // Warning
                        console.warn(message);
                        return;
                    case 2: // Info
                        console.info(message);
                        return;
                    case 3: // Verbose
                        console.debug(message);
                        return;
                }
            },
        },
    },
};

// Login request configuration
export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
  prompt: 'select_account'
};

// Silent token request configuration
export const tokenRequest = {
  scopes: ['openid', 'profile', 'email'],
  forceRefresh: false
}; 