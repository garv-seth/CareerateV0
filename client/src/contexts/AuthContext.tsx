import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig, loginRequest, tokenRequest } from '@/lib/msalConfig';
import { useUserStore, authHelpers } from '@/state/userStore';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

interface AuthContextType {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setAuth, clearAuth, setLoading } = useUserStore();

  // Initialize MSAL and check for existing sessions
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        
        // Check if user is already signed in
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const account = accounts[0];
          if (account) {
            await handleAuthSuccess(account);
          }
        }
      } catch (err) {
        console.error('MSAL initialization failed:', err);
        setError('Authentication initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMsal();
  }, []);

  const handleAuthSuccess = async (account: AccountInfo) => {
    try {
      setLoading(true);
      
      // Get access token silently
      const response: AuthenticationResult = await msalInstance.acquireTokenSilent({
        ...tokenRequest,
        account
      });

      // Extract user info from the token
      const userProfile = {
        id: account.localAccountId,
        email: account.username,
        displayName: account.name || account.username,
        skillLevel: 'intermediate' as const,
        workDomain: 'software_development' as const,
        goals: ['increase_productivity', 'learn_ai_tools'],
        preferences: {
          theme: 'system' as const,
          notifications: true,
          learningStyle: 'visual' as const,
          difficultyPreference: 'intermediate' as const,
          autoSync: true,
          privacy: {
            shareData: true,
            trackingEnabled: true,
            anonymousAnalytics: true
          }
        }
      };

      const authData = {
        user: userProfile,
        auth: {
          accessToken: response.accessToken,
          refreshToken: '', // B2C doesn't use refresh tokens in browser
          tokenExpiry: response.expiresOn?.getTime() || Date.now() + 3600000
        }
      };

      // Update Zustand store
      setAuth(authData);
      
      // Store tokens securely
      authHelpers.storeAuthTokens(authData.auth);
      
    } catch (error) {
      console.error('Silent token acquisition failed:', error);
      // If silent token acquisition fails, clear auth state
      clearAuth();
      authHelpers.clearAuthTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response: AuthenticationResult = await msalInstance.loginPopup(loginRequest);
      
      if (response.account) {
        await handleAuthSuccess(response.account);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear local state first
      clearAuth();
      authHelpers.clearAuthTokens();
      
      // Sign out from Azure AD B2C
      await msalInstance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
        account: msalInstance.getAllAccounts()[0]
      });
      
    } catch (err: any) {
      console.error('Logout failed:', err);
      setError(err.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    login,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 