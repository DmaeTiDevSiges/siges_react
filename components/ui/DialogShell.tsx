import React, { useRef } from 'react';
import { useBackToClose } from '../../hooks/useBackToClose';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface DialogShellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
    /** Nome do diálogo para o leitor de tela (ex.: "Novo perfil"). */
    label: string;
    onClose: () => void;
    /** false em telas cheias/formulários, onde um Esc sem querer perderia o que foi digitado. */
    closeOnEscape?: boolean;
}

/**
 * Camada de fundo de um diálogo FEITO À MÃO (o que não usa `Modal`/`BottomSheet`):
 * troque a `<div className="fixed inset-0 …">` por `<DialogShell label onClose …>`.
 * Traz `role="dialog"`, `Esc` (só o de cima), foco que entra e volta, `Tab` preso
 * dentro e o botão voltar do Android. Só deve estar montado enquanto o diálogo
 * está aberto (renderização condicional), como já é nesses casos. O visual é o do
 * `className` que você passar — nada é acrescentado além de `outline-none`.
 */
export const DialogShell: React.FC<DialogShellProps> = ({ label, onClose, closeOnEscape = true, className = '', children, ...rest }) => {
    const ref = useRef<HTMLDivElement>(null);
    useBackToClose(true, onClose);
    useDialogA11y(true, onClose, ref, { closeOnEscape });
    return (
        <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className={`${className} outline-none`} {...rest}>
            {children}
        </div>
    );
};
