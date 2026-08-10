import React from 'react';
import { Modal } from './Modal';
import { Loading } from './Loading';


interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: React.ReactNode; // ReactNode para permitir negrito ou elementos
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Excluir Registro',
    description = 'Tem certeza que deseja remover este item? Esta ação não pode ser desfeita.',
    confirmText = 'EXCLUIR',
    cancelText = 'CANCELAR',
    isLoading = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={isLoading ? () => { } : onClose}
            title={title}
            hideHeader={true}
            maxWidth="sm"
            noPadding={false}
        >
            <div className="flex flex-col items-center text-center pt-2">
                {/* Ícone de Lixeira com Estilo Premium */}
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50 dark:ring-red-900/10 animate-in zoom-in duration-300">
                    <span className="material-symbols-outlined text-4xl text-red-500">
                        delete
                    </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                    {title}
                </h3>

                <div className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-[85%]">
                    {description}
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm uppercase tracking-wider
                        bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all shadow-lg shadow-red-500/25
                        disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                        {isLoading ? (
                            <>
                                <Loading size="xs" />
                                EXCLUINDO...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-2xl text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
