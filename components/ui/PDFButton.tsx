import React from 'react';
import { FaFilePdf } from 'react-icons/fa';
import { Loading } from './Loading';

interface PDFButtonProps {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    loading?: boolean;
    disabled?: boolean;
    /** Texto do botão (padrão "PDF"). */
    label?: string;
    /** Quantidade exibida entre parênteses: "PDF (12)". */
    count?: number;
    className?: string;
    title?: string;
    /** Só o ícone (quadrado 32×32) — para cards e linhas compactas. */
    iconOnly?: boolean;
}

/**
 * Botão PDF PADRÃO do app (vermelho, ícone + "PDF"). Todo botão de exportar/baixar PDF
 * usa este componente — não recriar o estilo nos botões de relatório.
 */
export const PDFButton: React.FC<PDFButtonProps> = ({
    onClick,
    loading = false,
    disabled = false,
    label = 'PDF',
    count,
    className = '',
    title = 'Exportar PDF',
    iconOnly = false,
}) => {
    const base = 'flex items-center bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 shrink-0';
    const shape = iconOnly ? 'justify-center w-8 h-8' : 'gap-2 px-3 py-1.5 text-xs';
    const cursor = loading ? 'disabled:cursor-wait' : 'disabled:cursor-not-allowed';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading || disabled}
            className={`${base} ${shape} ${cursor} ${className}`}
            title={title}
            aria-label={iconOnly ? title : undefined}
        >
            {loading ? <Loading size="xs" /> : <FaFilePdf className="text-[14px]" />}
            {!iconOnly && (
                <span className="font-black uppercase tracking-tight">
                    {label}{count !== undefined && count !== null ? ` (${count})` : ''}
                </span>
            )}
        </button>
    );
};
