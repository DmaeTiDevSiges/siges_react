import React from 'react';
import { Modal } from './Modal';
import { Loading } from './Loading';

export interface ActionButton {
    label: string;
    icon?: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'slate' | 'ghost' | 'success';
}

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: React.ReactNode;
    icon?: string;
    iconClassName?: string;
    iconBgClassName?: string;
    iconRingClassName?: string;
    primaryAction?: ActionButton;
    secondaryAction?: ActionButton;
    footerText?: React.ReactNode;
    isLoading?: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    icon = 'warning',
    iconClassName = 'text-red-500',
    iconBgClassName = 'bg-red-50 dark:bg-red-900/20',
    iconRingClassName = 'ring-red-50/50 dark:ring-red-900/10',
    primaryAction,
    secondaryAction,
    footerText,
    isLoading = false
}) => {
    
    const renderButton = (action: ActionButton, isPrimary: boolean) => {
        const { label, icon: actionIcon, onClick, disabled, loading, variant = isPrimary ? 'slate' : 'secondary' } = action;
        
        const baseClasses = "w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed";
        
        let variantClasses = "";
        switch (variant) {
            case 'primary':
                variantClasses = "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25";
                break;
            case 'danger':
                variantClasses = "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25";
                break;
            case 'success':
                variantClasses = "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25";
                break;
            case 'slate':
                variantClasses = "bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-lg shadow-slate-900/20";
                break;
            case 'secondary':
                variantClasses = "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300";
                break;
            case 'ghost':
                variantClasses = "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800";
                break;
        }

        const isBtnLoading = isLoading || loading;
        const isBtnDisabled = isBtnLoading || disabled;

        return (
            <button
                key={label}
                onClick={onClick}
                disabled={isBtnDisabled}
                className={`${baseClasses} ${variantClasses}`}
            >
                {isBtnLoading ? (
                    <>
                        <Loading size="xs" />
                        {label}
                    </>
                ) : (
                    <>
                        {actionIcon && (
                            <span className="material-symbols-outlined text-[20px]">
                                {actionIcon}
                            </span>
                        )}
                        {label}
                    </>
                )}
            </button>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={isLoading ? () => {} : onClose}
            title={title}
            hideHeader={true}
            maxWidth="sm"
            noPadding={false}
        >
            <div className="flex flex-col items-center text-center pt-2">
                {/* Ícone */}
                {icon && (
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ring-8 animate-in zoom-in duration-300 ${iconBgClassName} ${iconRingClassName}`}>
                        <span className={`material-symbols-outlined text-4xl ${iconClassName}`}>
                            {icon}
                        </span>
                    </div>
                )}

                {/* Título */}
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                    {title}
                </h3>

                {/* Descrição */}
                {description && (
                    <div className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-[90%]">
                        {description}
                    </div>
                )}

                {/* Ações */}
                <div className="flex flex-col gap-3 w-full">
                    {primaryAction && renderButton(primaryAction, true)}
                    {secondaryAction && renderButton(secondaryAction, false)}
                </div>

                {/* Rodapé Opcional */}
                {footerText && (
                    <div className="mt-8 text-xs italic text-slate-400 dark:text-slate-500 max-w-[90%]">
                        {footerText}
                    </div>
                )}
            </div>
        </Modal>
    );
};
