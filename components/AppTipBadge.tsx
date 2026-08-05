import React, { useState } from 'react';
import { useAppTipsCount } from '../hooks/useAppTips';
import { AppTip } from '../types';
import { Modal } from './ui/Modal';

interface AppTipBadgeProps {
    userId?: number;
    userCompanyId?: number | null;
    userDepartmentId?: number | null;
    userProfileId?: number | null;
    allTips?: AppTip[];
    onDismissTip?: (tipId: number) => void;
}

export const AppTipBadge: React.FC<AppTipBadgeProps> = ({ userId, userCompanyId, userDepartmentId, userProfileId, allTips = [], onDismissTip }) => {
    const { count } = useAppTipsCount({ userId, userCompanyId, userDepartmentId, userProfileId });
    const [showPanel, setShowPanel] = useState(false);

    if (count === 0) return null;

    return (
        <>
            <button
                onClick={() => setShowPanel(true)}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-xl">
                    tips_and_updates
                </span>
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold px-1">
                    {count}
                </span>
            </button>

            <Modal
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
                title="Dicas do App"
                type="info"
                maxWidth="sm"
                hideCancelButton
                confirmLabel="Fechar"
                onConfirm={() => setShowPanel(false)}
            >
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {allTips.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                            Nenhuma dica disponível no momento.
                        </p>
                    ) : (
                        allTips.map((tip) => (
                            <div
                                key={tip.id}
                                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
                            >
                                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">
                                    {tip.icon || 'lightbulb'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {tip.title}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {tip.body}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onDismissTip?.(tip.id)}
                                    className="shrink-0 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-slate-400 text-[16px]">close</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </>
    );
};
