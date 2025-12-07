import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister, verifyToken } from '../lib/api';
import type { User, LoginData, RegisterData } from '../lib/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const result = await getCurrentUser();
            if (result && result.user) {
                setUser(result.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            setUser(null);
        }
    };

    useEffect(() => {
        // Initialize auth state
        const initAuth = async () => {
            try {
                // Check if we have a token and verify it
                const { valid, user: verifiedUser } = await verifyToken();
                if (valid && verifiedUser) {
                    setUser(verifiedUser);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        // Check for OAuth callback token in URL
        const params = new URLSearchParams(window.location.search);
        const authToken = params.get('auth_token');
        const authError = params.get('auth_error');

        if (authToken) {
            // Store token from OAuth callback
            localStorage.setItem('auth_token', authToken);
            window.history.replaceState({}, document.title, window.location.pathname);
            initAuth();
        } else if (authError) {
            console.error('OAuth error:', authError);
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
        } else {
            initAuth();
        }
    }, []);

    const login = async (data: LoginData) => {
        const result = await apiLogin(data);
        setUser(result.user);
    };

    const register = async (data: RegisterData) => {
        const result = await apiRegister(data);
        setUser(result.user);
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
    };

    // Compute isAdmin from user role
    const isAdmin = user?.role === 'admin';

    const value: AuthContextType = {
        user,
        loading,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
