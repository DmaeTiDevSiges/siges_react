import { useEffect, useRef } from 'react';
import { registerBackHandler } from '../utils/backButton';

/**
 * Enquanto `open`, o botão voltar do Android chama `onClose` (e não muda de tela).
 * Usa o `onClose` mais recente por referência: re-registrar a cada render tiraria
 * o tratador da posição certa na pilha quando há modais empilhados.
 */
export const useBackToClose = (open: boolean, onClose: () => void): void => {
    const latest = useRef(onClose);
    latest.current = onClose;
    useEffect(() => {
        if (!open) return;
        return registerBackHandler(() => { latest.current(); });
    }, [open]);
};
