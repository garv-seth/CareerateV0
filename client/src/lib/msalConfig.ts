import { Configuration, LogLevel } from '@azure/msal-browser';

// MSAL configuration for Azure AD B2C
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_B2C_CLIENT_ID || '',
    authority: `https://${import.meta.env.VITE_B2C_TENANT_NAME?.split('.onmicrosoft.com')[0]}.b2clogin.com/${import.meta.env.VITE_B2C_TENANT_NAME}/${import.meta.env.VITE_B2C_SIGNUP_SIGNIN_POLICY_NAME}`,
    knownAuthorities: [`${import.meta.env.VITE_B2C_TENANT_NAME?.split('.onmicrosoft.com')[0]}.b2clogin.com`],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
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
      }
    }
  }
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