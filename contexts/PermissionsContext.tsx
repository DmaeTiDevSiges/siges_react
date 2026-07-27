import React, { createContext, useContext, useState, useEffect } from 'react';
import { Permission } from '../types';
import { dataService } from '../services/dataService';

interface PermissionsContextType {
    permissions: Permission[];
    loading: boolean;
    hasPermission: (routeKey: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'search') => boolean;
    canView: (routeKey: string) => boolean;
    canCreate: (routeKey: string) => boolean;
    canEdit: (routeKey: string) => boolean;
    canDelete: (routeKey: string) => boolean;
    canSearch: (routeKey: string) => boolean;
    refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

interface PermissionsProviderProps {
    children: React.ReactNode;
    currentUser: any; // User type from your auth context
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children, currentUser }) => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPermissions = async () => {
        if (!currentUser?.id) {
            setPermissions([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const userPermissions = await dataService.getUserPermissions(currentUser.id);
            setPermissions(userPermissions);
        } catch (error) {
            console.error('Error loading permissions:', error);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPermissions();
    }, [currentUser?.id, currentUser?.profileId]); // Reload when user or profile changes

    const hasPermission = (
        routeKey: string,
        action: 'view' | 'create' | 'edit' | 'delete' | 'search' = 'view'
    ): boolean => {
        // Super admin bypasses all permission checks
        if (currentUser?.isAdminSuper) return true;

        const permission = permissions.find(p => p.routeKey === routeKey);
        if (!permission) return false;

        switch (action) {
            case 'view': return permission.canView;
            case 'create': return permission.canCreate;
            case 'edit': return permission.canEdit;
            case 'delete': return permission.canDelete;
            case 'search': return permission.canSearch;
            default: return false;
        }
    };

    const canView = (routeKey: string) => hasPermission(routeKey, 'view');
    const canCreate = (routeKey: string) => hasPermission(routeKey, 'create');
    const canEdit = (routeKey: string) => hasPermission(routeKey, 'edit');
    const canDelete = (routeKey: string) => hasPermission(routeKey, 'delete');
    const canSearch = (routeKey: string) => hasPermission(routeKey, 'search');

    return (
        <PermissionsContext.Provider
            value={{
                permissions,
                loading,
                hasPermission,
                canView,
                canCreate,
                canEdit,
                canDelete,
                canSearch,
                refreshPermissions: loadPermissions
            }}
        >
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error('usePermissions must be used within PermissionsProvider');
    }
    return context;
};
