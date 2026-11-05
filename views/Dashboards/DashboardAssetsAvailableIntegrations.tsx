import React, { useCallback, useMemo, useState } from 'react';
import { dataService } from '../../services/dataService';
import { PermissionsGate } from '../../components/permissions/PermissionsGate';
import { Loading } from '../../components/ui/Loading';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { Card } from '../../components/ui/Card';
import { usePermissions } from '../../contexts/PermissionsContext';

export const DashboardAssetsAvailableIntegrations: React.FC = () => {
    const {
        canView,
        canCreate,
        canEdit,
        canDelete,
        canSearch,
        loading: permissionsLoading
    } = usePermissions();

    const [activeSubroute, setActiveSubroute] = useState<'list' | 'create' | 'edit' | 'mappings' | 'logs'>('list');
    const [createForm, setCreateForm] = useState({
        name: '',
        providerCode: '',
        baseUrl: '',
        config: '{}',
        providerCompanyId: ''
    });
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
    const [mappings, setMappings] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [mappingForm, setMappingForm] = useState({
        externalId: '',
        unitAssetTagId: '',
        isActive: true
    });
    const [searchTerm, setSearchTerm] = useState('');

    const loadIntegrations = useCallback(async () => {
        try {
            const [integrationsData, companiesData] = await Promise.all([
                dataService.getAssetsAvailableIntegrations(),
                dataService.getCfgCompanies()
            ]);
            setIntegrations(integrationsData);
            setCompanies(companiesData);
        } catch (error) {
            toast.error('Erro ao carregar integrações');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDetails = useCallback(async (integrationId: number) => {
        try {
            const [integrationData, mappingsData, logsData] = await Promise.all([
                dataService.getAssetsAvailableIntegrationById(integrationId),
                dataService.getAssetsAvailableIntegrationMappings(integrationId),
                dataService.getAssetsAvailableIntegrationLogs(integrationId)
            ]);
            setSelectedIntegration(integrationData);
            setMappings(mappingsData);
            setLogs(logsData);
        } catch (error) {
            toast.error('Erro ao carregar detalhes da integração');
        }
    }, []);

    const handleCreate = async () => {
        if (!canCreate) return;
        setSaving(true);
        try {
            const config = JSON.parse(createForm.config || '{}');
            const providerCompanyId = createForm.providerCompanyId
                ? parseInt(createForm.providerCompanyId)
                : null;

            await dataService.createAssetsAvailableIntegration({
                name: createForm.name,
                providerCode: createForm.providerCode,
                baseUrl: createForm.baseUrl || null,
                config,
                providerCompanyId,
                isActive: true
            });

            toast.success('Integração criada com sucesso');
            setCreateForm({
                name: '',
                providerCode: '',
                baseUrl: '',
                config: '{}',
                providerCompanyId: ''
            });
            setActiveSubroute('list');
            await loadIntegrations();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar integração');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (integration: any) => {
        if (!canDelete) return;
        if (!window.confirm(`Deseja realmente excluir a integração "${integration.name}"?`)) return;

        try {
            await dataService.deleteAssetsAvailableIntegration(integration.id);
            toast.success('Integração excluída com sucesso');
            if (selectedIntegration?.id === integration.id) {
                setSelectedIntegration(null);
                setMappings([]);
                setLogs([]);
                setActiveSubroute('list');
            }
            await loadIntegrations();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao excluir integração');
        }
    };

    const handleMappingCreate = async () => {
        if (!selectedIntegration) return;
        if (!mappingForm.externalId.trim() || !mappingForm.unitAssetTagId) {
            toast.error('Preencha o ID externo e o setor/ativo');
            return;
        }

        try {
            await dataService.createAssetsAvailableIntegrationMapping({
                integrationId: selectedIntegration.id,
                externalId: mappingForm.externalId.trim(),
                unitAssetTagId: parseInt(mappingForm.unitAssetTagId),
                isActive: mappingForm.isActive
            });

            toast.success('Mapeamento criado com sucesso');
            setMappingForm({
                externalId: '',
                unitAssetTagId: '',
                isActive: true
            });
            await loadDetails(selectedIntegration.id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar mapeamento');
        }
    };

    const handleMappingToggle = async (mapping: any) => {
        if (!selectedIntegration) return;
        try {
            await dataService.updateAssetsAvailableIntegrationMapping(mapping.id, {
                isActive: !mapping.isActive
            });
            toast.success('Status do mapeamento atualizado');
            await loadDetails(selectedIntegration.id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao atualizar mapeamento');
        }
    };

    const filteredIntegrations = useMemo(() => {
        if (!searchTerm.trim()) return integrations;
        const term = searchTerm.toLowerCase();
        return integrations.filter(
            i =>
                i.name?.toLowerCase().includes(term) ||
                i.providerCode?.toLowerCase().includes(term)
        );
    }, [integrations, searchTerm]);

    if (permissionsLoading) {
        return <Loading size="md" />;
    }

    return (
        <PermissionsGate
            requireView={canView('dashboard_assets_available_integrations')}
            fallback={
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-3xl text-slate-400">lock</span>
                        <h2 className="mt-2 font-bold text-slate-900 dark:text-white">Acesso restrito</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Seu perfil não tem permissão para visualizar integrações de disponibilidade.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Integrações de Disponibilidade de Ativos
                    </h1>
                    {canCreate && (
                        <Button
                            onClick={() => setActiveSubroute('create')}
                            disabled={!canCreate}
                        >
                            Nova Integração
                        </Button>
                    )}
                </div>

                {/* Sub-routes navigation */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <button
                        onClick={() => {
                            setActiveSubroute('list');
                            setSelectedIntegration(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                            activeSubroute === 'list'
                                ? 'bg-primary text-white'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                        Todas as Integrações
                    </button>
                    {selectedIntegration && canSearch && (
                        <>
                            <button
                                onClick={() => {
                                    setActiveSubroute('mappings');
                                    loadDetails(selectedIntegration.id);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                    activeSubroute === 'mappings'
                                        ? 'bg-primary text-white'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                Mapeamentos
                            </button>
                            <button
                                onClick={() => {
                                    setActiveSubroute('logs');
                                    loadDetails(selectedIntegration.id);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                    activeSubroute === 'logs'
                                        ? 'bg-primary text-white'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                Logs
                            </button>
                        </>
                    )}
                </div>

                {/* List view */}
                {activeSubroute === 'list' && (
                    <div className="space-y-4">
                        <Input
                            placeholder="Buscar por nome ou código do provedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md"
                        />

                        {loading ? (
                            <Loading size="lg" />
                        ) : filteredIntegrations.length === 0 ? (
                            <Card>
                                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                                    Nenhuma integração encontrada
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredIntegrations.map((integration) => (
                                    <Card key={integration.id} className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                                        {integration.name}
                                                    </h3>
                                                    {integration.isActive ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-bold text-green-700 dark:text-green-300">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                            Ativo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                            Inativo
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                                                    <p>Código do provedor: <span className="font-mono font-bold">{integration.providerCode}</span></p>
                                                    {integration.baseUrl && (
                                                        <p>URL: <span className="font-mono text-xs">{integration.baseUrl}</span></p>
                                                    )}
                                                    {integration.providerCompanyId && (
                                                        <p>
                                                            Provedor interno:{' '}
                                                            {companies.find(c => c.id === integration.providerCompanyId)?.description || '—'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {canEdit && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedIntegration(integration);
                                                            setActiveSubroute('edit');
                                                        }}
                                                        className="px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        Editar
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(integration)}
                                                        className="px-3 py-1.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        Excluir
                                                    </button>
                                                )}
                                                {canSearch && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedIntegration(integration);
                                                            setActiveSubroute('mappings');
                                                            loadDetails(integration.id);
                                                        }}
                                                        className="px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        Mapeamentos
                                                    </button>
                                                )}
                                                {canSearch && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedIntegration(integration);
                                                            setActiveSubroute('logs');
                                                            loadDetails(integration.id);
                                                        }}
                                                        className="px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        Logs
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Create form */}
                {activeSubroute === 'create' && (
                    <Card className="max-w-2xl">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            Nova Integração de Disponibilidade
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Nome da Integração"
                                placeholder="Ex: GuaibaFlow - Guarujá"
                                value={createForm.name}
                                onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                                required
                            />

                            <Input
                                label="Código do Provedor"
                                placeholder="Ex: guaibaflow"
                                value={createForm.providerCode}
                                onChange={(e) => setCreateForm(f => ({ ...f, providerCode: e.target.value }))}
                                required
                                hint="Somente letras, números, hífens e underscores"
                            />

                            <Input
                                label="URL Base (opcional)"
                                placeholder="https://api.exemplo.com.br/status"
                                value={createForm.baseUrl}
                                onChange={(e) => setCreateForm(f => ({ ...f, baseUrl: e.target.value }))}
                                type="url"
                            />

                            <Select
                                label="Empresa/Provedor Interno (opcional)"
                                value={createForm.providerCompanyId}
                                onChange={(e) => setCreateForm(f => ({ ...f, providerCompanyId: e.target.value }))}
                                options={[
                                    { value: '', label: '— Não informar —' },
                                    ...companies.map(c => ({ value: String(c.id), label: c.description || c.code }))
                                ]}
                            />

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Configuração (JSON não secreto)
                                </label>
                                <textarea
                                    value={createForm.config}
                                    onChange={(e) => setCreateForm(f => ({ ...f, config: e.target.value }))}
                                    className="w-full h-32 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder='{"status_path": "status", "status_map": {"ON": true, "OFF": false}, "reason_map": {"manutencao": 35}}'
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Não inclua credenciais. Use somente parâmetros não secretos como status_path, status_map, reason_map.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <Switch
                                    label="Ativar integração"
                                    checked={createForm.isActive}
                                    onChange={(checked) => setCreateForm(f => ({ ...f, isActive: checked }))}
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <Button
                                    variant="secondary"
                                    onClick={() => setActiveSubroute('list')}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    loading={saving}
                                    disabled={!canCreate || !createForm.name.trim() || !createForm.providerCode.trim()}
                                >
                                    Criar Integração
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Edit form */}
                {activeSubroute === 'edit' && selectedIntegration && (
                    <Card className="max-w-2xl">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            Editar Integração: {selectedIntegration.name}
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Nome da Integração"
                                value={createForm.name || selectedIntegration.name}
                                onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                                required
                            />

                            <Input
                                label="Código do Provedor"
                                value={createForm.providerCode || selectedIntegration.providerCode}
                                onChange={(e) => setCreateForm(f => ({ ...f, providerCode: e.target.value }))}
                                required
                            />

                            <Input
                                label="URL Base"
                                value={createForm.baseUrl || selectedIntegration.baseUrl || ''}
                                onChange={(e) => setCreateForm(f => ({ ...f, baseUrl: e.target.value }))}
                                type="url"
                            />

                            <Select
                                label="Empresa/Provedor Interno"
                                value={createForm.providerCompanyId || String(selectedIntegration.providerCompanyId || '')}
                                onChange={(e) => setCreateForm(f => ({ ...f, providerCompanyId: e.target.value }))}
                                options={[
                                    { value: '', label: '— Não informar —' },
                                    ...companies.map(c => ({ value: String(c.id), label: c.description || c.code }))
                                ]}
                            />

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Configuração (JSON)
                                </label>
                                <textarea
                                    value={createForm.config || JSON.stringify(selectedIntegration.config || {}, null, 2)}
                                    onChange={(e) => setCreateForm(f => ({ ...f, config: e.target.value }))}
                                    className="w-full h-32 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <Switch
                                    label="Ativar integração"
                                    checked={createForm.isActive ?? selectedIntegration.isActive}
                                    onChange={(checked) => setCreateForm(f => ({ ...f, isActive: checked }))}
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setActiveSubroute('list');
                                        setSelectedIntegration(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!selectedIntegration) return;
                                        setSaving(true);
                                        try {
                                            const config = JSON.parse(createForm.config || '{}');
                                            const providerCompanyId = createForm.providerCompanyId
                                                ? parseInt(createForm.providerCompanyId)
                                                : null;

                                            await dataService.updateAssetsAvailableIntegration(selectedIntegration.id, {
                                                name: createForm.name || selectedIntegration.name,
                                                providerCode: createForm.providerCode || selectedIntegration.providerCode,
                                                baseUrl: createForm.baseUrl || selectedIntegration.baseUrl || null,
                                                config,
                                                providerCompanyId,
                                                isActive: createForm.isActive ?? selectedIntegration.isActive
                                            });

                                            toast.success('Integração atualizada com sucesso');
                                            setSelectedIntegration({
                                                ...selectedIntegration,
                                                ...createForm
                                            });
                                            await loadIntegrations();
                                        } catch (error) {
                                            toast.error(error instanceof Error ? error.message : 'Erro ao atualizar');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={!canEdit}
                                    loading={saving}
                                >
                                    Salvar Alterações
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Mappings view */}
                {activeSubroute === 'mappings' && selectedIntegration && (
                    <Card className="max-w-4xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Mapeamentos — {selectedIntegration.name}
                            </h2>
                            {canCreate && (
                                <Button onClick={() => setActiveSubroute('create')}>
                                    Novo Mapeamento
                                </Button>
                            )}
                        </div>

                        {canCreate && (
                            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                                    Adicionar Mapeamento
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        label="ID Externo (como recebido da API)"
                                        placeholder="Ex: 25"
                                        value={mappingForm.externalId}
                                        onChange={(e) => setMappingForm(f => ({ ...f, externalId: e.target.value }))}
                                        required
                                    />

                                    <Select
                                        label="Setor/Ativo do SIGES"
                                        value={mappingForm.unitAssetTagId}
                                        onChange={(e) => setMappingForm(f => ({ ...f, unitAssetTagId: e.target.value }))}
                                        options={[
                                            { value: '', label: 'Selecione...' },
                                            ...companies.flatMap(c =>
                                                c.units?.map(u => ({
                                                    value: String(u.id),
                                                    label: `${c.description} - ${u.description || u.code}`
                                                })) || []
                                            )
                                        ]}
                                        required
                                    />

                                    <div className="flex items-center gap-4 pt-6">
                                        <Switch
                                            label="Ativo"
                                            checked={mappingForm.isActive}
                                            onChange={(checked) => setMappingForm(f => ({ ...f, isActive: checked }))}
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="mt-4"
                                    onClick={handleMappingCreate}
                                    disabled={!canCreate || !mappingForm.externalId.trim() || !mappingForm.unitAssetTagId}
                                >
                                    Criar Mapeamento
                                </Button>
                            </div>
                        )}

                        {mappings.length === 0 ? (
                            <p className="text-slate-500 dark:text-slate-400 text-center py-6">
                                Nenhum mapeamento cadastrado para esta integração.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {mappings.map((mapping) => (
                                    <div
                                        key={mapping.id}
                                        className="flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                ID Externo: <span className="font-mono">{mapping.externalId}</span>
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Setor/Ativo:{' '}
                                                {mapping.unitAssetTag?.description ||
                                                    mapping.unitAssetTag?.code ||
                                                    '—'}
                                            </p>
                                            {mapping.lastSourceReportedAt && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                    Última leitura:{' '}
                                                    {new Date(mapping.lastSourceReportedAt).toLocaleString('pt-BR', {
                                                        timeZone: 'America/Sao_Paulo'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`${
                                                mapping.isActive
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            } px-2 py-0.5 rounded-full text-xs font-bold`}>
                                                {mapping.isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                            {canEdit && (
                                                <button
                                                    onClick={() => handleMappingToggle(mapping)}
                                                    className="text-sm px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                >
                                                    {mapping.isActive ? 'Desativar' : 'Ativar'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {/* Logs view */}
                {activeSubroute === 'logs' && selectedIntegration && (
                    <Card className="max-w-4xl">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            Logs — {selectedIntegration.name}
                        </h2>

                        {logs.length === 0 ? (
                            <p className="text-slate-500 dark:text-slate-400 text-center py-6">
                                Nenhum log registrado para esta integração.
                            </p>
                        ) : (
                            <div className="space-y-3 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left p-3 font-bold text-slate-600 dark:text-slate-300">
                                                Data/Hora
                                            </th>
                                            <th className="text-left p-3 font-bold text-slate-600 dark:text-slate-300">
                                                Resultado
                                            </th>
                                            <th className="text-left p-3 font-bold text-slate-600 dark:text-slate-300">
                                                ID Externo
                                            </th>
                                            <th className="text-left p-3 font-bold text-slate-600 dark:text-slate-300">
                                                Mensagem
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="p-3 text-slate-600 dark:text-slate-300">
                                                    {log.createdAt &&
                                                        new Date(log.createdAt).toLocaleString('pt-BR', {
                                                            timeZone: 'America/Sao_Paulo'
                                                        })}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                        log.result === 'applied'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                            : log.result === 'error' || log.result === 'rejected'
                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                        {log.result}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                                                    {log.externalId || '—'}
                                                </td>
                                                <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                                    {log.message || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </PermissionsGate>
    );
};
