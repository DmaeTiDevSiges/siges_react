import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../../services/dataService';
import type {
    AssetsAvailableIntegration,
    AssetsAvailableIntegrationLog,
    AssetsAvailableIntegrationMapping,
    UnitAssetTagOption,
} from '../../services/assets/assetsAvailableIntegrationsService';
import type { Company } from '../../types';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Loading } from '../../components/ui/Loading';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge, StatusType } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TabsBar } from '../../components/ui/TabsBar';
import { Modal } from '../../components/ui/Modal';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { Button } from '../../components/ui/Button';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { formatDateInBrazil } from '../../utils/formatters';

// APIs externas de disponibilidade de ativos (plano
// docs/PLANO_INTEGRACAO_DISPONIBILIDADE_APIS.md). Credenciais ficam no n8n.

const ROUTE_KEY = 'dashboard_assets_available_integrations';

type DetailTab = 'mappings' | 'logs';

interface FormState {
    id: number | null;
    companyId: string;
    providerCompanyId: string;
    name: string;
    providerCode: string;
    baseUrl: string;
    config: string;
    isActive: boolean;
}

const EMPTY_FORM: FormState = {
    id: null,
    companyId: '',
    providerCompanyId: '',
    name: '',
    providerCode: '',
    baseUrl: '',
    config: '{\n  "status_path": "status",\n  "status_map": { "ON": true, "OFF": false }\n}',
    isActive: true,
};

const RESULT_BADGE: Record<AssetsAvailableIntegrationLog['result'], { status: StatusType; label: string }> = {
    applied: { status: 'active', label: 'Aplicado' },
    unchanged: { status: 'inactive', label: 'Sem mudança' },
    duplicate: { status: 'inactive', label: 'Duplicado' },
    pending_mapping: { status: 'pending', label: 'Sem mapeamento' },
    rejected: { status: 'error', label: 'Rejeitado' },
    error: { status: 'error', label: 'Erro' },
};

const fmtDateTime = (value: string | null) => (value ? formatDateInBrazil(value, 'dateTime') : '—');

const iconButtonClass = 'p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer';
const iconButtonDangerClass = 'p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer';
const cardClass = 'bg-white dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-3 p-4';

const IconTile: React.FC<{ icon: string; tone?: 'primary' | 'success' | 'danger' | 'muted' }> = ({ icon, tone = 'primary' }) => {
    const tones = {
        primary: 'bg-primary/10 text-primary',
        success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        danger: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        muted: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    };
    return (
        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${tones[tone]}`}>
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
    );
};

const MetaLine: React.FC<{ icon: string; children: React.ReactNode; mono?: boolean }> = ({ icon, children, mono }) => (
    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
        <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">{icon}</span>
        <span className={`text-xs text-slate-500 dark:text-slate-400 truncate ${mono ? 'font-mono' : ''}`}>{children}</span>
    </div>
);

const AddButton: React.FC<{ onClick: () => void; title: string }> = ({ onClick, title }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center h-12 w-12 shrink-0 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-sm cursor-pointer"
        title={title}
        aria-label={title}
    >
        <span className="material-symbols-outlined">add</span>
    </button>
);

interface DashboardAssetsAvailableIntegrationsProps {
    /** Aberta dentro de Ajustes (APIs externas): o título já vem do cabeçalho do app. */
    embedded?: boolean;
}

export const DashboardAssetsAvailableIntegrations: React.FC<DashboardAssetsAvailableIntegrationsProps> = ({ embedded = false }) => {
    const { canView, canCreate, canEdit, canDelete, loading: permissionsLoading } = usePermissions();
    const allowView = canView(ROUTE_KEY);
    const allowCreate = canCreate(ROUTE_KEY);
    const allowEdit = canEdit(ROUTE_KEY);
    const allowDelete = canDelete(ROUTE_KEY);

    const [integrations, setIntegrations] = useState<AssetsAvailableIntegration[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [toDelete, setToDelete] = useState<AssetsAvailableIntegration | null>(null);

    const [selected, setSelected] = useState<AssetsAvailableIntegration | null>(null);
    const [detailTab, setDetailTab] = useState<DetailTab>('mappings');
    const [mappings, setMappings] = useState<AssetsAvailableIntegrationMapping[]>([]);
    const [logs, setLogs] = useState<AssetsAvailableIntegrationLog[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const [isMappingOpen, setIsMappingOpen] = useState(false);
    const [mappingExternalId, setMappingExternalId] = useState('');
    const [mappingTargetId, setMappingTargetId] = useState('');
    const [mappingSearch, setMappingSearch] = useState('');
    const [mappingOptions, setMappingOptions] = useState<UnitAssetTagOption[]>([]);
    const [mappingToDelete, setMappingToDelete] = useState<AssetsAvailableIntegrationMapping | null>(null);

    const companyName = useCallback(
        (id: number | null) => companies.find(c => Number(c.id) === id)?.name || (id ? `#${id}` : '—'),
        [companies]
    );

    const loadIntegrations = useCallback(async () => {
        setLoading(true);
        try {
            const [integrationsData, companiesData] = await Promise.all([
                dataService.getAssetsAvailableIntegrations(),
                dataService.getCompanies(),
            ]);
            setIntegrations(integrationsData);
            setCompanies(companiesData);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao carregar APIs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!permissionsLoading && allowView) loadIntegrations();
    }, [permissionsLoading, allowView, loadIntegrations]);

    const loadDetails = useCallback(async (integrationId: number) => {
        setDetailLoading(true);
        try {
            const [mappingsData, logsData] = await Promise.all([
                dataService.getAssetsAvailableIntegrationMappings(integrationId),
                dataService.getAssetsAvailableIntegrationLogs(integrationId),
            ]);
            setMappings(mappingsData);
            setLogs(logsData);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao carregar detalhes da API');
        } finally {
            setDetailLoading(false);
        }
    }, []);

    // Busca de setores/ativos para mapear (debounce simples).
    useEffect(() => {
        if (mappingSearch.trim().length < 2) {
            setMappingOptions([]);
            return;
        }
        const handle = setTimeout(async () => {
            try {
                setMappingOptions(await dataService.searchUnitAssetTagsForMapping(mappingSearch));
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Erro ao buscar setores');
            }
        }, 350);
        return () => clearTimeout(handle);
    }, [mappingSearch]);

    const closeForm = () => {
        setIsFormOpen(false);
        setForm(EMPTY_FORM);
    };

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setIsFormOpen(true);
    };

    const openEdit = (integration: AssetsAvailableIntegration) => {
        setForm({
            id: integration.id,
            companyId: String(integration.companyId),
            providerCompanyId: integration.providerCompanyId ? String(integration.providerCompanyId) : '',
            name: integration.name,
            providerCode: integration.providerCode,
            baseUrl: integration.baseUrl || '',
            config: JSON.stringify(integration.config || {}, null, 2),
            isActive: integration.isActive,
        });
        setIsFormOpen(true);
    };

    const openDetail = (integration: AssetsAvailableIntegration) => {
        setSelected(integration);
        setDetailTab('mappings');
        setMappings([]);
        setLogs([]);
        loadDetails(integration.id);
    };

    const openMappingForm = (externalId = '') => {
        setMappingExternalId(externalId);
        setMappingTargetId('');
        setMappingSearch('');
        setMappingOptions([]);
        setIsMappingOpen(true);
    };

    const handleSave = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (saving || (form.id ? !allowEdit : !allowCreate)) return;

        let config: Record<string, unknown>;
        try {
            const parsed = JSON.parse(form.config || '{}');
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
            config = parsed;
        } catch {
            toast.error('A configuração deve ser um objeto JSON válido');
            return;
        }
        if (!form.name.trim() || !form.companyId) {
            toast.error('Informe o nome e a empresa dona da API');
            return;
        }
        if (!/^[a-z0-9][a-z0-9_-]*$/.test(form.providerCode.trim())) {
            toast.error('Código do provedor: use apenas letras minúsculas, números, "_" ou "-"');
            return;
        }

        const input = {
            companyId: Number(form.companyId),
            providerCompanyId: form.providerCompanyId ? Number(form.providerCompanyId) : null,
            name: form.name,
            providerCode: form.providerCode,
            baseUrl: form.baseUrl || null,
            config,
            isActive: form.isActive,
        };

        setSaving(true);
        try {
            if (form.id) {
                const updated = await dataService.updateAssetsAvailableIntegration(form.id, input);
                if (selected?.id === updated.id) setSelected(updated);
                toast.success('API atualizada!');
            } else {
                await dataService.createAssetsAvailableIntegration(input);
                toast.success('API criada!');
            }
            closeForm();
            await loadIntegrations();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar API');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!toDelete || !allowDelete) return;
        setSaving(true);
        try {
            await dataService.deleteAssetsAvailableIntegration(toDelete.id);
            toast.success('API excluída!');
            if (selected?.id === toDelete.id) setSelected(null);
            setToDelete(null);
            closeForm();
            await loadIntegrations();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao excluir API');
        } finally {
            setSaving(false);
        }
    };

    const handleMappingCreate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!selected || !allowEdit || saving) return;
        if (!mappingExternalId.trim() || !mappingTargetId) {
            toast.error('Informe o ID externo e selecione o setor/ativo');
            return;
        }
        setSaving(true);
        try {
            await dataService.createAssetsAvailableIntegrationMapping({
                integrationId: selected.id,
                externalId: mappingExternalId,
                unitAssetTagId: Number(mappingTargetId),
                isActive: true,
            });
            toast.success('Mapeamento criado!');
            setIsMappingOpen(false);
            await loadDetails(selected.id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar mapeamento');
        } finally {
            setSaving(false);
        }
    };

    const handleMappingToggle = async (mapping: AssetsAvailableIntegrationMapping) => {
        if (!selected || !allowEdit) return;
        try {
            await dataService.updateAssetsAvailableIntegrationMapping(mapping.id, { isActive: !mapping.isActive });
            await loadDetails(selected.id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao atualizar mapeamento');
        }
    };

    const handleMappingDelete = async () => {
        if (!selected || !mappingToDelete || !allowDelete) return;
        setSaving(true);
        try {
            await dataService.deleteAssetsAvailableIntegrationMapping(mappingToDelete.id);
            toast.success('Mapeamento excluído!');
            setMappingToDelete(null);
            await loadDetails(selected.id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao excluir mapeamento');
        } finally {
            setSaving(false);
        }
    };

    // Itens externos que chegaram sem mapeamento: atalho para mapear.
    const pendingExternalIds = useMemo(() => {
        const mapped = new Set(mappings.map(m => m.externalId));
        const ids = logs
            .filter(l => l.result === 'pending_mapping' && l.externalId && !mapped.has(l.externalId))
            .map(l => l.externalId as string);
        return [...new Set(ids)];
    }, [logs, mappings]);

    const filteredIntegrations = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return integrations;
        return integrations.filter(i =>
            i.name.toLowerCase().includes(term) || i.providerCode.toLowerCase().includes(term)
        );
    }, [integrations, searchTerm]);

    const editingIntegration = useMemo(
        () => (form.id ? integrations.find(i => i.id === form.id) || null : null),
        [form.id, integrations]
    );

    const companyOptions = useMemo(
        () => companies.map(c => ({ value: String(c.id), label: c.name || c.code })),
        [companies]
    );

    if (permissionsLoading) return <div className="p-8"><Loading /></div>;

    if (!allowView) {
        return <EmptyState icon="lock" message="Seu perfil não tem permissão para visualizar as APIs externas." />;
    }

    // ── Detalhe: mapeamentos e logs ─────────────────────────────────────────
    const renderDetail = (integration: AssetsAvailableIntegration) => (
        <div className="flex flex-col">
            <div className="px-4 pt-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                <div className={`${cardClass} flex items-center gap-3`}>
                    <button onClick={() => setSelected(null)} className={iconButtonClass} title="Voltar para a lista" aria-label="Voltar para a lista">
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <IconTile icon="api" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{integration.name}</h3>
                            <StatusBadge status={integration.isActive ? 'active' : 'inactive'} size="sm" />
                        </div>
                        <MetaLine icon="tag" mono>{integration.providerCode}</MetaLine>
                    </div>
                    {allowEdit && (
                        <button onClick={() => openEdit(integration)} className={iconButtonClass} title="Editar API" aria-label="Editar API">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                    )}
                </div>
                <TabsBar
                    className="px-1"
                    activeTab={detailTab}
                    onTabChange={(tab) => setDetailTab(tab as DetailTab)}
                    tabs={[
                        { id: 'mappings', label: `Mapeamentos (${mappings.length})` },
                        { id: 'logs', label: `Logs (${logs.length})` },
                    ]}
                />
            </div>

            <div className="px-4 pt-4 pb-32">
                {detailLoading ? (
                    <div className="p-8"><Loading /></div>
                ) : detailTab === 'mappings' ? (
                    <>
                        {allowEdit && pendingExternalIds.length > 0 && (
                            <div className={`${cardClass} border-amber-200 dark:border-amber-900/40`}>
                                <MetaLine icon="warning">IDs recebidos sem mapeamento — toque para mapear:</MetaLine>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {pendingExternalIds.map(id => (
                                        <button key={id} onClick={() => openMappingForm(id)}
                                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer">
                                            {id}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {mappings.length === 0 ? (
                            <EmptyState
                                icon="link_off"
                                message="Nenhum mapeamento cadastrado para esta API"
                                action={allowEdit ? { label: 'Novo mapeamento', onClick: () => openMappingForm() } : undefined}
                            />
                        ) : (
                            <>
                                {allowEdit && (
                                    <div className="flex justify-end mb-3">
                                        <AddButton onClick={() => openMappingForm()} title="Novo mapeamento" />
                                    </div>
                                )}
                                {mappings.map(m => (
                                    <div key={m.id} className={`${cardClass} flex items-center gap-3`}>
                                        <IconTile icon="link" tone={m.isActive ? 'primary' : 'muted'} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-bold font-mono text-slate-900 dark:text-white truncate">{m.externalId}</h3>
                                                <StatusBadge status={m.isActive ? 'active' : 'inactive'} size="sm" />
                                            </div>
                                            <MetaLine icon="location_on">{m.unitAssetTagLabel || `Setor #${m.unitAssetTagId}`}</MetaLine>
                                            <MetaLine icon="schedule">
                                                Última leitura: {fmtDateTime(m.lastSourceReportedAt)}
                                                {m.lastIsAvailable != null && ` · ${m.lastIsAvailable ? 'Disponível' : 'Indisponível'}`}
                                            </MetaLine>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {allowEdit && (
                                                <button onClick={() => handleMappingToggle(m)} className={iconButtonClass}
                                                    title={m.isActive ? 'Desativar' : 'Ativar'} aria-label={m.isActive ? 'Desativar' : 'Ativar'}>
                                                    <span className="material-symbols-outlined text-[20px]">{m.isActive ? 'toggle_on' : 'toggle_off'}</span>
                                                </button>
                                            )}
                                            {allowDelete && (
                                                <button onClick={() => setMappingToDelete(m)} className={iconButtonDangerClass} title="Excluir" aria-label="Excluir">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                ) : logs.length === 0 ? (
                    <EmptyState icon="history" message="Nenhum evento registrado para esta API" />
                ) : (
                    logs.map(log => {
                        const badge = RESULT_BADGE[log.result] || { status: 'inactive' as StatusType, label: log.result };
                        return (
                            <div key={log.id} className={`${cardClass} flex items-start gap-3`}>
                                <IconTile
                                    icon={log.isAvailable == null ? 'help' : log.isAvailable ? 'check_circle' : 'cancel'}
                                    tone={log.isAvailable == null ? 'muted' : log.isAvailable ? 'success' : 'danger'}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-bold font-mono text-slate-900 dark:text-white truncate">{log.externalId || '—'}</h3>
                                        <StatusBadge status={badge.status} label={badge.label} size="sm" />
                                    </div>
                                    <MetaLine icon="sensors">Leitura na fonte: {fmtDateTime(log.sourceReportedAt)}</MetaLine>
                                    <MetaLine icon="schedule">Processado: {fmtDateTime(log.createdAt)}</MetaLine>
                                    {log.message && <MetaLine icon="info">{log.message}</MetaLine>}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    // ── Lista ───────────────────────────────────────────────────────────────
    const renderList = () => (
        <div className="flex flex-col">
            <div className="px-4 py-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
                {!embedded && (
                    <h2 className="px-1 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        APIs externas de disponibilidade
                    </h2>
                )}
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder="Buscar por nome ou código do provedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClear={() => setSearchTerm('')}
                        />
                    </div>
                    {allowCreate && <AddButton onClick={openCreate} title="Nova API" />}
                </div>
            </div>

            <div className="px-4 pb-32">
                {loading ? (
                    <div className="p-8"><Loading /></div>
                ) : filteredIntegrations.length === 0 ? (
                    <EmptyState
                        icon="api"
                        message={searchTerm ? 'Nenhuma API encontrada para esta busca' : 'Nenhuma API cadastrada'}
                        action={!searchTerm && allowCreate ? { label: 'Cadastrar API', onClick: openCreate } : undefined}
                    />
                ) : (
                    filteredIntegrations.map(integration => (
                        <div
                            key={integration.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => (allowEdit ? openEdit(integration) : openDetail(integration))}
                            onKeyDown={(e) => { if (e.key === 'Enter') (allowEdit ? openEdit(integration) : openDetail(integration)); }}
                            className={`${cardClass} group flex items-center gap-3 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                        >
                            <IconTile icon="api" tone={integration.isActive ? 'primary' : 'muted'} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{integration.name}</h3>
                                    <StatusBadge status={integration.isActive ? 'active' : 'inactive'} size="sm" />
                                </div>
                                <MetaLine icon="tag" mono>{integration.providerCode}</MetaLine>
                                <MetaLine icon="business">{companyName(integration.companyId)}</MetaLine>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openDetail(integration); }}
                                    className={iconButtonClass}
                                    title="Mapeamentos e logs"
                                    aria-label="Mapeamentos e logs"
                                >
                                    <span className="material-symbols-outlined text-[20px]">link</span>
                                </button>
                                <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <>
            {selected ? renderDetail(selected) : renderList()}

            {/* ── Cadastro / edição da API ── */}
            <Modal
                isOpen={isFormOpen}
                onClose={closeForm}
                title={form.id ? 'Editar API' : 'Nova API'}
                maxWidth="lg"
                noPadding
            >
                <form onSubmit={handleSave} className="flex flex-col">
                    {saving && (
                        <div className="h-1 overflow-hidden bg-primary/20">
                            <div className="h-full bg-primary animate-loading-bar w-[40%]" />
                        </div>
                    )}
                    <div className="p-4 space-y-5">
                        <Input label="Nome" required value={form.name} placeholder="Ex.: Telemetria — Unidade Centro"
                            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                        <Input label="Código do provedor (adaptador)" required value={form.providerCode} placeholder="Ex.: telemetria_v1"
                            onChange={(e) => setForm(f => ({ ...f, providerCode: e.target.value.toLowerCase() }))} />
                        <Select label="Empresa dona da API" value={form.companyId} placeholder="Selecione..."
                            options={companyOptions}
                            onChange={(e) => setForm(f => ({ ...f, companyId: String(e.target.value) }))} />
                        <Select label="Empresa provedora da leitura (opcional)" value={form.providerCompanyId} placeholder="Não informar"
                            clearable options={companyOptions}
                            onChange={(e) => setForm(f => ({ ...f, providerCompanyId: String(e.target.value || '') }))} />
                        <Input label="URL base da API" type="url" value={form.baseUrl} placeholder="https://..."
                            onChange={(e) => setForm(f => ({ ...f, baseUrl: e.target.value }))} />
                        <div className="space-y-1.5">
                            <Textarea
                                label="Configuração do adaptador (JSON)"
                                rows={7}
                                value={form.config}
                                onChange={(e) => setForm(f => ({ ...f, config: e.target.value }))}
                                className="font-mono text-sm"
                                spellCheck={false}
                            />
                            <p className="px-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Somente parâmetros não secretos (ex.: <code>status_path</code>, <code>status_map</code>, <code>reason_map</code>).
                                Tokens e senhas são recusados — cadastre-os nas Credentials do n8n.
                            </p>
                        </div>
                        <Select
                            label="Situação"
                            value={form.isActive ? 'active' : 'inactive'}
                            onChange={(e) => setForm(f => ({ ...f, isActive: e.target.value === 'active' }))}
                            options={[
                                { value: 'active', label: 'Ativa' },
                                { value: 'inactive', label: 'Inativa' },
                            ]}
                        />

                        {editingIntegration && (
                            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button"
                                    onClick={() => { const target = editingIntegration; closeForm(); openDetail(target); }}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold cursor-pointer">
                                    <span className="material-symbols-outlined text-[18px]">link</span> Mapeamentos e logs
                                </button>
                            </div>
                        )}
                    </div>
                    {editingIntegration ? (
                        // Edição: Excluir no lugar de Cancelar (fechar fica no X do modal).
                        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-3">
                            {allowDelete && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    fullWidth
                                    disabled={saving}
                                    onClick={() => setToDelete(editingIntegration)}
                                    className="!text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-900/20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span> Excluir
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="primary"
                                fullWidth
                                onClick={handleSave}
                                loading={saving}
                                disabled={!form.name.trim() || !form.providerCode.trim() || !form.companyId}
                            >
                                Salvar
                            </Button>
                        </div>
                    ) : (
                        <ButtonSave
                            onSave={handleSave}
                            onCancel={closeForm}
                            isSaving={saving}
                            saveLabel="Criar API"
                            disabled={!form.name.trim() || !form.providerCode.trim() || !form.companyId}
                        />
                    )}
                </form>
            </Modal>

            {/* ── Novo mapeamento ── */}
            <Modal
                isOpen={isMappingOpen}
                onClose={() => setIsMappingOpen(false)}
                title="Novo mapeamento"
                maxWidth="md"
                noPadding
            >
                <form onSubmit={handleMappingCreate} className="flex flex-col">
                    <div className="p-4 space-y-5">
                        <Input label="ID externo" required value={mappingExternalId}
                            placeholder="Exatamente como a API envia"
                            onChange={(e) => setMappingExternalId(e.target.value)} />
                        <div className="space-y-1.5">
                            <label className="block px-1 text-sm font-medium text-slate-700 dark:text-slate-300">Setor/ativo do SIGES</label>
                            <SearchInput
                                placeholder="Código ou descrição da unidade/setor..."
                                value={mappingSearch}
                                onChange={(e) => { setMappingSearch(e.target.value); setMappingTargetId(''); }}
                                onClear={() => { setMappingSearch(''); setMappingTargetId(''); }}
                            />
                        </div>
                        {mappingOptions.length > 0 && (
                            <Select label="Resultado" value={mappingTargetId} placeholder="Selecione..."
                                options={mappingOptions.map(o => ({ value: String(o.id), label: o.label }))}
                                onChange={(e) => setMappingTargetId(String(e.target.value))} />
                        )}
                        <p className="px-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Relacione pelo ID externo estável — nunca pelo nome exibido na API.
                        </p>
                    </div>
                    <ButtonSave
                        onSave={handleMappingCreate}
                        onCancel={() => setIsMappingOpen(false)}
                        isSaving={saving}
                        saveLabel="Adicionar"
                        disabled={!mappingExternalId.trim() || !mappingTargetId}
                    />
                </form>
            </Modal>

            <ConfirmDeleteModal
                isOpen={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={handleDelete}
                isLoading={saving}
                title="Excluir API"
                description={<>Excluir <strong>{toDelete?.name}</strong>? APIs com mapeamentos ou histórico não podem ser excluídas — inative-as.</>}
            />

            <ConfirmDeleteModal
                isOpen={!!mappingToDelete}
                onClose={() => setMappingToDelete(null)}
                onConfirm={handleMappingDelete}
                isLoading={saving}
                title="Excluir mapeamento"
                description={<>Excluir o mapeamento <strong>{mappingToDelete?.externalId}</strong>? Mapeamentos com histórico não podem ser excluídos — desative-os.</>}
            />
        </>
    );
};
