import React from 'react';

interface AccessDeniedProps {
    message?: string;
    onBack?: () => void;
}

/**
 * AccessDenied - Componente para mostrar quando usuário não tem acesso a uma rota
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({
    message = 'Você não tem permissão para acessar esta página',
    onBack
}) => {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
            <div className="text-center max-w-md">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
                    lock
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Acesso Negado
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                </p>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Voltar
                    </button>
                )}
            </div>
        </div>
    );
};
