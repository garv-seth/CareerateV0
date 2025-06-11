import { Configuration, PopupRequest } from '@azure/msal-browser';

// Please replace the following with your own Azure B2C application configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: 'e8b1c661-2139-4583-a9ca-ce0c1cb948d1',
    authority: `https://careerate.b2clogin.com/careerate.onmicrosoft.com/B2C_1_signup_signin1`,
    knownAuthorities: ['careerate.b2clogin.com'],
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