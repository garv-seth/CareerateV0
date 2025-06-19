'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig, validateConfig } from './msalConfig';
import { useStore } from '@/lib/store';
import LoginPage from '@/app/login/page';

// Create MSAL instance conditionally to handle build-time scenarios
let msalInstance: PublicClientApplication | null = null;

if (typeof window !== 'undefined') {
    try {
        validateConfig();
        msalInstance = new PublicClientApplication(msalConfig);
    } catch (error) {
        console.error('MSAL configuration error:', error);
    }
}

// This is a separate component to ensure it re-renders when authentication state changes
const AuthHandler = ({ children }: { children: ReactNode }) => {
    const { instance, accounts } = useMsal();
    const setAuthToken = useStore((state) => state.setAuthToken);
    const isAuthenticated = useIsAuthenticated();
    const router = useRouter();

    useEffect(() => {
        const exchangeToken = async () => {
            if (isAuthenticated && accounts[0]) {
                try {
                    const response = await instance.acquireTokenSilent({
                        scopes: [], // No extra scopes needed for B2C id_token
                        account: accounts[0],
                    });
                    
                    // Got B2C token, now exchange it for our app's JWT
                    const apiResponse = await fetch('/api/auth/token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: response.idToken }),
                    });

                    if (apiResponse.ok) {
                        const { token, user } = await apiResponse.json();
                        setAuthToken(token);
                        // Maybe set user in store too
                        router.push('/'); // Redirect to dashboard after successful token exchange
                    } else {
                        // Handle failed token exchange
                        console.error('Failed to exchange B2C token for app JWT.');
                        instance.logoutRedirect();
                    }
                } catch (error) {
                    console.error('MSAL token acquisition error:', error);
                    instance.logoutRedirect();
                }
            }
        };

        exchangeToken();

    }, [isAuthenticated, accounts, instance, setAuthToken, router]);

    return <>{children}</>;
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // Handle case where MSAL instance is not available (e.g., during build)
    if (!msalInstance) {
        // Return children directly during build/SSR
        if (typeof window === 'undefined') {
            return <>{children}</>;
        }
        // Show error in browser if config is missing
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-dark">
                <div className="text-white text-center">
                    <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
                    <p>Azure AD B2C configuration is missing. Please check your environment variables.</p>
                </div>
            </div>
        );
    }

    return (
        <MsalProvider instance={msalInstance}>
            <AuthenticatedTemplate>
                <AuthHandler>
                    {children}
                </AuthHandler>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <LoginPage />
            </UnauthenticatedTemplate>
        </MsalProvider>
    );
};

// A simplified useAuth hook for convenience, if needed later
export const useAuth = () => {
    const authToken = useStore((state) => state.authToken);
    const user = useStore(state => state.agents.find(a => a.id === "user")); // Example user retrieval
    return {
        isAuthenticated: !!authToken,
        user,
    };
}; 