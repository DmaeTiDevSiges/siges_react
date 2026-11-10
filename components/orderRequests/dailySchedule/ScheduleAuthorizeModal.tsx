import React, { useEffect, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { dataService } from '../../../services/dataService';
import type { DailyScheduleOrder, DailyScheduleTeam } from '../../../services/orders/dailyScheduleService';

interface ScheduleAuthorizeModalProps {
    order: DailyScheduleOrder | null;
    team: DailyScheduleTeam | null;
    isSaving: boolean;
    onCancel: () => void;
    onConfirm: (planId?: string) => void;
}

/** Confirmação ao soltar uma OS em Avaliação numa equipe: a autorização não pode ser desfeita. */
export const ScheduleAuthorizeModal: React.FC<ScheduleAuthorizeModalProps> = ({ order, team, isSaving, onCancel, onConfirm }) => {
    const [plans, setPlans] = useState<Array<{ id: string; description: string }>>([]);
    const [planId, setPlanId] = useState('');
    const isOpen = !!order && !!team;

    useEffect(() => {
        if (!isOpen) return;
        setPlanId('');
        if (plans.length === 0) {
            dataService.getPlans().then(data => setPlans((data || []).map((p: any) => ({ id: String(p.id), description: p.description })))).catch(() => setPlans([]));
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { if (!isSaving) onCancel(); }}
            title="AUTORIZAR OS"
            maxWidth="sm"
            type="warning"
            confirmLabel={isSaving ? 'Autorizando...' : 'Autorizar'}
            confirmLoading={isSaving}
            onConfirm={() => onConfirm(planId || undefined)}
        >
            {order && team && (
                <div className="flex flex-col gap-4 py-2">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        A OS <strong className="text-slate-900 dark:text-white">{order.orderMask}</strong> será <strong>AUTORIZADA</strong> para
                        a equipe <strong className="text-slate-900 dark:text-white">{team.code}</strong> (líder <strong>{team.leaderName}</strong>),
                        que receberá a notificação.
                    </p>
                    <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 text-xs font-semibold">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                        Depois de autorizada, a OS não volta para EM AVALIAÇÃO.
                    </div>
                    <Select
                        label="Plano de Execução (opcional)"
                        options={plans.map(p => ({ value: p.id, label: p.description }))}
                        value={planId}
                        onChange={(e) => setPlanId(e.target.value)}
                        placeholder="Selecione um plano..."
                        leftIcon={<span className="material-symbols-outlined">assignment</span>}
                        clearable
                    />
                </div>
            )}
        </Modal>
    );
};
