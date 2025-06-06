export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_B2C_CLIENT_ID,
    authority: `https://${import.meta.env.VITE_B2C_TENANT_NAME}.b2clogin.com/${import.meta.env.VITE_B2C_TENANT_NAME}.onmicrosoft.com/${import.meta.env.VITE_B2C_SIGNUP_SIGNIN_POLICY_NAME}`,
    knownAuthorities: [`${import.meta.env.VITE_B2C_TENANT_NAME}.b2clogin.com`],
    redirectUri: "/",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["https://graph.microsoft.com/User.Read"],
}; 