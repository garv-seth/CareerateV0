import { Configuration, LogLevel } from '@azure/msal-browser';

const B2C_TENANT_NAME = process.env.NEXT_PUBLIC_B2C_TENANT_NAME;
const B2C_CLIENT_ID = process.env.NEXT_PUBLIC_B2C_CLIENT_ID;
const B2C_SIGNUP_SIGNIN_POLICY_NAME = process.env.NEXT_PUBLIC_B2C_SIGNUP_SIGNIN_POLICY_NAME;

if (!B2C_TENANT_NAME || !B2C_CLIENT_ID || !B2C_SIGNUP_SIGNIN_POLICY_NAME) {
    throw new Error("Azure AD B2C environment variables are not set. Please check your .env.local file.");
}

export const b2cPolicies = {
    names: {
        signUpSignIn: B2C_SIGNUP_SIGNIN_POLICY_NAME,
    },
    authorities: {
        signUpSignIn: {
            authority: `https://${B2C_TENANT_NAME}.b2clogin.com/${B2C_TENANT_NAME}.onmicrosoft.com/${B2C_SIGNUP_SIGNIN_POLICY_NAME}`,
        },
    },
    authorityDomain: `${B2C_TENANT_NAME}.b2clogin.com`,
};

export const msalConfig: Configuration = {
    auth: {
        clientId: B2C_CLIENT_ID,
        authority: b2cPolicies.authorities.signUpSignIn.authority,
        knownAuthorities: [b2cPolicies.authorityDomain],
        redirectUri: '/',
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
        },
    },
};

export const loginRequest = {
    scopes: []
}; 