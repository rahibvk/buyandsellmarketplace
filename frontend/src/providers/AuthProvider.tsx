'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Token } from '../lib/api/types';
import { api } from '../lib/api/client';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../lib/auth/authStore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: any) => Promise<void>;
    signup: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initAuth = async () => {
            const token = getAccessToken();
            const refresh = getRefreshToken();

            if (!token && !refresh) {
                setLoading(false);
                return;
            }

            try {
                // Validation: Try to fetch user. If 401, client.ts handles refresh automatically.
                const currentUser = await api.get<User>('/users/me');
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    // If null or error without throw (unlikely with client logic), clear
                    handleLogoutCleanup();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                handleLogoutCleanup();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const handleLogoutCleanup = () => {
        clearTokens();
        setUser(null);
    };

    const login = async (data: any) => {
        const response = await api.post<Token>('/auth/login', data);
        if (response) {
            setTokens(response.access_token, response.refresh_token);
            if (response.user) {
                setUser(response.user);
            } else {
                // Fetch user if not returned
                const currentUser = await api.get<User>('/users/me');
                if (currentUser) setUser(currentUser);
            }
        }
    };

    const signup = async (data: any) => {
        const response = await api.post<Token>('/auth/signup', data);
        if (response) {
            setTokens(response.access_token, response.refresh_token);
            if (response.user) {
                setUser(response.user);
            } else {
                const currentUser = await api.get<User>('/users/me');
                if (currentUser) setUser(currentUser);
            }
        }
    };

    const logout = async () => {
        const refresh = getRefreshToken();
        if (refresh) {
            try {
                await api.post('/auth/logout', { refresh_token: refresh });
            } catch (e) {
                console.error('Logout API call failed', e);
            }
        }
        handleLogoutCleanup();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
