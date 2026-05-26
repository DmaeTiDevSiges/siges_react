import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUserStatus: (isAvailable: boolean, ovIdInProgress: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 * Manages global authentication state
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * Load current user on mount
     */
    useEffect(() => {
        loadCurrentUser();
    }, []);

    /**
     * Load current user from service
     */
    const loadCurrentUser = async () => {
        try {
            const user = await dataService.getCurrentUser();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error loading current user:', error);
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Login user
     */
    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            await dataService.signIn(email, password);
            await loadCurrentUser();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout user
     */
    const logout = async () => {
        try {
            await dataService.signOut();
            setCurrentUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    /**
     * Refresh current user data
     */
    const refreshUser = async () => {
        await loadCurrentUser();
    };

    /**
     * Update user status
     */
    const updateUserStatus = async (isAvailable: boolean, ovIdInProgress: string | null) => {
        if (!currentUser) return;

        try {
            await dataService.updateUserAvailability(currentUser.uuid, isAvailable, ovIdInProgress);

            // Update local state
            setCurrentUser(prev => prev ? {
                ...prev,
                isAvailable,
                ovIdInProgress: ovIdInProgress ?? undefined,
                isOvInProgress: ovIdInProgress ? Number(ovIdInProgress) > 0 : false
            } : null);
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        login,
        logout,
        refreshUser,
        updateUserStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook to use Auth context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
