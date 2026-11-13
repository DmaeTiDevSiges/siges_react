/**
 * Escolha do relatório de ORIGEM para copiar para o relatório atual (em rascunho).
 * Lista os outros ativos da mesma visita, exceto os rejeitados. As fotos não são copiadas.
 */
import React, { useEffect, useState } from 'react';
import { Modal } from '../../../ui/Modal';
import { Loading } from '../../../ui/Loading';
import { SearchInput } from '../../../ui/SearchInput';
import { dataService } from '../../../../services/dataService';
import type { OrderVisitAssetView } from '../../../../types';
import { OVA_PROCESSING } from './assetReportShared';

const PROCESSING_BADGE: Record<number, { label: string; className: string }> = {
    [OVA_PROCESSING.DRAFT]: { label: 'Rascunho', className: 'bg-slate-500/10 text-slate-500 dark:text-slate-300' },
    [OVA_PROCESSING.REPORTED]: { label: 'Reportado', className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' },
    [OVA_PROCESSING.REVIEWED]: { label: 'Revisado', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    [OVA_PROCESSING.APPROVED]: { label: 'Aprovado', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
};

interface Props {
    isOpen: boolean;
    visitId?: string;
    currentOvaId: string;
    onClose: () => void;
    onSelect: (source: OrderVisitAssetView) => void;
}

export const AssetReportCopyFromModal: React.FC<Props> = ({ isOpen, visitId, currentOvaId, onClose, onSelect }) => {
    const [sources, setSources] = useState<OrderVisitAssetView[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    // Busca por código ou descrição (sem diferenciar maiúsculas/acentos).
    const normalize = (v?: string) => (v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const term = normalize(search.trim());
    const filteredSources = term
        ? sources.filter(s => normalize(s.code).includes(term) || normalize(s.description).includes(term))
        : sources;

    useEffect(() => {
        if (!isOpen || !visitId) return;
        setSearch('');
        let cancelled = false;
        setLoading(true);
        setError('');
        dataService.getOrderVisitAssets(visitId)
            .then(list => {
                if (cancelled) return;
                setSources(list.filter(a =>
                    String(a.id) !== String(currentOvaId) &&
                    Number(a.processingId) !== OVA_PROCESSING.REJECTED));
            })
            .catch(() => { if (!cancelled) setError('Erro ao carregar os ativos da visita.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen, visitId, currentOvaId]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Copiar de outro ativo" maxWidth="md" hideCancelButton>
            <div className="flex flex-col gap-3">
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                    <span className="material-symbols-outlined text-[16px] shrink-0">info</span>
                    Copia condições, horímetro, situação final, movimentação, plano, atividades e materiais.
                    As fotos não são copiadas. O que este relatório já tem será substituído.
                </p>

                <SearchInput
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onClear={() => setSearch('')}
                    placeholder="Pesquisar por código ou descrição"
                    disabled={loading || sources.length === 0}
                    autoFocus
                />

                {loading ? (
                    <div className="py-10 flex justify-center"><Loading size="sm" /></div>
                ) : error ? (
                    <p className="py-6 text-center text-sm font-semibold text-red-500">{error}</p>
                ) : sources.length === 0 ? (
                    <p className="py-6 text-center text-sm font-semibold text-slate-400">
                        Nenhum outro ativo desta visita disponível para copiar (rejeitados não aparecem).
                    </p>
                ) : filteredSources.length === 0 ? (
                    <p className="py-6 text-center text-sm font-semibold text-slate-400">Nenhum ativo encontrado para "{search.trim()}".</p>
                ) : (
                    <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
                        {filteredSources.map(source => {
                            const badge = PROCESSING_BADGE[Number(source.processingId)] || { label: source.processingDescription || '—', className: 'bg-slate-500/10 text-slate-500' };
                            const sector = [source.beforeTagDescription, source.beforeTagSubDescription].filter(Boolean).join(' > ');
                            return (
                                <button
                                    key={source.id}
                                    type="button"
                                    onClick={() => onSelect(source)}
                                    className="w-full text-left p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/80 hover:border-indigo-400 hover:shadow-md transition-all active:scale-[0.99]"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{source.description || 'Ativo'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase truncate mt-0.5">
                                                {source.code}{sector ? ` • ${sector}` : ''}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${badge.className}`}>{badge.label}</span>
                                    </div>
                                    {source.activitiesDescription && (
                                        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{source.activitiesDescription}</p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
};
