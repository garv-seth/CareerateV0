'use client';

import React from 'react';
import { useMsal } from '@azure/msal-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { loginRequest } from '@/auth/msalConfig';

const LoginPage = () => {
    const { instance } = useMsal();

    const handleLogin = () => {
        instance.loginRedirect(loginRequest).catch(e => {
            console.error(e);
        });
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-dark p-8">
            <div className="fixed inset-0 w-full h-full bg-grid-neutral-main/[0.2] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
            <div className="fixed inset-0 w-full h-full bg-gradient-mesh"></div>

            <GlassCard className="max-w-md w-full z-10">
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-white text-center mb-2">Welcome to Careerate</h1>
                    <p className="text-neutral-light text-center mb-8">Your AI Engineering Team awaits.</p>
                    
                    <GlassButton onClick={handleLogin} fullWidth>
                        Login with Microsoft
                    </GlassButton>

                    <p className="text-xs text-neutral-main text-center mt-8">
                        By logging in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </GlassCard>
        </main>
    );
};

export default LoginPage; 