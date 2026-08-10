import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';

interface ManusIntegrationProps {
    contractId?: string;
    visitId: string;
    onOpenManus?: () => void;
}

/**
 * Componente que verifica se o contrato usa Manus e exibe botão de integração
 */
export const ManusIntegration: React.FC<ManusIntegrationProps> = ({ 
    contractId, 
    visitId,
    onOpenManus 
}) => {
    const [isManusEnabled, setIsManusEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkManusIntegration = async () => {
            if (!contractId) {
                setIsLoading(false);
                return;
            }

            try {
                const usesManus = await dataService.checkContractUsesManus(contractId);
                setIsManusEnabled(usesManus);
            } catch (error) {
                console.error('Error checking Manus integration:', error);
                setIsManusEnabled(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkManusIntegration();
    }, [contractId]);

    if (isLoading || !isManusEnabled) {
        return null;
    }

    const handleOpenManus = () => {
        if (onOpenManus) {
            onOpenManus();
        } else {
            // Fallback: abre em nova aba com parâmetros
            const manusUrl = `https://manus.app/visit/${visitId}`;
            window.open(manusUrl, '_blank');
        }
    };

    return (
        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">
                    integration_instructions
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Integração Manus
                </span>
            </div>
            
            <button
                onClick={handleOpenManus}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-sm uppercase rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">
                    open_in_new
                </span>
                Abrir no Manus
            </button>
        </div>
    );
};
