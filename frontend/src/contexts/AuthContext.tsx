import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig, loginRequest, tokenRequest } from '@/lib/msalConfig';
import { useUserStore, authHelpers } from '@/state/userStore';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

interface AuthContextType {
  isAuthenticated: boolean;
  user: any; // Consider defining a user type
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { instance, inProgress } = useMsal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const activeAccount = instance.getActiveAccount();
    if (activeAccount) {
      setUser(activeAccount);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [instance]);

  const login = () => {
    instance.loginRedirect().catch(e => console.error(e));
  };

  const logout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: '/' });
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading: inProgress !== InteractionStatus.None || isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 