import { Configuration, LogLevel } from "@azure/msal-browser";

// README:
// 1. Fill in the placeholder values below with your Azure AD B2C application registration details.
// 2. Ensure your Azure AD B2C application has the redirect URI configured to match `redirectUri` below 
//    (e.g., http://localhost:5173 or your production URL).
// 3. Common user flows/policies include sign-up/sign-in, password reset, and profile edit.
//    The authority is typically: https://<TENANT_NAME>.b2clogin.com/<TENANT_NAME>.onmicrosoft.com/<POLICY_NAME>
//    Or for custom domains: https://<YOUR_CUSTOM_DOMAIN>/<TENANT_NAME>.onmicrosoft.com/<POLICY_NAME>

export const MSAL_CONFIG_PLACEHOLDERS = {
  AZURE_AD_B2C_TENANT_NAME: "YOUR_TENANT_NAME", // e.g., "contoso"
  AZURE_AD_B2C_CLIENT_ID: "YOUR_CLIENT_ID", // Application (client) ID from Azure portal
  AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY: "YOUR_SIGNUP_SIGNIN_POLICY_NAME", // e.g., "B2C_1_SignUpSignIn"
  AZURE_AD_B2C_PASSWORD_RESET_POLICY: "YOUR_PASSWORD_RESET_POLICY_NAME", // e.g., "B2C_1_PasswordReset"
  AZURE_AD_B2C_PROFILE_EDIT_POLICY: "YOUR_PROFILE_EDIT_POLICY_NAME", // e.g., "B2C_1_ProfileEdit" (optional)
  AZURE_AD_B2C_CUSTOM_DOMAIN: "", // Optional: e.g., "login.careerate.com" if using custom domain for B2C login
  // Optional: If your tenant ID is different from TENANT_NAME.onmicrosoft.com
  AZURE_AD_B2C_TENANT_ID_OVERRIDE: "", // e.g., "YOUR_TENANT_NAME.onmicrosoft.com" or a GUID for tenant ID
};

const tenantName = MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_TENANT_NAME;
const tenantId = MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_TENANT_ID_OVERRIDE || `${tenantName}.onmicrosoft.com`;
const customDomain = MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_CUSTOM_DOMAIN;

const b2cLoginHost = customDomain ? customDomain : `${tenantName}.b2clogin.com`;

export const b2cPolicies = {
  names: {
    signUpSignIn: MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY,
    passwordReset: MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_PASSWORD_RESET_POLICY,
    profileEdit: MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_PROFILE_EDIT_POLICY,
  },
  authorities: {
    signUpSignIn: {
      authority: `https://${b2cLoginHost}/${tenantId}/${MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY}`,
    },
    passwordReset: {
      authority: `https://${b2cLoginHost}/${tenantId}/${MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_PASSWORD_RESET_POLICY}`,
    },
    profileEdit: {
      authority: `https://${b2cLoginHost}/${tenantId}/${MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_PROFILE_EDIT_POLICY}`,
    },
  },
  authorityDomain: b2cLoginHost,
};

export const msalConfig: Configuration = {
  auth: {
    clientId: MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_CLIENT_ID,
    authority: b2cPolicies.authorities.signUpSignIn.authority,
    knownAuthorities: [b2cPolicies.authorityDomain],
    redirectUri: window.location.origin, // Or your specific redirect URI like "http://localhost:5173" or production URI
    postLogoutRedirectUri: window.location.origin, // Or specific page
    navigateToLoginRequestUrl: false, 
  },
  cache: {
    cacheLocation: "sessionStorage", // "localStorage" or "sessionStorage" or "memoryStorage"
    storeAuthStateInCookie: false, // Set to true if you have issues on IE11 or Edge
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
            // console.info(message); // Disable info logs for cleaner console
            return;
          case LogLevel.Verbose:
            // console.debug(message); // Disable verbose logs
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
      logLevel: LogLevel.Warning, // Set to LogLevel.Verbose for detailed debugging
    },
    // This will impact performance negatively and should be used only for debugging purposes.
    // allowNativeBroker: false, 
  },
};

// Define scopes for MSAL requests
// https://learn.microsoft.com/en-us/azure/active-directory-b2c/access-tokens#scopes
// You typically need to request "openid", "profile", and access to your backend APIs.
// Example: ["openid", "profile", "https://yourtenant.onmicrosoft.com/api/tasks.read"]
export const loginRequest = {
  scopes: [
    "openid", 
    "profile",
    // Add any backend API scopes here if needed, e.g.:
    // `https://${tenantId}/your_api_name/YourScope.Read`,
    // `https://${tenantId}/your_api_name/YourScope.Write`,
  ],
};

// Add here scopes for access token request for backend APIs
export const tokenRequest = {
    scopes: [
      // `https://${tenantId}/your_api_name/YourScope.Read`,
      // `https://${tenantId}/your_api_name/YourScope.Write`,
    ], 
    forceRefresh: false // Set to true to skip cache for an access token
}; 