import React from 'react';
import { usePermissions } from '../contexts/PermissionsContext';
import { Loading } from './ui/Loading';


interface ProtectedRouteProps {
    routeKey: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireAction?: 'view' | 'create' | 'edit' | 'delete';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    routeKey,
    children,
    fallback,
    requireAction = 'view'
}) => {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <Loading size="md" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Verificando permissões...
                    </p>
                </div>
            </div>
        );
    }

    if (!hasPermission(routeKey, requireAction)) {
        return fallback || (
            <div className="flex flex-col items-center justify-center h-screen gap-6 p-8 bg-background-light dark:bg-background-dark">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-red-500">block</span>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Acesso Negado
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md">
                        Você não tem permissão para acessar esta página. Entre em contato com o administrador do sistema.
                    </p>
                </div>
                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                    Voltar
                </button>
            </div>
        );
    }

    return <>{children}</>;
};
