import React, { useState } from 'react';
import { Unit, UnitStructureNode } from '../../../../types';
import { UnitStructureOrganogram } from '../../../../components/units/UnitStructureOrganogram';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { useAuth } from '../../../../contexts/AuthContext';

interface UnitStructureProps {
    unit: Unit;
    onBack: () => void;
    /** Chamado quando um re-parent é persistido (para o pai invalidar caches) */
    onStructureChanged?: () => void;
}

export const UnitStructure: React.FC<UnitStructureProps> = ({
    unit,
    onBack,
    onStructureChanged
}) => {
    const { canView } = usePermissions();
    const { currentUser } = useAuth();
    // Interação no organograma (arrastar/reordenar) é exclusiva de is_admin_super
    const canInteract = currentUser?.isAdminSuper === true;
    const [refreshKey, setRefreshKey] = useState(0);

    const handleStructureChanged = () => {
        setRefreshKey(k => k + 1); // garante consistência local após persistir
        onStructureChanged?.();
    };

    if (!canView('units')) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background-light dark:bg-background-dark">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-red-500 text-[40px]">lock</span>
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Acesso Negado</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
                    Você não tem permissão para visualizar a estrutura desta unidade.
                </p>
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 p-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
                        title="Voltar"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">account_tree</span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-black uppercase tracking-wide truncate leading-tight">
                            Estrutura da Unidade
                        </h1>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate">
                            {unit.description || unit.code || 'Unidade'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {canInteract
                                ? 'Arraste sobre um setor para subordiná-lo, entre dois setores para reordenar, ou na zona inferior para nível principal.'
                                : 'Visualização somente leitura da hierarquia de setores.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                <UnitStructureOrganogram
                    key={`structure-${unit.id}`}
                    unitId={unit.id}
                    refreshKey={refreshKey}
                    onStructureChanged={handleStructureChanged}
                />
            </div>
        </div>
    );
};
