import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../ui/Modal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    /** Texto montado pela programação do dia. */
    message: string;
}

const copyText = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback (WebView/HTTP sem Clipboard API).
        try {
            const area = document.createElement('textarea');
            area.value = text;
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(area);
            return ok;
        } catch {
            return false;
        }
    }
};

/** Mostra o texto da programação do dia (editável) para copiar e colar no grupo de WhatsApp. */
export const ScheduleWhatsAppModal: React.FC<Props> = ({ isOpen, onClose, message }) => {
    const [text, setText] = useState(message);

    useEffect(() => {
        if (isOpen) setText(message);
    }, [isOpen, message]);

    const handleCopy = async () => {
        if (await copyText(text)) toast.success('Mensagem copiada. Cole no grupo do WhatsApp.');
        else toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleCopy}
            title="Mensagem para o WhatsApp"
            confirmLabel="Copiar mensagem"
            cancelLabel="Fechar"
            maxWidth="lg"
        >
            <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Revise ou ajuste o texto, copie e cole no grupo.
                </p>
                <textarea
                    aria-label="Mensagem para o WhatsApp"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={16}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                />
            </div>
        </Modal>
    );
};
