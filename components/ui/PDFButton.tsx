import React from 'react';
import { FaFilePdf } from 'react-icons/fa';
import { Loading } from '../ui/Loading';

interface PDFButtonProps {
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    label?: string;
    count?: number;
    className?: string;
    title?: string;
    size?: 'xs' | 'sm' | 'md';
}

export const PDFButton: React.FC<PDFButtonProps> = ({
    onClick,
    loading = false,
    disabled = false,
    label = 'PDF',
    count,
    className = '',
    title = 'Exportar PDF',
    size = 'xs',
}) => {
    const sizeClasses = {
        xs: 'px-3 py-1.5 text-xs',
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
    };

    const iconSizes = {
        xs: 14,
        sm: 14,
        md: 16,
    };

    const displayLabel = count !== undefined ? `${label} (${count})` : label;

    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={`flex items-center gap-2 ${sizeClasses[size]} bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded-[8px] font-bold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait shrink-0 ${className}`}
            title={title}
        >
            {loading ? (
                <Loading size="xs" />
            ) : (
                <FaFilePdf className="text-[14px]" />
            )}
            <span>{displayLabel}</span>
        </button>
    );
};
