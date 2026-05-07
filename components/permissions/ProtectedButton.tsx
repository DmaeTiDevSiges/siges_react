import React from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';

interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    routeKey: string;
    action: 'create' | 'edit' | 'delete';
    fallback?: 'hide' | 'disable';
    children: React.ReactNode;
    className?: string;
}

/**
 * ProtectedButton - Botão que respeita permissões do usuário
 * 
 * @param routeKey - Chave da rota (ex: 'assets', 'orders')
 * @param action - Ação requerida ('create', 'edit', 'delete')
 * @param fallback - Comportamento quando sem permissão: 'hide' (padrão) ou 'disable'
 * 
 * @example
 * <ProtectedButton routeKey="assets" action="create" onClick={handleCreate}>
 *   Criar Asset
 * </ProtectedButton>
 */
export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
    routeKey,
    action,
    fallback = 'hide',
    children,
    className = '',
    ...props
}) => {
    const { hasPermission, loading } = usePermissions();

    // Enquanto carrega, não mostra nada
    if (loading) return null;

    const allowed = hasPermission(routeKey, action);

    // Se não tem permissão e fallback é hide, não renderiza
    if (!allowed && fallback === 'hide') {
        return null;
    }

    // Se não tem permissão e fallback é disable, renderiza desabilitado
    if (!allowed && fallback === 'disable') {
        return (
            <button
                {...props}
                disabled
                className={`${className} opacity-50 cursor-not-allowed`}
                title="Você não tem permissão para esta ação"
            >
                {children}
            </button>
        );
    }

    // Tem permissão, renderiza normalmente
    return (
        <button {...props} className={className}>
            {children}
        </button>
    );
};
