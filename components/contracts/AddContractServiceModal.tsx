import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Service } from '../../types';
import { dataService } from '../../services/dataService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DecimalInput } from '../ui/DecimalInput';

interface AddContractServiceModalProps {
    isOpen: boolean;
    contractId: string;
    /** Serviços que já estão no contrato: não aparecem na busca. */
    existingServiceIds: string[];
    onClose: () => void;
    /** Chamado depois de salvar (a tela recarrega a lista). */
    onSaved: () => void | Promise<void>;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Associa um serviço ao contrato já com valor unitário, acréscimo/desconto e
 * quantidade prevista (antes: associava com zeros e editava em outro passo).
 */
export const AddContractServiceModal: React.FC<AddContractServiceModalProps> = ({
    isOpen,
    contractId,
    existingServiceIds,
    onClose,
    onSaved,
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Service[]>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<Service | null>(null);
    const [valueUnit, setValueUnit] = useState(0);
    const [discount, setDiscount] = useState(1);
    const [amount, setAmount] = useState(0);
    const [saving, setSaving] = useState(false);

    // Abre sempre limpo.
    useEffect(() => {
        if (!isOpen) return;
        setQuery('');
        setResults([]);
        setSelected(null);
        setValueUnit(0);
        setDiscount(1);
        setAmount(0);
        setSaving(false);
    }, [isOpen]);

    useEffect(() => {
        const text = query.trim();
        if (!isOpen || selected || !text) {
            setResults([]);
            return;
        }
        let active = true;
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await dataService.getServices('active', text);
                if (active) setResults(data.filter(s => !existingServiceIds.includes(String(s.id))));
            } catch (error) {
                console.error('Error searching services:', error);
                if (active) setResults([]);
            } finally {
                if (active) setSearching(false);
            }
        }, SEARCH_DEBOUNCE_MS);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [query, isOpen, selected, existingServiceIds]);

    const total = useMemo(() => (valueUnit || 0) * (discount || 0) * (amount || 0), [valueUnit, discount, amount]);

    const handleSave = async () => {
        if (!selected || saving) return;
        setSaving(true);
        try {
            await dataService.addContractService({
                contractId,
                serviceId: selected.id,
                valueUnit,
                discount,
                amount,
            });
        } catch (error) {
            console.error('Error adding service:', error);
            toast.error('Erro ao adicionar serviço');
            setSaving(false);
            return;
        }
        toast.success('Serviço adicionado ao contrato');
        await onSaved();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Serviço">
            <div className="space-y-6">
                {!selected ? (
                    <div className="space-y-3">
                        <SearchInput
                            placeholder="Buscar serviço (por nome ou código)..."
                            aria-label="Buscar serviço"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
                            {query.trim() === '' ? (
                                <p className="p-4 text-center text-sm text-slate-400">
                                    Digite para buscar o serviço que será associado ao contrato.
                                </p>
                            ) : searching ? (
                                <p className="p-4 text-center text-sm text-slate-400">Buscando...</p>
                            ) : results.length > 0 ? (
                                results.map(service => (
                                    <button
                                        key={service.id}
                                        type="button"
                                        onClick={() => setSelected(service)}
                                        className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0"
                                    >
                                        <span>
                                            <span className="block text-sm font-bold text-slate-900 dark:text-white uppercase">
                                                {service.description}
                                            </span>
                                            <span className="flex gap-2 mt-0.5">
                                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{service.unit}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">{service.code}</span>
                                            </span>
                                        </span>
                                        <span className="material-symbols-outlined text-primary" aria-hidden="true">chevron_right</span>
                                    </button>
                                ))
                            ) : (
                                <p className="p-4 text-center text-sm italic text-slate-500">Nenhum serviço encontrado</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase leading-tight">
                                    {selected.description}
                                </h4>
                                <span className="text-xs text-slate-400 font-mono mt-1">#{selected.code || 'SEM CÓDIGO'}</span>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)} disabled={saving}>
                                Trocar serviço
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <CurrencyInput label="Valor Unitário" value={valueUnit} onChange={setValueUnit} />
                            <DecimalInput
                                label="Acréscimo/Desconto"
                                value={discount}
                                onChange={setDiscount}
                                precision={4}
                                rightIcon={
                                    <span className={`text-[10px] font-black ${discount < 1 ? 'text-green-500' : discount > 1 ? 'text-orange-500' : 'hidden'}`}>
                                        {discount < 1 ? `-${Math.round((1 - discount) * 100)}%` : `+${Math.round((discount - 1) * 100)}%`}
                                    </span>
                                }
                            />
                            <DecimalInput
                                label="Qte Prevista"
                                value={amount}
                                onChange={setAmount}
                                precision={2}
                                rightIcon={
                                    selected.unit ? (
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
                                            {selected.unit}
                                        </span>
                                    ) : undefined
                                }
                            />
                        </div>

                        <div className="flex flex-col items-end">
                            <div className="text-slate-900 dark:text-white font-black text-3xl flex items-baseline gap-1.5">
                                <span className="text-[16px] text-slate-400 dark:text-slate-600 font-medium tracking-tight">R$</span>
                                <span data-testid="total-previsto">
                                    {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Total Previsto</span>
                        </div>
                    </>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        type="button"
                        fullWidth
                        onClick={handleSave}
                        disabled={!selected}
                        loading={saving}
                        className="h-14 rounded-2xl text-lg font-black"
                    >
                        Adicionar ao contrato
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
