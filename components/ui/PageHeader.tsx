import React from 'react';
import { SearchInput } from './SearchInput';
import { IconButton } from './IconButton';

interface PageHeaderProps {
    searchProps?: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
    mainAction?: {
        icon?: string;
        label?: string; // Optional if only icon is needed
        onClick: () => void;
        title?: string; // Tooltip/Title attribute
    };
    children?: React.ReactNode; // For extra filter slots if needed
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ searchProps, mainAction, children, className }) => {
    return (
        <div className={`px-4 py-2 sticky top-0 z-20 bg-background-light dark:bg-background-dark flex items-center gap-2 ${className || ''}`}>
            {searchProps && (
                <SearchInput
                    placeholder={searchProps.placeholder || "Buscar..."}
                    value={searchProps.value}
                    onChange={(e) => searchProps.onChange(e.target.value)}
                    containerClassName="flex-1"
                />
            )}

            {children}

            {mainAction && (
                <IconButton
                    icon={mainAction.icon || 'add'}
                    variant="primary"
                    size="lg"
                    onClick={mainAction.onClick}
                    title={mainAction.title || "Adicionar"}
                />
            )}
        </div>
    );
};
