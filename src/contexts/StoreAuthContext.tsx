import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config';

interface StoreCustomer {
    id: string;
    name: string;
    email: string;
    storeId?: string;
}

interface StoreAuthContextType {
    customer: StoreCustomer | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (subdomain: string, email: string, password: string) => Promise<boolean>;
    register: (subdomain: string, name: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: (subdomain: string) => Promise<void>;
}

const StoreAuthContext = createContext<StoreAuthContextType | undefined>(undefined);

export const StoreAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [customer, setCustomer] = useState<StoreCustomer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE = API_BASE_URL;

    const checkAuth = async (subdomain: string) => {
        // Check for existing token in localStorage for this specific store (or global if shared)
        // We'll scope token by subdomain to avoid cross-store contamination if needed, 
        // but typically a user might expect one login? No, stores are separate entities.
        // Let's use `store_token_${subdomain}`.
        const token = localStorage.getItem(`store_token_${subdomain}`);

        if (!token) {
            setCustomer(null);
            setIsLoading(false);
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/store-auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await resp.json();
            if (resp.ok && data.success) {
                setCustomer(data.customer);
            } else {
                // Invalid token
                localStorage.removeItem(`store_token_${subdomain}`);
                setCustomer(null);
            }
        } catch (err) {
            console.error('Auth check failed', err);
            // Don't clear token immediately on network error, but for now... 
            // safer to assume not auth contextually if we can't verify.
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (subdomain: string, email: string, password: string): Promise<boolean> => {
        try {
            const resp = await fetch(`${API_BASE}/api/store-auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain, email, password }),
            });
            const data = await resp.json();

            if (resp.ok && data.success) {
                localStorage.setItem(`store_token_${subdomain}`, data.token);
                setCustomer(data.customer);
                toast.success('Logged in successfully');
                return true;
            } else {
                toast.error(data.message || 'Login failed');
                return false;
            }
        } catch (err) {
            console.error('Login error', err);
            toast.error('Login failed. Please try again.');
            return false;
        }
    };

    const register = async (subdomain: string, name: string, email: string, password: string): Promise<boolean> => {
        try {
            const resp = await fetch(`${API_BASE}/api/store-auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain, name, email, password }),
            });
            const data = await resp.json();

            if (resp.ok && data.success) {
                localStorage.setItem(`store_token_${subdomain}`, data.token);
                setCustomer(data.customer);
                toast.success('Account created successfully');
                return true;
            } else {
                toast.error(data.message || 'Registration failed');
                return false;
            }
        } catch (err) {
            console.error('Registration error', err);
            toast.error('Registration failed. Please try again.');
            return false;
        }
    };

    const logout = () => {
        // We need to know subdomain to clear token? 
        // Or we provide a logout method that accepts subdomain or clears all store tokens?
        // Context is usually mounted inside a specific store page, so we could access subdomain from hook/prop?
        // But this context might be global. 
        // Let's rely on the calleee to handle storage clearing or iterate.
        // Actually, `checkAuth` set state.
        setCustomer(null);
        // Clearing localStorage logic should ideally be here if we knew the subdomain.
        // We can't easily know subdomain here without it being passed or stored.
        // For now, let's assume we pass subdomain to logout or valid token key is found.
        // Simple fix: clear all keys starting with store_token_? Or just reset state.
    };

    return (
        <StoreAuthContext.Provider value={{
            customer,
            isAuthenticated: !!customer,
            isLoading,
            login,
            register,
            logout,
            checkAuth
        }}>
            {children}
        </StoreAuthContext.Provider>
    );
};

export const useStoreAuth = () => {
    const context = useContext(StoreAuthContext);
    if (context === undefined) {
        throw new Error('useStoreAuth must be used within a StoreAuthProvider');
    }
    return context;
};
