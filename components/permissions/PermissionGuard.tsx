import React from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';

interface PermissionGuardProps {
    routeKey: string;
    action?: 'view' | 'create' | 'edit' | 'delete';
    fallback?: React.ReactNode;
    showFallback?: boolean;
    children: React.ReactNode;
}

/**
 * PermissionGuard - Componente genérico para proteger qualquer conteúdo
 * 
 * @param routeKey - Chave da rota (ex: 'assets', 'orders')
 * @param action - Ação requerida (padrão: 'view')
 * @param fallback - Componente a mostrar quando sem permissão
 * @param showFallback - Se deve mostrar fallback ou null (padrão: false = null)
 * 
 * @example
 * <PermissionGuard routeKey="assets" action="edit">
 *   <EditForm />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    routeKey,
    action = 'view',
    fallback = null,
    showFallback = false,
    children
}) => {
    const { hasPermission, loading } = usePermissions();

    // Enquanto carrega, não mostra nada
    if (loading) return null;

    const allowed = hasPermission(routeKey, action);

    if (!allowed) {
        return showFallback ? <>{fallback}</> : null;
    }

    return <>{children}</>;
};
