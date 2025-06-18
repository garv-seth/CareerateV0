'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name?: string;
    teamId: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/user/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                } else {
                    setUser(null);
                    if (pathname !== '/login') {
                        router.push('/login');
                    }
                }
            } catch (error) {
                setUser(null);
                if (pathname !== '/login') {
                    router.push('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [pathname, router]);

    const logout = async () => {
        await fetch('/api/auth/logout');
        setUser(null);
        router.push('/login');
    };

    if (isLoading) {
        return <div>Loading...</div>; // Or a proper loading spinner
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 