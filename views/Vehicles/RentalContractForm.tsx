import React, { useEffect, useState } from 'react';
import { Vehicle } from '../../types';
import type { VehicleRentalContract } from '../../services/orders/vehicleRentalService';
import { dataService } from '../../services/dataService';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { toast } from 'sonner';
import { getBrazilDateInputValue } from '../../utils/formatters';

export interface RentalContractFormInput {
    id?: string;
    vehicleId: string;
    monthlyValue: number;
    valueUnit: number;
    startDate: string;
    endDate?: string | null;
    active?: boolean;
    description?: string | null;
}

interface RentalContractFormProps {
    initial?: VehicleRentalContract | null;
    onSave: (input: RentalContractFormInput) => Promise<void>;
    onCancel: () => void;
}

const toISODate = (value?: string | null): string => {
    if (!value) return '';
    return value.slice(0, 10);
};

export const RentalContractForm: React.FC<RentalContractFormProps> = ({
    initial,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [vehicle, setVehicle] = useState<Vehicle | null>(
        initial?.vehicleId
            ? { id: initial.vehicleId, description: initial.vehicleDescription, plates: initial.vehiclePlates } as Vehicle
            : null
    );
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Vehicle[]>([]);
    const [searching, setSearching] = useState(false);
    // Tarifa R$/km vigente do veículo (quando existir) — hint abaixo do campo
    const [currentRate, setCurrentRate] = useState<number | null>(null);
    const [form, setForm] = useState({
        monthlyValue: initial?.monthlyValue != null ? String(initial.monthlyValue) : '',
        valueUnit: initial?.valueUnit != null ? String(initial.valueUnit) : '',
        startDate: toISODate(initial?.startDate) || getBrazilDateInputValue(),
        endDate: toISODate(initial?.endDate),
        active: initial?.active ?? true,
        description: initial?.description || ''
    });

    // Contratos existentes exibem seu próprio R$/km; novos contratos sugerem
    // a tarifa vigente do veículo, ou zero quando ainda não há uma.
    useEffect(() => {
        let cancelled = false;
        if (!vehicle) {
            setCurrentRate(null);
            return;
        }
        if (initial?.id && String(vehicle.id) === String(initial.vehicleId)) {
            setCurrentRate(initial.valueUnit ?? null);
            return;
        }
        (async () => {
            try {
                const info = await dataService.getRateContractInfo(
                    String(vehicle.id),
                    form.startDate
                );
                if (cancelled) return;
                setCurrentRate(info ? info.valueUnit : null);
                setForm(prev => prev.valueUnit === ''
                    ? { ...prev, valueUnit: info ? String(info.valueUnit) : '0' }
                    : prev
                );
            } catch (err) {
                console.error('Error fetching rate contract info', err);
                if (!cancelled) setCurrentRate(null);
            }
        })();
        return () => { cancelled = true; };
    }, [vehicle, initial, form.startDate]);

    useEffect(() => {
        if (search.trim().length < 2) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const found = await dataService.searchVehicles(search.trim());
                setResults(found);
            } catch (error) {
                console.error('Error searching vehicles', error);
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        const monthlyValue = parseFloat(form.monthlyValue.replace(',', '.'));
        if (!vehicle) {
            toast.warning('Selecione o veículo do contrato.');
            return;
        }
        if (!Number.isFinite(monthlyValue)) {
            toast.warning('Informe o valor mensal do aluguel (use 0 quando não houver valor fixo).');
            return;
        }
        if (monthlyValue < 0) {
            toast.warning('O valor mensal do aluguel não pode ser negativo.');
            return;
        }
        if (!form.startDate) {
            toast.warning('Informe a data de início da vigência.');
            return;
        }
        if (form.endDate && form.endDate < form.startDate) {
            toast.warning('A data final não pode ser anterior ao início.');
            return;
        }

        const rateInput = form.valueUnit.trim();
        const normalizedRate = rateInput.includes(',')
            ? rateInput.replace(/\./g, '').replace(',', '.')
            : rateInput;
        const valueUnit = Number(normalizedRate);
        if (!Number.isFinite(valueUnit) || valueUnit < 0) {
            toast.warning('Informe um R$ Fixo/Km válido (maior ou igual a zero).');
            return;
        }

        try {
            setIsSaving(true);
            await onSave({
                id: initial?.id,
                vehicleId: vehicle.id,
                monthlyValue,
                valueUnit,
                startDate: form.startDate,
                endDate: form.endDate || null,
                active: form.active,
                description: form.description.trim() || null
            });
        } catch (error) {
            console.error('Error saving rental contract', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            {isSaving && (
                <div className="h-1 overflow-hidden bg-primary/20">
                    <div className="h-full bg-primary animate-loading-bar w-[40%]" />
                </div>
            )}

            <div className="p-4 space-y-5">
                {vehicle ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-primary">local_shipping</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                                {vehicle.description}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {vehicle.plates || '---'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setVehicle(null);
                                setSearch('');
                                setResults([]);
                                setForm(prev => ({ ...prev, valueUnit: '' }));
                                setCurrentRate(null);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Trocar veículo"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Input
                            label="Veículo"
                            placeholder="Buscar por descrição ou placa..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {searching && (
                            <p className="text-xs text-slate-400 px-1">Buscando veículos...</p>
                        )}
                        {results.length > 0 && (
                            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                                {results.map(v => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => { setVehicle(v); setResults([]); setSearch(''); }}
                                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                                    >
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {v.description}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                            {v.plates || '---'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {search.trim().length >= 2 && !searching && results.length === 0 && (
                            <p className="text-xs text-slate-400 px-1">Nenhum veículo encontrado.</p>
                        )}
                    </div>
                )}

                <Input
                    label="Valor Mensal (R$)"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 6000,00"
                    value={form.monthlyValue}
                    onChange={(e) => setForm({ ...form, monthlyValue: e.target.value })}
                    required
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-3 ml-1">
                    Use 0 quando não houver valor fixo: o custo será apurado apenas pelo Km
                    e/ou pelas despesas variáveis do mês.
                </p>

                {/* O valor por Km pertence ao mesmo contrato e vigência do aluguel. */}
                <Input
                    label="R$ Fixo/Km"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Ex: 2.000"
                    value={form.valueUnit}
                    onChange={(e) => setForm({ ...form, valueUnit: e.target.value })}
                    required
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-3 ml-1">
                    {currentRate != null
                        ? `R$/Km vigente sugerido: R$ ${currentRate.toFixed(3).replace('.', ',')}. O valor salvo terá a mesma vigência do contrato.`
                        : 'Informe 0 quando não houver cobrança fixa por Km.'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Início da Vigência"
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        required
                    />
                    <Input
                        label="Fim da Vigência"
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                </div>

                <Select
                    label="Situação"
                    value={form.active ? 'active' : 'inactive'}
                    onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
                >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </Select>

                <Textarea
                    label="Observação (opcional)"
                    placeholder="Ex: Contrato da frota da região..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                />
            </div>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
            />
        </form>
    );
};
