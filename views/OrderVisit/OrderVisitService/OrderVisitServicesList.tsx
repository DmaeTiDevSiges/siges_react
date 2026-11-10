/**
 * OrderVisitServicesList — aba "Serviços" da visita.
 *
 * Layout por largura do próprio conteúdo (container queries), dentro da aba:
 *  - celular: cartão com descrição + lixeira; quantidade (− + e calculadora)
 *    na largura toda; valor unitário e A/D lado a lado; total à direita;
 *  - desktop: mesma linha de descrição; quantidade, valor, A/D e total numa linha.
 * Busca no contrato sempre visível (quando editável); serviço já incluído aparece
 * como "Na visita". Edição com o mesmo comportamento dos materiais do ativo
 * (hooks/useCostRowEditor): grava ~1 s depois de parar de digitar e mostra o
 * total oficial do banco.
 */
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ContractService, OrderVisitService } from '../../../types';
import { dataService } from '../../../services/dataService';
import { useAuth } from '../../../contexts/AuthContext';
import { useCostRowEditor } from '../../../hooks/useCostRowEditor';
import { AD_TOOLTIP, AdjustHint, CostSaveStatus, NumberInput, QtyStepper, appLabelClass, brl } from '../../../components/ordersVisits/ordersVisitsCosts/CostFields';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { CalculatorModal } from '../../../components/ui/CalculatorModal';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Loading } from '../../../components/ui/Loading';

interface OrderVisitServicesListProps {
    visitId: string;
    isEditable?: boolean;
    contractId?: string;
    onVisitRefresh?: () => void;
}

/** Minúsculas e sem acento. */
const normalize = (value?: string) =>
    (value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const OrderVisitServicesList: React.FC<OrderVisitServicesListProps> = ({
    visitId,
    isEditable = true,
    contractId,
    onVisitRefresh
}) => {
    const { currentUser: authUser } = useAuth();
    const [visitServices, setVisitServices] = useState<OrderVisitService[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState('');

    // Busca no contrato
    const [searchTerm, setSearchTerm] = useState('');
    const [contractServices, setContractServices] = useState<ContractService[] | null>(null);
    const [loadingContract, setLoadingContract] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    // Remoção e calculadora
    const [serviceToDelete, setServiceToDelete] = useState<OrderVisitService | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [calculatorServiceId, setCalculatorServiceId] = useState<string | null>(null);

    const loadVisitServices = async () => {
        try {
            const data = await dataService.getOrderVisitServices(visitId);
            setVisitServices(data);
        } catch (error) {
            console.error('Error loading visit services:', error);
            toast.error('Erro ao carregar serviços da visita');
        }
    };

    useEffect(() => {
        let active = true;
        setLoading(true);
        loadVisitServices().finally(() => { if (active) setLoading(false); });
        dataService.getCurrentUser()
            .then(u => { if (active) setUserId(u?.id || ''); })
            .catch(() => undefined);
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visitId]);

    const editor = useCostRowEditor<OrderVisitService>({
        setRows: setVisitServices,
        save: (id, updates) => dataService.updateOrderVisitService(id, updates),
        fetchTotal: async (id) => (await dataService.getOrderVisitServices(visitId)).find(s => s.id === id)?.valueTotal,
        onSaved: onVisitRefresh,
        onError: () => {
            toast.error('Erro ao salvar o serviço. Os valores foram recarregados.');
            loadVisitServices();
        },
    });

    // Serviços do contrato: poucos por contrato, carregados uma vez e filtrados aqui
    const ensureContractServices = async () => {
        if (!contractId || contractServices || loadingContract) return;
        try {
            setLoadingContract(true);
            setContractServices(await dataService.getContractServices(contractId));
        } catch (error) {
            console.error('Error loading contract services:', error);
            toast.error('Erro ao carregar serviços do contrato');
        } finally {
            setLoadingContract(false);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (term.trim()) ensureContractServices();
    };

    const search = normalize(searchTerm);
    const results = search
        ? (contractServices || []).filter(s => normalize(s.serviceDescription).includes(search) || normalize(s.serviceCode).includes(search))
        : [];
    // cfg_services.id do serviço da visita (vs.serviceId) x do serviço do contrato (s.serviceId)
    const addedServiceIds = new Set(visitServices.map(vs => vs.serviceId));

    const handleAdd = async (cs: ContractService) => {
        const uid = userId || authUser?.id || '';
        if (!uid) {
            toast.error('Não foi possível identificar o usuário. Abra a tela novamente.');
            return;
        }
        try {
            setAddingId(cs.id);
            await dataService.addServiceToOrderVisit(visitId, cs.id, uid);
            await loadVisitServices();
            onVisitRefresh?.();
        } catch (error) {
            console.error('Error adding service:', error);
            toast.error('Erro ao adicionar serviço');
        } finally {
            setAddingId(null);
        }
    };

    const confirmRemove = async () => {
        if (!serviceToDelete) return;
        setIsDeleting(true);
        try {
            editor.cancelRow(serviceToDelete.id);
            await dataService.removeServiceFromOrderVisit(serviceToDelete.id);
            setVisitServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
            setServiceToDelete(null);
            onVisitRefresh?.();
        } catch (error) {
            console.error('Error removing service:', error);
            toast.error('Erro ao remover serviço');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loading size="sm" />
            </div>
        );
    }

    const total = visitServices.reduce((sum, vs) => sum + (vs.valueTotal || 0), 0);
    const count = visitServices.length;
    const canAdd = isEditable && !!contractId;

    return (
        <div
            className={`@container flex flex-col gap-4 ${canAdd
                ? 'lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-6 lg:items-start'
                : ''}`}
        >
            {/* Desktop (lg+, com inclusão liberada): busca no contrato à esquerda (fixa ao rolar),
                serviços realizados à direita. Mobile: empilhado — resumo, busca, lista. */}

            {/* Resumo */}
            <div className="flex items-end justify-between gap-3 lg:col-start-2 lg:row-start-1">
                <div>
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                        Serviços realizados ({count})
                    </h3>
                    {isEditable && editor.saveState !== 'idle' && <CostSaveStatus state={editor.saveState} />}
                </div>
                {count > 0 && (
                    <div className="text-right">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{brl(total)}</span>
                    </div>
                )}
            </div>

            {!contractId && (
                <div className="lg:col-span-2 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 text-sm font-bold text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <span className="material-symbols-outlined">description</span>
                    Contrato não vinculado a esta ordem: não é possível incluir serviços.
                </div>
            )}

            {/* Busca no contrato */}
            {canAdd && (
                <section
                    className="space-y-2 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-0 lg:p-4 lg:rounded-2xl lg:border lg:border-slate-200 lg:dark:border-slate-800 lg:bg-white lg:dark:bg-slate-900/60"
                    aria-label="Serviços do contrato"
                >
                    <h3 className="hidden lg:block text-[11px] font-black text-slate-500 uppercase tracking-widest">
                        Serviços do contrato
                    </h3>
                    <SearchInput
                        inputMode="search"
                        aria-label="Buscar serviço do contrato"
                        placeholder="Buscar serviço do contrato por nome ou código"
                        value={searchTerm}
                        onFocus={ensureContractServices}
                        onChange={(e) => handleSearch(e.target.value)}
                        onClear={() => setSearchTerm('')}
                        className="text-base"
                    />

                    {search && loadingContract && (
                        <div className="flex justify-center py-4"><Loading size="xs" /></div>
                    )}

                    {search && !loadingContract && results.length === 0 && (
                        <p className="px-1 py-3 text-sm font-bold text-slate-500">Nenhum serviço do contrato encontrado para "{searchTerm}".</p>
                    )}

                    {search && !loadingContract && results.length > 0 && (
                        <ul className="space-y-2 max-h-80 lg:max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
                            {results.map(cs => {
                                const added = addedServiceIds.has(cs.serviceId);
                                const isAdding = addingId === cs.id;
                                return (
                                    <li
                                        key={cs.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border ${added
                                            ? 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                            }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug">{cs.serviceDescription}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {[cs.serviceCode, cs.serviceUnit].filter(Boolean).join(' · ')} · {brl(cs.valueUnit)}
                                            </p>
                                        </div>
                                        {added ? (
                                            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                                                <span className="material-symbols-outlined text-base">check_circle</span>
                                                Na visita
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleAdd(cs)}
                                                disabled={isAdding}
                                                aria-label={`Adicionar ${cs.serviceDescription}`}
                                                className="w-11 h-11 shrink-0 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 disabled:opacity-60"
                                            >
                                                <span className={`material-symbols-outlined ${isAdding ? 'animate-spin' : ''}`}>
                                                    {isAdding ? 'progress_activity' : 'add'}
                                                </span>
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            )}

            {/* Serviços da visita */}
            {count === 0 ? (
                <div className="lg:col-start-2 lg:row-start-2 p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined text-3xl text-slate-300">construction</span>
                    <p className="mt-1 text-sm font-bold text-slate-500">Nenhum serviço registrado.</p>
                    {canAdd && <p className="text-xs text-slate-400">Busque um serviço do contrato acima e toque em +.</p>}
                </div>
            ) : (
                // @container próprio: as linhas se ajustam à largura da coluna, não da tela.
                <ul className="@container space-y-3 lg:col-start-2 lg:row-start-2 min-w-0">
                    {visitServices.map(vs => (
                        <li key={vs.id} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="absolute left-0 inset-y-0 w-1 bg-indigo-500" aria-hidden="true" />

                            {/* Linha 1: descrição + lixeira */}
                            <div className="flex items-center gap-3 pl-5 pr-2 py-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="min-w-0 flex-1 py-1">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-snug">{vs.serviceDescription}</p>
                                    <p className="text-[11px] text-slate-500">
                                        {[vs.serviceCode, vs.serviceUnit].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                                {isEditable && (
                                    <button
                                        type="button"
                                        onClick={() => setServiceToDelete(vs)}
                                        aria-label={`Remover ${vs.serviceDescription}`}
                                        title="Remover serviço"
                                        className="w-11 h-11 shrink-0 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                )}
                            </div>

                            {/* Linha 2: campos */}
                            <div className="pl-5 pr-4 py-3 grid gap-3 grid-cols-2 @xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] @xl:items-start">
                                <div className="col-span-2 @xl:col-span-1">
                                    <span className={appLabelClass}>Quantidade</span>
                                    <QtyStepper
                                        value={editor.fieldText(vs, 'amount')}
                                        amount={vs.amount || 0}
                                        unit={vs.serviceUnit}
                                        disabled={!isEditable}
                                        onChange={(t) => editor.change(vs.id, 'amount', t)}
                                        onBlur={() => editor.blur(vs.id, 'amount')}
                                        onStep={(d) => editor.step(vs, d)}
                                        extra={
                                            <button
                                                type="button"
                                                onClick={() => setCalculatorServiceId(vs.id)}
                                                aria-label="Calculadora"
                                                title="Calculadora"
                                                className="w-12 h-12 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] text-indigo-500 shadow-sm flex items-center justify-center hover:border-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined">calculate</span>
                                            </button>
                                        }
                                    />
                                </div>

                                <NumberInput
                                    label="Vlr. unit."
                                    value={editor.fieldText(vs, 'valueUnit')}
                                    disabled={!isEditable}
                                    onChange={(t) => editor.change(vs.id, 'valueUnit', t)}
                                    onBlur={() => editor.blur(vs.id, 'valueUnit')}
                                />

                                <div title={AD_TOOLTIP}>
                                    <NumberInput
                                        label="A / D (fator)"
                                        value={editor.fieldText(vs, 'discount')}
                                        disabled={!isEditable}
                                        onChange={(t) => editor.change(vs.id, 'discount', t)}
                                        onBlur={() => editor.blur(vs.id, 'discount')}
                                    />
                                    <AdjustHint factor={vs.discount} />
                                </div>

                                <div className="col-span-2 @xl:col-span-1 flex items-baseline justify-end gap-2 @xl:block @xl:text-right @xl:min-w-[110px]">
                                    <span className={`${appLabelClass} !mb-0 @xl:!mb-1.5`}>Total</span>
                                    <span className="block text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums @xl:h-12 @xl:leading-[3rem]">
                                        {brl(vs.valueTotal)}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <ConfirmDeleteModal
                isOpen={!!serviceToDelete}
                onClose={() => { if (!isDeleting) setServiceToDelete(null); }}
                onConfirm={confirmRemove}
                title="Remover Serviço"
                description={serviceToDelete ? (
                    <>Confirma a remoção do serviço <strong className="text-slate-700 dark:text-slate-200">{serviceToDelete.serviceDescription}</strong>?</>
                ) : undefined}
                isLoading={isDeleting}
            />

            <CalculatorModal
                isOpen={!!calculatorServiceId}
                currentValue={calculatorServiceId ? visitServices.find(vs => vs.id === calculatorServiceId)?.amount || 0 : 0}
                onApply={(result) => {
                    if (calculatorServiceId) editor.setValue(calculatorServiceId, 'amount', Math.max(0, Math.round(Number(result) * 100) / 100));
                    setCalculatorServiceId(null);
                }}
                onClose={() => setCalculatorServiceId(null)}
            />
        </div>
    );
};
