import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { dataService } from '../../../services/dataService';
import { Order, Unit } from '../../../types';
import { Loading } from '../../ui/Loading';
import { toast } from 'sonner';

interface CloneServiceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onConfirm: (unitId: string, clientId: string) => void;
}

export const CloneServiceRequestModal: React.FC<CloneServiceRequestModalProps> = ({
    isOpen,
    onClose,
    order,
    onConfirm
}) => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchUnits = async () => {
                setIsLoading(true);
                try {
                    let clientId = order.clientId;

                    // Se não tiver clientId direto na ordem, tenta buscar as informações da unidade atual
                    if (!clientId && order.unitId) {
                        try {
                            const unitData = await dataService.getUnitById(order.unitId);
                            if (unitData && unitData.clientId) {
                                clientId = unitData.clientId;
                            }
                        } catch (err) {
                            console.warn('Erro ao buscar cliente da unidade atual:', err);
                        }
                    }

                    let data: Unit[] = [];
                    if (clientId) {
                        data = await dataService.getUnitsByClient(clientId);
                    } else {
                        // Se de tudo não tiver clientId, busca todas as unidades ativas
                        const rawUnits = await dataService.getUnits('active');
                        data = rawUnits.map(u => ({
                            id: u.id?.toString(),
                            clientId: u.client_id?.toString() || '',
                            description: u.description || '',
                            code: u.code || '',
                            descriptionFull: u.description_full || u.description || ''
                        })) as any[];
                    }

                    setUnits(data);
                    // Pré-seleciona a unidade atual se houver
                    if (order.unitId) {
                        setSelectedUnitId(order.unitId.toString());
                    }
                } catch (e) {
                    console.error('Erro ao carregar unidades para clonagem:', e);
                    toast.error('Erro ao carregar unidades para clonagem.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchUnits();
        }
    }, [isOpen, order.clientId, order.unitId]);

    const handleConfirm = () => {
        if (!selectedUnitId) {
            toast.error('Por favor, selecione uma unidade.');
            return;
        }
        setIsSaving(true);
        try {
            const selectedUnit = units.find(u => u.id.toString() === selectedUnitId);
            const targetClientId = selectedUnit?.clientId || order.clientId || '';
            onConfirm(selectedUnitId, targetClientId);
            onClose();
        } catch (e) {
            console.error('Erro ao processar clonagem:', e);
            toast.error('Erro ao iniciar clonagem.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Clonar Solicitação"
            maxWidth="sm"
            type="info"
        >
            <div className="flex flex-col gap-5 py-2 text-slate-900 dark:text-white">
                {/* SS Summary Card */}
                <div className="w-full bg-blue-600 rounded-2xl p-5 shadow-lg shadow-blue-500/20 flex flex-col justify-center">
                    <h3 className="text-3xl font-black text-white tracking-tight mb-2">Clonar SS</h3>
                    <div className="flex items-center justify-between w-full">
                        <span className="text-white/90 text-[10px] font-black uppercase tracking-widest">
                            {order.orderMask || 'Nova SS'}
                        </span>
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">
                            {order.priorityCode || 'AT'}
                        </span>
                    </div>
                </div>

                {/* Info Text */}
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-3 items-start">
                    <span className="material-symbols-outlined text-blue-500 shrink-0 text-xl">info</span>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] uppercase font-black text-blue-500 dark:text-blue-400 tracking-widest">Fluxo de Clonagem</p>
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 leading-tight">
                            Uma nova solicitação será gerada com os mesmos dados de serviço e prioridade. Você poderá revisar os detalhes antes de enviar.
                        </p>
                    </div>
                </div>

                {/* Dropdown Select */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <Loading size="sm" />
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 animate-pulse">Buscando Unidades...</p>
                    </div>
                ) : (
                    <Select
                        label="Unidade de Destino"
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        options={units.map(u => ({ value: u.id.toString(), label: u.descriptionFull || u.description }))}
                        placeholder="Selecione a unidade de destino..."
                        disabled={isSaving}
                        required
                        leftIcon={<span className="material-symbols-outlined text-[20px]">location_on</span>}
                    />
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-2">
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || isSaving || !selectedUnitId}
                        className={`
                            w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2
                            ${(isLoading || isSaving || !selectedUnitId) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-blue-700 shadow-blue-500/10'}
                        `}
                    >
                        {isSaving ? 'Processando...' : 'Confirmar e Clonar'}
                    </button>
                    
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full py-3 rounded-2xl text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
};
