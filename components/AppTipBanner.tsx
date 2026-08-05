import React, { useState } from 'react';
import { AppTip } from '../types';
import { useAppTips } from '../hooks/useAppTips';
import { Modal } from './ui/Modal';

interface AppTipBannerProps {
    screenKey: string;
    userId?: number;
    userCompanyId?: number | null;
    userDepartmentId?: number | null;
    userProfileId?: number | null;
}

export const AppTipBanner: React.FC<AppTipBannerProps> = ({ screenKey, userId, userCompanyId, userDepartmentId, userProfileId }) => {
    const { currentTip, loading, dismissTip } = useAppTips({ screenKey, userId, userCompanyId, userDepartmentId, userProfileId });
    const [expanded, setExpanded] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);

    if (loading || !currentTip) return null;

    const handleDismiss = async () => {
        setIsDismissing(true);
        await dismissTip(currentTip.id);
        setIsDismissing(false);
    };

    return (
        <>
            <div className="w-full border-b border-blue-100 dark:border-blue-900/30 bg-blue-50/80 dark:bg-blue-900/10 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3 px-4 py-3">
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                        {currentTip.icon || 'lightbulb'}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                            {currentTip.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {currentTip.body}
                        </p>
                    </div>
                    <button
                        onClick={() => setExpanded(true)}
                        className="shrink-0 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
                    </button>
                </div>
            </div>

            <Modal
                isOpen={expanded}
                onClose={() => setExpanded(false)}
                title={currentTip.title}
                type="info"
                maxWidth="sm"
                confirmLabel="Dispensar"
                onConfirm={handleDismiss}
                confirmLoading={isDismissing}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-primary">
                            {currentTip.icon || 'lightbulb'}
                        </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {currentTip.body}
                    </div>
                </div>
            </Modal>
        </>
    );
};
