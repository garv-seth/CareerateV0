import { Configuration, PopupRequest } from '@azure/msal-browser';

// Please replace the following with your own Azure B2C application configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_AD_B2C_CLIENT_ID || 'YOUR_CLIENT_ID',
    authority: `https://YOUR_TENANT_NAME.b2clogin.com/YOUR_TENANT_NAME.onmicrosoft.com/YOUR_USER_FLOW`,
    knownAuthorities: ['YOUR_TENANT_NAME.b2clogin.com'],
    redirectUri: '/callback',
    postLogoutRedirectUri: '/',
    navigateToLoginRequestUrl: false,
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

export const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "offline_access"]
}; 