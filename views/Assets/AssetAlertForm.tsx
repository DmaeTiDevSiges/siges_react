import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { toast } from 'sonner';
import { AssetAlert, OrderType, Priority } from '../../types';
import { dataService } from '../../services/dataService';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { usePermissions } from '../../contexts/PermissionsContext';

interface AssetAlertFormProps {
    assetId: string;
    ovaId?: string;
    initialAlert?: AssetAlert;
    onSave: (alert: Partial<AssetAlert>) => Promise<void>;
    onCancel: () => void;
}

export interface AssetAlertFormHandle {
    submit: () => Promise<boolean>;
}

export const AssetAlertForm = forwardRef<AssetAlertFormHandle, AssetAlertFormProps>(({
    assetId,
    ovaId,
    initialAlert,
    onSave,
    onCancel
}, ref) => {
    const { canEdit, canCreate } = usePermissions();
    const isEdit = !!initialAlert;

    const [formData, setFormData] = useState<Partial<AssetAlert>>({
        assetId,
        ovaId,
        oTypeId: '',
        priorityId: '',
        description: '',
        isDone: false,
        ...initialAlert
    });

    const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [types, prios] = await Promise.all([
                    dataService.getOrderTypes('active'),
                    dataService.getPriorities('active')
                ]);
                setOrderTypes(types);
                setPriorities(prios);
            } catch (error) {
                console.error('Error fetching alert form data:', error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (): Promise<boolean> => {
        if (isSaving) return false;

        if (!formData.description) {
            toast.error('Por favor, descreva o alerta.');
            return false;
        }

        if (!formData.oTypeId) {
            toast.error('Por favor, selecione o tipo de OS.');
            return false;
        }

        if (!formData.priorityId) {
            toast.error('Por favor, selecione uma prioridade.');
            return false;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
            return true;
        } catch (error) {
            console.error('Error saving alert:', error);
            toast.error('Erro ao salvar alerta.');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    useImperativeHandle(ref, () => ({ submit: handleSubmit }));

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Informações do Alerta</h4>
            </div>

            <Select
                label="Tipo OS"
                required
                value={formData.oTypeId || ''}
                onChange={e => setFormData({ ...formData, oTypeId: e.target.value })}
                options={orderTypes.map(t => ({ value: t.id, label: t.description }))}
                placeholder="Selecione o tipo de serviço sugerido..."
            />

            <Select
                label="Prioridade"
                required
                value={formData.priorityId || ''}
                onChange={e => setFormData({ ...formData, priorityId: e.target.value })}
                options={priorities.map(p => ({ value: p.id, label: p.description }))}
                placeholder="Selecione a criticidade..."
            />

            <Textarea
                label="Descrição do Alerta"
                required
                rows={4}
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o problema ou a recomendação..."
            />
        </div>
    );
});
