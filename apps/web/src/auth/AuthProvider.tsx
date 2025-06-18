'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from './msalConfig';
import { useStore } from '@/lib/store';
import LoginPage from '@/app/login/page';

const msalInstance = new PublicClientApplication(msalConfig);

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