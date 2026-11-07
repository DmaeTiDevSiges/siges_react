import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../../services/dataService';
import type { AccountDeletionRequest } from '../../services/users/accountDeletionService';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import { formatDateInBrazil } from '../../utils/formatters';

/**
 * Perfil > Excluir conta (exigência da Play Store para apps com login).
 * Registra o pedido; a administração exclui/anonimiza os dados e conclui.
 */
export const AccountDeletionSection: React.FC = () => {
    const [pending, setPending] = useState<AccountDeletionRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let active = true;
        dataService.getMyPendingAccountDeletion()
            .then(r => { if (active) setPending(r); })
            .catch(err => console.warn('Falha ao consultar pedido de exclusão:', err))
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const handleRequest = async () => {
        setBusy(true);
        try {
            const request = await dataService.requestAccountDeletion(reason.trim() || undefined);
            setPending(request);
            setConfirmOpen(false);
            setReason('');
            toast.success('Pedido de exclusão registrado. A administração entrará em contato.');
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao registrar o pedido de exclusão.');
        } finally {
            setBusy(false);
        }
    };

    const handleCancel = async () => {
        setBusy(true);
        try {
            await dataService.cancelAccountDeletion();
            setPending(null);
            toast.success('Pedido de exclusão cancelado.');
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao cancelar o pedido.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) return null;

    return (
        <div className="mx-4 mt-8 bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 shrink-0">
                    <span className="material-symbols-outlined">person_remove</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Excluir conta</h3>
                    {pending ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Pedido registrado em{' '}
                            <strong>{formatDateInBrazil(pending.requestedAt, 'dateTime')}</strong>.
                            A administração vai excluir sua conta e seus dados pessoais e avisar você.
                        </p>
                    ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Solicite a exclusão da sua conta e dos seus dados pessoais (nome, contatos, foto,
                            assinatura e histórico de localização). Registros de serviço exigidos por contrato
                            ou lei podem ser mantidos sem identificar você.
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4">
                {pending ? (
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={busy}
                        className="w-full py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Cancelar pedido de exclusão
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        className="w-full py-3 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        Solicitar exclusão da conta
                    </button>
                )}
            </div>

            <Modal
                isOpen={confirmOpen}
                onClose={() => { if (!busy) setConfirmOpen(false); }}
                onConfirm={handleRequest}
                title="Excluir conta"
                type="warning"
                confirmLabel="Solicitar exclusão"
                confirmLoading={busy}
                confirmLoadingLabel="Enviando..."
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Depois de concluída, a exclusão não pode ser desfeita e você perde o acesso ao SIGES.
                        Enquanto o pedido estiver pendente, você pode cancelá-lo aqui no Perfil.
                    </p>
                    <Textarea
                        label="Motivo (opcional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Conte o motivo, se quiser"
                    />
                </div>
            </Modal>
        </div>
    );
};
