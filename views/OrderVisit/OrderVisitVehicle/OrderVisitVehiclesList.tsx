import React, { useState, useEffect, useRef } from 'react';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { OrderVisitVehicle, Vehicle } from '../../../types';
import { dataService, competenceLabel, previousCompetenceMonth } from '../../../services/dataService';
import { getBrazilDateInputValue } from '../../../utils/formatters';
import type { VehicleRentalContract } from '../../../services/orders/vehicleRentalService';
import { Card } from '../../../components/ui/Card';
import { ButtonDelete } from '../../../components/ui/ButtonDelete';
import { ButtonNew } from '../../../components/ui/ButtonNew';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { toast } from 'sonner';
import { Loading } from '../../../components/ui/Loading';


interface OrderVisitVehiclesListProps {
    visitId: string;
    isEditable?: boolean;
    companyId?: string; // To filter vehicle search
    onVisitRefresh?: () => void;
}

/** Linhas geradas pela apuração mensal (nunca editáveis/removíveis aqui):
 *  'rental' (aluguel), 'variable' (despesas) e 'rate' (a linha de Km
 *  convertida para o componente R$/km — mesma leitura, outro rótulo). */
const isRateioLine = (costType?: string | null): boolean =>
    costType === 'rental' || costType === 'variable' || costType === 'rate';

/** Registro manual de ociosidade do veículo parado (contrato só-aluguel). */
const isIdleLine = (costType?: string | null): boolean =>
    costType === 'idle';

/** Contrato vigente só-aluguel: mensalidade > 0 sem R$/km. */
const isRentalOnlyContract = (contract?: VehicleRentalContract | null): boolean =>
    !!contract && (contract.valueUnit || 0) === 0 && (contract.monthlyValue || 0) > 0;

export const OrderVisitVehiclesList: React.FC<OrderVisitVehiclesListProps> = ({
    visitId,
    isEditable = true,
    companyId,
    onVisitRefresh
}) => {
    const [visitVehicles, setVisitVehicles] = useState<OrderVisitVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const { canView } = usePermissions();

    // Contrato de aluguel vigente por veículo (para detectar só-aluguel)
    const [rentalContracts, setRentalContracts] = useState<Record<string, VehicleRentalContract | null>>({});

    // Último Km final registrado do veículo (excluindo a visita atual):
    // informativo no campo INÍCIO e base da validação de progressão
    const [lastOdometers, setLastOdometers] = useState<Record<string, number | null>>({});

    // Registro de ociosidade (veículo parado, competência explícita)
    const [idleTargetId, setIdleTargetId] = useState<string | null>(null);
    const [idleMonth, setIdleMonth] = useState('');
    const [idleValue, setIdleValue] = useState('');
    const [idleSaving, setIdleSaving] = useState(false);

    // Add Vehicle State
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
    const [searching, setSearching] = useState(false);
    const [addingVehicleId, setAddingVehicleId] = useState<string | null>(null);
    const [successVehicleId, setSuccessVehicleId] = useState<string | null>(null);

    useEffect(() => {
        loadVehicles();
    }, [visitId]);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const data = await dataService.getOrderVisitVehicles(visitId);
            setVisitVehicles(data);
            // Contratos vigentes (um por veículo) para o botão de ociosidade
            // e último Km final registrado (excluindo esta visita) para
            // validar/informativo do Km inicial
            const ids = Array.from(new Set(data.map(v => v.vehicleId)));
            if (ids.length > 0) {
                const [contractEntries, odometerEntries] = await Promise.all([
                    Promise.all(ids.map(async (vehicleId) => {
                        try {
                            const contracts = await dataService.getRentalContracts(vehicleId);
                            const current = contracts.find(c => c.active !== false) || contracts[0] || null;
                            return [vehicleId, current] as const;
                        } catch {
                            return [vehicleId, null] as const;
                        }
                    })),
                    Promise.all(ids.map(async (vehicleId) => {
                        try {
                            const max = await dataService.getMaxVehicleOdometer(vehicleId, visitId);
                            return [vehicleId, max] as const;
                        } catch {
                            return [vehicleId, null] as const;
                        }
                    }))
                ]);
                setRentalContracts(Object.fromEntries(contractEntries));
                setLastOdometers(Object.fromEntries(odometerEntries));
            } else {
                setLastOdometers({});
            }
        } catch (error) {
            console.error('Error loading visit vehicles:', error);
            toast.error('Erro ao carregar veículos da visita');
        } finally {
            setLoading(false);
        }
    };

    const openIdleForm = (vv: OrderVisitVehicle) => {
        const contract = rentalContracts[vv.vehicleId];
        const currentMonth = getBrazilDateInputValue().slice(0, 7);
        setIdleTargetId(vv.id);
        setIdleMonth(previousCompetenceMonth(currentMonth));
        setIdleValue(contract && contract.monthlyValue > 0 ? String(contract.monthlyValue) : '');
    };

    const confirmIdleRecord = async () => {
        const target = visitVehicles.find(v => v.id === idleTargetId);
        if (!target || !currentUserId) return;
        const value = Number(String(idleValue).replace(/\./g, '').replace(',', '.'));
        if (!idleMonth || idleMonth.length < 7) {
            toast.error('Escolha a competência da ociosidade.');
            return;
        }
        if (!Number.isFinite(value) || value <= 0) {
            toast.error('Informe o valor mensal do aluguel.');
            return;
        }
        setIdleSaving(true);
        try {
            await dataService.addIdleToOrderVisit(visitId, target.vehicleId, currentUserId, value, idleMonth);
            toast.success(`Ociosidade de ${competenceLabel(idleMonth)} registrada!`);
            setIdleTargetId(null);
            loadVehicles();
            if (onVisitRefresh) onVisitRefresh();
        } catch (error: any) {
            console.error('Error registering idle:', error);
            toast.error(error?.message || 'Erro ao registrar ociosidade');
        } finally {
            setIdleSaving(false);
        }
    };

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearching(true);
            // Assuming we pass companyId if available, or just search broadly if not restricted
            // Note: searchVehicles uses companyId eq filter in dataService
            const results = await dataService.searchVehicles(term, companyId || '');

            // Filter out vehicles already added
            const existingIds = visitVehicles.map(v => v.vehicleId);
            setSearchResults(results.filter(r => !existingIds.includes(r.id)));
        } catch (error) {
            console.error('Error searching vehicles:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleAddVehicle = async (vehicle: Vehicle, userId: string) => {
        if (visitVehicles.some(v => v.vehicleId === vehicle.id)) {
            toast.warning('Veículo já adicionado a esta visita.');
            return;
        }

        try {
            setAddingVehicleId(vehicle.id);
            await dataService.addVehicleToOrderVisit(visitId, vehicle.id, userId);
            
            setAddingVehicleId(null);
            setSuccessVehicleId(vehicle.id);
            toast.success('Veículo adicionado!');

            setTimeout(() => {
                setSuccessVehicleId(null);
            }, 1500);

            // Removed premature close to allow adding multiple vehicles
            // setIsAdding(false);
            // setSearchTerm('');
            
            loadVehicles();
            if (onVisitRefresh) onVisitRefresh();
        } catch (error) {
            console.error('Error adding vehicle:', error);
            toast.error('Erro ao adicionar veículo');
            setAddingVehicleId(null);
        }
    };

    const [vehicleToDelete, setVehicleToDelete] = useState<OrderVisitVehicle | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRemoveVehicle = (vv: OrderVisitVehicle) => {
        setVehicleToDelete(vv);
    };

    const confirmRemoveVehicle = async () => {
        if (!vehicleToDelete) return;
        // Linhas de rateio (aluguel/despesas) são geradas pela apuração
        // mensal e nunca são removíveis aqui
        if (isRateioLine(vehicleToDelete.costType)) {
            setVehicleToDelete(null);
            return;
        }
        setIsDeleting(true);
        try {
            await dataService.removeVehicleFromOrderVisit(vehicleToDelete.id);
            toast.success('Veículo removido com sucesso!');
            // Update local state directly to feel instant, then load
            setVisitVehicles(prev => prev.filter(v => v.id !== vehicleToDelete.id));
            setVehicleToDelete(null);
            loadVehicles();
            if (onVisitRefresh) onVisitRefresh();
        } catch (error) {
            console.error('Error removing vehicle:', error);
            toast.error('Erro ao remover veículo');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateKm = async (visitVehicleId: string, type: 'initial' | 'final', value: string) => {
        // Use null instead of undefined to explicitly clear DB field
        const numValue = value ? parseFloat(value) : null;

        // Validation logic
        const targetVehicle = visitVehicles.find(v => v.id === visitVehicleId);
        let effectiveValue = numValue;
        if (targetVehicle && numValue !== null) {
            // Bloqueia Km inicial inferior ao último Km final já registrado do
            // veículo (excluindo esta visita) — odômetro deve ser progressivo
            if (type === 'initial') {
                const lastKm = lastOdometers[targetVehicle.vehicleId];
                if (lastKm != null && numValue < lastKm) {
                    toast.error(`Km inicial inválido: o último Km final registrado deste veículo é ${lastKm.toLocaleString('pt-BR')}. Informe um valor igual ou maior.`);
                    // Limpa o campo inválido sem salvar
                    setVisitVehicles(prev => prev.map(v => v.id === visitVehicleId ? { ...v, recorderStart: undefined } : v));
                    return;
                }
            }
            if (type === 'final' && targetVehicle.recorderStart != null && numValue < targetVehicle.recorderStart) {
                // Km final menor que o inicial: valor corrigido para 0
                effectiveValue = 0;
                toast.warning('Valor final menor que o inicial — valor alterado para 0.');
            }
            if (type === 'initial' && targetVehicle.recorderEnd != null && targetVehicle.recorderEnd > 0 && numValue > targetVehicle.recorderEnd) {
                toast.warning('Aviso: Valor inicial maior que o final.');
            }
        }

        // Optimistic update for UI responsiveness
        setVisitVehicles(prev => prev.map(v => {
            if (v.id === visitVehicleId) {
                const newStart = type === 'initial' ? (effectiveValue ?? undefined) : v.recorderStart;
                const newEnd = type === 'final' ? (effectiveValue ?? undefined) : v.recorderEnd;

                // Recalculate total optimistically
                let newValueTotal = v.valueTotal;
                if (newStart != null && newEnd != null) {
                    const diff = Math.max(0, newEnd - newStart);
                    newValueTotal = diff * (v.valueUnit || 0);
                }

                return {
                    ...v,
                    [type === 'initial' ? 'recorderStart' : 'recorderEnd']: effectiveValue ?? undefined,
                    valueTotal: newValueTotal
                };
            }
            return v;
        }));

        try {
            // Force cast to any to allow null until service is updated
            await dataService.updateVehicleKm(
                visitVehicleId,
                type === 'initial' ? (effectiveValue as any) : undefined,
                type === 'final' ? (effectiveValue as any) : undefined
            );
            if (onVisitRefresh) onVisitRefresh();
        } catch (error: any) {
            console.error('Error updating KM:', error);
            toast.error(`Erro ao salvar KM: ${error.message || 'Erro desconhecido'}`);
            // Revert on error would be ideal, but simple reload works too
            loadVehicles();
        }
    };

    // Get current user ID for adding vehicles
    const [currentUserId, setCurrentUserId] = useState<string>('');
    useEffect(() => {
        dataService.getCurrentUser().then(u => {
            if (u) setCurrentUserId(u.id);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loading size="sm" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header / Add Button */}
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                    TRANSPORTE
                </h3>
                {isEditable && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isAdding
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                            }`}
                    >
                        {isAdding ? (
                            <>
                                <span className="material-symbols-outlined text-sm">close</span>
                                CANCELAR
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">add</span>
                                ASSOCIAR
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Add Vehicle Search Area */}
            {isAdding && (
                <div className="animate-in slide-in-from-top-2 duration-300 mb-4">

                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar placa ou modelo..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                            autoFocus
                        />
                    </div>

                    {searching && (
                        <div className="p-4 text-center text-slate-400 text-xs font-bold">
                            BUSCANDO...
                        </div>
                    )}

                    {!searching && searchTerm.length >= 2 && searchResults.length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-xs font-bold">
                            NENHUM VEÍCULO ENCONTRADO
                        </div>
                    )}

                    <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                        {searchResults.filter(vehicle => !visitVehicles.some(vv => vv.vehicleId === vehicle.id)).map(vehicle => (
                            <div key={vehicle.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
                                        <span className="material-symbols-outlined">directions_car</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                                            {vehicle.plates}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {vehicle.model} {vehicle.brand ? `- ${vehicle.brand}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <ButtonNew
                                    isLoading={addingVehicleId === vehicle.id}
                                    isSuccess={successVehicleId === vehicle.id}
                                    onClick={() => handleAddVehicle(vehicle, currentUserId)}
                                />
                            </div>
                        ))}
                    </div>

                </div>
            )}

            {/* List */}
            <div className="grid gap-4">
                {visitVehicles.length === 0 && !isAdding && (
                    <div className="text-center py-8 opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">no_crash</span>
                        <p className="text-xs font-bold uppercase tracking-widest">Nenhum veículo associado</p>
                    </div>
                )}

                {visitVehicles.map(vv => (
                    <Card key={vv.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl! shadow-sm overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <span className="material-symbols-outlined text-2xl">directions_car</span>
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-none">
                                        {vv.plates} <span className="text-[10px] font-normal text-slate-300 dark:text-slate-700">#{vv.id}</span>
                                    </h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
                                        {vv.model}
                                    </p>
                                </div>
                            </div>

                            {isEditable && !isRateioLine(vv.costType) && (
                                <ButtonDelete
                                    onClick={() => handleRemoveVehicle(vv)}
                                    icon="delete"
                                />
                            )}
                        </div>

                        {isIdleLine(vv.costType) ? (
                            /* Registro de ociosidade: somente leitura, fora do total */
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800/40">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">bedtime</span>
                                        Parado — Ociosidade
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300">
                                        {vv.createdAt ? competenceLabel(vv.createdAt.slice(0, 7)) : ''}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-end justify-between gap-2">
                                    <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-200/70 leading-snug">
                                        Fora do total da visita. Entra na apuração da competência.
                                    </p>
                                    {canView('orders_visits_costs') && (
                                        <span className="text-lg font-black text-amber-600 dark:text-amber-300 whitespace-nowrap">
                                            {vv.valueTotal ? `R$ ${vv.valueTotal.toFixed(2)}` : 'R$ 0,00'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : isRateioLine(vv.costType) ? (
                            /* Linha de rateio: somente leitura (gerada pela apuração mensal) */
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                        KM INICIAL
                                    </label>
                                    <span className="text-lg font-bold text-slate-700 dark:text-white">
                                        {vv.recorderStart != null ? vv.recorderStart.toLocaleString('pt-BR') : '—'}
                                    </span>
                                </div>

                                <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                        KM FINAL
                                    </label>
                                    <span className="text-lg font-bold text-slate-700 dark:text-white">
                                        {vv.recorderEnd != null ? vv.recorderEnd.toLocaleString('pt-BR') : '—'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                    INÍCIO
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="0"
                                        disabled={!isEditable}
                                        value={vv.recorderStart || ''}
                                        onBlur={(e) => handleUpdateKm(vv.id, 'initial', e.target.value)}
                                        onChange={(e) => {
                                            // Optional: Local state update only if needed for smooth typing, 
                                            // but optimistic update above handles it via prop passed back?
                                            // Actually with current optimistic logic we need onChange to trigger state update 
                                            // BUT input value is bound to visitVehicles state.
                                            // So we need to update state on change too or use uncontrolled input.
                                            // Let's rely on onBlur for API and simple onChange for local state.
                                            const val = e.target.value;
                                            setVisitVehicles(prev => prev.map(item => item.id === vv.id ? { ...item, recorderStart: val ? parseFloat(val) : undefined } : item));
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        className="w-full bg-transparent text-lg font-bold text-slate-700 dark:text-white focus:outline-none p-0 border-none truncate"
                                    />
                                    <span className="text-xs font-bold text-slate-400 absolute right-0 top-1.5 pointer-events-none">{vv.unit || 'KM'}</span>
                                </div>
                                {lastOdometers[vv.vehicleId] != null && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-snug">
                                        Último Km final registrado: <span className="font-bold">{lastOdometers[vv.vehicleId]!.toLocaleString('pt-BR')}</span> — informe um valor igual ou maior.
                                    </p>
                                )}
                            </div>

                            <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                    FIM
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="0"
                                        disabled={!isEditable}
                                        value={vv.recorderEnd ?? ''}
                                        onBlur={(e) => handleUpdateKm(vv.id, 'final', e.target.value)}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setVisitVehicles(prev => prev.map(item => item.id === vv.id ? { ...item, recorderEnd: val ? parseFloat(val) : undefined } : item));
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        className="w-full bg-transparent text-lg font-bold text-slate-700 dark:text-white focus:outline-none p-0 border-none truncate"
                                    />
                                    <span className="text-xs font-bold text-slate-400 absolute right-0 top-1.5 pointer-events-none">{vv.unit || 'KM'}</span>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Registrar ociosidade: veículo parado com contrato só-aluguel e sem Km */}
                        {isEditable && !isRateioLine(vv.costType) && !isIdleLine(vv.costType)
                            && isRentalOnlyContract(rentalContracts[vv.vehicleId])
                            && (vv.recorderStart == null || vv.recorderEnd == null) && (
                            <div className="mt-3">
                                {idleTargetId !== vv.id ? (
                                    <button
                                        onClick={() => openIdleForm(vv)}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">bedtime</span>
                                        Registrar ociosidade
                                    </button>
                                ) : (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/40 p-3 space-y-3">
                                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest">
                                            Ociosidade — {vv.plates}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    Competência
                                                </label>
                                                <input
                                                    type="month"
                                                    value={idleMonth}
                                                    onChange={(e) => setIdleMonth(e.target.value)}
                                                    className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    Conta no último dia do mês escolhido.
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    Aluguel (R$)
                                                </label>
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    placeholder="0,00"
                                                    value={idleValue}
                                                    onChange={(e) => setIdleValue(e.target.value)}
                                                    className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIdleTargetId(null)}
                                                disabled={idleSaving}
                                                className="flex-1 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={confirmIdleRecord}
                                                disabled={idleSaving}
                                                className="flex-1 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                                            >
                                                {idleSaving ? 'Salvando...' : 'Confirmar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Mileage Calc Display */}
                        {vv.recorderEnd != null && vv.recorderStart != null && vv.recorderEnd > vv.recorderStart && canView('orders_visits_costs') && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
                                {/* DIFERENÇA - Esquerda */}
                                <div className="text-left">
                                    <span className="text-[10px] font-bold text-slate-400 block mb-1">DIFERENÇA</span>
                                    <span className="text-lg font-black text-emerald-500 block leading-none">
                                        {(vv.recorderEnd - vv.recorderStart).toFixed(1)}
                                    </span>
                                    {vv.valueUnit != null && (
                                        <span
                                            className="text-[10px] font-medium text-slate-400 mt-1 block"
                                            title="R$/km do contrato de R$/km vigente na data do lançamento (Apuração > Contratos de R$/km). Sem contrato vigente, salvar o Km é bloqueado."
                                        >
                                            x R$ {vv.valueUnit.toFixed(2)} / km
                                        </span>
                                    )}
                                </div>

                                {/* VALOR - Direita */}
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 block mb-1">VALOR</span>
                                    <span className="text-lg font-black text-blue-500">
                                        {vv.valueTotal ? `R$ ${vv.valueTotal.toFixed(2)}` : 'R$ 0,00'}
                                    </span>
                                </div>
                            </div>
                        )}

                    </Card>
                ))}

                {/* Total de Veículos (ociosidade fora do total) */}
                {visitVehicles.length > 0 && canView('orders_visits_costs') && (
                    <div className="mt-2 flex justify-end">
                        <div className="text-right">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">TOTAL</span>
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                R$ {visitVehicles.filter(vv => !isIdleLine(vv.costType)).reduce((sum, vv) => sum + (vv.valueTotal || 0), 0).toFixed(2)}
                            </span>
                            {visitVehicles.some(vv => isIdleLine(vv.costType)) && (
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-300 block mt-1">
                                    Ociosidade (fora do total): R$ {visitVehicles.filter(vv => isIdleLine(vv.costType)).reduce((sum, vv) => sum + (vv.valueTotal || 0), 0).toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* Modal de Exclusão */}
            <ConfirmDeleteModal
                isOpen={!!vehicleToDelete}
                onClose={() => setVehicleToDelete(null)}
                onConfirm={confirmRemoveVehicle}
                title="Remover Veículo"
                description={
                    vehicleToDelete ? (
                        <>
                            Confirma a exclusão do veículo <strong className="text-slate-700 dark:text-slate-200">{vehicleToDelete.plates}</strong>?
                        </>
                    ) : undefined
                }
                isLoading={isDeleting}
            />
        </div>
    );
};
