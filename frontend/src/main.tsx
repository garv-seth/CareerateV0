import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig, MSAL_CONFIG_PLACEHOLDERS } from "./authConfig"; // Import the MSAL config and placeholders

/**
 * MSAL should be instantiated outside of the component tree to prevent it from being re-instantiated on re-renders.
 * For more information, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md
 */
export const msalInstance = new PublicClientApplication(msalConfig);

// Account selection logic is defaulted to acquireTokenSilent with reference to
// https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0] || null);

// Optional: Configure an event callback to handle MSAL events.
// This can be useful for debugging or advanced scenarios.
msalInstance.addEventCallback((event: EventMessage) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const payload = event.payload as AuthenticationResult;
    const account = payload.account;
    msalInstance.setActiveAccount(account);
    console.log("MSAL Login Success:", account);
  } else if (event.eventType === EventType.LOGIN_FAILURE) {
    console.error("MSAL Login Failure:", event.error);
    // Check if the error is due to password reset, and if so, initiate the password reset flow.
    // This logic depends on how your B2C policy is configured and the error codes it returns.
    if (event.error && (event.error.errorMessage?.includes("AADB2C90118") || event.error.errorCode?.includes("AADB2C90118"))) {
      // Error AADB2C90118: The user has forgotten their password.
      // It's generally better to handle this by providing a "Forgot password?" link on your sign-in page
      // that directly initiates the password reset policy, rather than trying to catch it here.
      // However, if you want to redirect from here:
      // import { b2cPolicies } from "./authConfig";
      // msalInstance.loginRedirect(b2cPolicies.authorities.passwordReset).catch(e => console.error(e));
    }
  } else if (event.eventType === EventType.LOGOUT_SUCCESS) {
    console.log("MSAL Logout Success");
    msalInstance.setActiveAccount(null);
  }
});

// Check if placeholders are still default, and if so, show a warning
if (
  MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_CLIENT_ID === "YOUR_CLIENT_ID" ||
  MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_TENANT_NAME === "YOUR_TENANT_NAME" ||
  MSAL_CONFIG_PLACEHOLDERS.AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY === "YOUR_SIGNUP_SIGNIN_POLICY_NAME"
) {
  console.warn(
    "MSAL Configuration Warning: Azure AD B2C placeholders in src/authConfig.ts have not been updated. " +
    "Authentication will not work correctly until these are replaced with your actual application details."
  );
}


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </MsalProvider>
  </React.StrictMode>
);
