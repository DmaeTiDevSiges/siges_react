/**
 * Tela sobreposta "Trocar Ativo (Ativo Errado)": busca outro ativo por
 * cliente → unidade → código e confirma a substituição no relatório.
 */
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../../../../services/dataService';
import { Asset } from '../../../../types';
import { Select } from '../../../ui/Select';
import { Loading } from '../../../ui/Loading';
import { OrderVisitAssetCardListItem } from '../OrderVisitAssetCardListItem';
import { reportLabelClass } from './assetReportShared';

type Option = { value: string; label: string };

interface Props {
    currentAssetId?: string;
    initialClientId?: string;
    initialUnitId?: string;
    isSwapping: boolean;
    onClose: () => void;
    onConfirm: (asset: Asset) => void;
}

const toUnitOptions = (units: any[]): Option[] =>
    units
        .map(u => ({ value: u.id, label: u.descriptionFull || u.description }))
        .sort((a, b) => a.label.localeCompare(b.label));

export const AssetReportSwapPage: React.FC<Props> = ({ currentAssetId, initialClientId = '', initialUnitId = '', isSwapping, onClose, onConfirm }) => {
    const [clients, setClients] = useState<Option[]>([]);
    const [units, setUnits] = useState<Option[]>([]);
    const [clientId, setClientId] = useState(initialClientId);
    const [unitId, setUnitId] = useState(initialUnitId);
    const [code, setCode] = useState('');
    const [results, setResults] = useState<Asset[]>([]);
    const [searched, setSearched] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selected, setSelected] = useState<Asset | null>(null);

    useEffect(() => {
        dataService.getClients()
            .then(list => setClients(list.map(c => ({ value: c.id, label: c.name }))))
            .catch(error => console.error('Error loading clients for swap:', error));
        if (initialClientId) {
            dataService.getUnitsByClient(initialClientId)
                .then(list => setUnits(toUnitOptions(list)))
                .catch(error => console.error('Error loading units for swap:', error));
        }
    }, [initialClientId]);

    const handleClientChange = async (value: string) => {
        setClientId(value);
        setUnitId('');
        setUnits([]);
        setResults([]);
        setSearched(false);
        setSelected(null);
        if (!value) return;
        try {
            setUnits(toUnitOptions(await dataService.getUnitsByClient(value)));
        } catch (error) {
            console.error('Error loading units for client:', value, error);
        }
    };

    const handleSearch = async () => {
        if (!code.trim()) {
            toast.info('Informe o código para pesquisar');
            return;
        }
        try {
            setIsSearching(true);
            const found = await dataService.getAssets('active', code, unitId || undefined);
            const filtered = found.filter(r => r.id !== currentAssetId);
            setResults(filtered);
            setSelected(null);
            setSearched(true);
            if (filtered.length === 0) toast.info('Nenhum ativo encontrado com este código para esta unidade');
        } catch (error) {
            console.error('Error searching assets:', error);
            toast.error('Erro ao pesquisar ativos');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="fixed inset-0 z-150 bg-slate-100 dark:bg-slate-950 animate-in slide-in-from-right duration-300 overflow-y-auto sheet-safe-bottom">
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Voltar"
                        className="w-11 h-11 -ml-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Buscar Ativo</h2>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 pb-12 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={reportLabelClass}>Cliente</label>
                        <Select options={clients} value={clientId} onChange={(e) => handleClientChange(e.target.value)} placeholder="Selecione o cliente..." />
                    </div>
                    <div>
                        <label className={reportLabelClass}>Unidade</label>
                        <Select options={units} value={unitId} onChange={(e) => setUnitId(e.target.value)} placeholder="Selecione a unidade..." disabled={!clientId} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={reportLabelClass} htmlFor="ova-swap-code">Código do Ativo</label>
                        <div className="flex gap-2">
                            <input
                                id="ova-swap-code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Ex: MTR-01"
                                disabled={!unitId}
                                className="flex-1 h-12 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={isSearching || !code}
                                aria-label="Pesquisar"
                                className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20"
                            >
                                {isSearching ? <Loading size="xs" /> : <span className="material-symbols-outlined">search</span>}
                            </button>
                        </div>
                    </div>
                </div>

                {isSearching && (
                    <div className="flex justify-center py-12"><Loading size="sm" /></div>
                )}

                {!isSearching && results.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                            Resultados Encontrados ({results.length})
                        </h4>
                        <div className="space-y-3">
                            {results.map(res => {
                                const isSelected = selected?.id === res.id;
                                const mappedAsset: any = {
                                    ...res,
                                    beforeUnitDescription: res.unitDescriptionFull,
                                    beforeTagDescription: res.tagName,
                                    beforeTagSubDescription: res.tagSubName,
                                    beforeStatusDescription: res.statusCode,
                                    beforeStatusColor: res.statusColor,
                                };
                                return (
                                    <div key={res.id} className="space-y-3">
                                        <div className={isSelected ? 'ring-2 ring-indigo-500 rounded-2xl shadow-xl ring-offset-4 bg-white dark:bg-slate-900 dark:ring-offset-slate-950 transition-all' : ''}>
                                            <OrderVisitAssetCardListItem asset={mappedAsset} onClick={() => setSelected(isSelected ? null : res)} />
                                        </div>
                                        {isSelected && (
                                            <button
                                                type="button"
                                                onClick={() => onConfirm(res)}
                                                disabled={isSwapping}
                                                className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-black rounded-[24px] shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
                                            >
                                                {isSwapping ? <Loading size="xs" /> : (
                                                    <>
                                                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                                                        CONFIRMAR SUBSTITUIÇÃO
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!isSearching && searched && results.length === 0 && (
                    <div className="text-center py-12 px-6">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <span className="material-symbols-outlined text-4xl">search_off</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum Ativo Encontrado</h3>
                    </div>
                )}
            </div>
        </div>
    );
};
