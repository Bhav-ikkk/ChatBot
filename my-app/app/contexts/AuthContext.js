// my-app/app/contexts/AuthContext.js
'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; // Import our new centralized API library

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = useCallback(async () => {
        // Use the same key as in the api.js library
        const storedToken = localStorage.getItem('authToken'); 
        if (storedToken) {
            setToken(storedToken);
            try {
                // Use the new api library which automatically sends the token
                const userData = await api.get('/api/auth/me');
                setUser(userData);
            } catch (error) {
                console.error("Session expired or invalid, logging out.");
                // If fetching user fails, log them out
                localStorage.removeItem('authToken');
                setUser(null);
                setToken(null);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email, password) => {
        try {
            // Use the new api library for the login call
            const data = await api.post('/api/auth/login', { email, password });
            if (data.access_token) {
                localStorage.setItem('authToken', data.access_token);
                setToken(data.access_token);
                await fetchUser(); // Fetch user data immediately after login
                router.push('/dashboard'); // Redirect on successful login
                return { success: true };
            }
            // This part should ideally not be reached if api.js throws an error
            return { success: false, error: "Login failed." };
        } catch (error) {
            return { success: false, error: error.message || "Network error" };
        }
    };

    const register = async (email, username, password) => {
        try {
            // Use the new api library for registration
            await api.post('/api/auth/register', { email, username, password });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message || "Network error" };
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// This custom hook is kept so you don't have to change other files
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
