import React from 'react';
import { Button } from './Button';

interface ButtonSaveProps {
    onSave: (e: React.FormEvent) => void;
    onCancel: () => void;
    isSaving: boolean;
    saveLabel?: string;
    cancelLabel?: string;
    className?: string;
    disabled?: boolean;
}

/**
 * Standardized Save/Cancel footer buttons with premium loading effects.
 * Used across all forms in the application for consistent UX.
 */
export const ButtonSave: React.FC<ButtonSaveProps> = ({
    onSave,
    onCancel,
    isSaving,
    saveLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    className = '',
    disabled = false
}) => {
    return (
        <div className={`p-4 border-t border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-background-dark flex gap-3 ${className}`}>
            <Button
                variant="ghost"
                fullWidth
                onClick={onCancel}
                disabled={isSaving}
                type="button"
            >
                {cancelLabel}
            </Button>
            <Button
                variant="primary"
                fullWidth
                onClick={onSave}
                loading={isSaving}
                disabled={disabled}
                type="button"
            >
                {saveLabel}
            </Button>
        </div>
    );
};
