import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AuditTableConfig, AuditTableConfigChange, AUDITED_TABLES } from '../../../types';
import { dataService } from '../../../services/dataService';
import { Loading } from '../../../components/ui/Loading';
import { SearchInput } from '../../../components/ui/SearchInput';
import { toast } from 'sonner';

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

export const AuditTablesConfig: React.FC = () => {
    const [tables, setTables] = useState<AuditTableConfig[]>([]);
    const [draftEnabled, setDraftEnabled] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const loadConfig = useCallback(async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const config = await dataService.listAuditedTableConfig();
            setTables(config);
            setDraftEnabled(Object.fromEntries(config.map(table => [table.table_name, table.is_enabled])));
        } catch (error) {
            console.error('[AuditTablesConfig] Error loading config:', error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const tableLabels = useMemo(
        () => new Map<string, string>(AUDITED_TABLES.map(table => [table.key, table.label] as const)),
        []
    );
    const visibleTables = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase();
        return tables.filter(table => {
            const label = tableLabels.get(table.table_name) || table.table_name;
            return !normalizedSearch
                || label.toLocaleLowerCase().includes(normalizedSearch)
                || table.table_name.toLocaleLowerCase().includes(normalizedSearch);
        });
    }, [search, tableLabels, tables]);

    const changes = useMemo<AuditTableConfigChange[]>(() => tables
        .filter(table => table.table_exists && draftEnabled[table.table_name] !== table.is_enabled)
        .map(table => ({
            table_name: table.table_name,
            enabled: draftEnabled[table.table_name],
        })), [draftEnabled, tables]);

    const enabledCount = tables.filter(table => table.table_exists && draftEnabled[table.table_name]).length;
    const availableCount = tables.filter(table => table.table_exists).length;

    const handleSave = async () => {
        if (changes.length === 0 || saving) return;
        setSaving(true);
        try {
            await dataService.updateAuditedTableConfig(changes);
            setTables(previous => previous.map(table => {
                const change = changes.find(item => item.table_name === table.table_name);
                return change ? { ...table, is_enabled: change.enabled } : table;
            }));
            toast.success('Configuração de auditoria atualizada');
        } catch (error) {
            console.error('[AuditTablesConfig] Error saving config:', error);
            toast.error(`Não foi possível salvar a configuração: ${getErrorMessage(error)}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 pb-32 space-y-4">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Tabelas auditadas</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Escolha quais tabelas devem registrar novas inclusões, alterações e exclusões.
                            Desativar uma tabela não remove o histórico. Ao salvar, o banco pode bloquear brevemente
                            gravações nas tabelas alteradas enquanto os triggers são atualizados.
                        </p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                        {enabledCount} de {availableCount} tabelas ativas
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                        <SearchInput
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Buscar tabela..."
                        />
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                        {changes.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setDraftEnabled(Object.fromEntries(tables.map(table => [table.table_name, table.is_enabled])))}
                                disabled={saving}
                                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                                Descartar
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={changes.length === 0 || saving || loading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                            Salvar alterações{changes.length ? ` (${changes.length})` : ''}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loading size="md" />
                    </div>
                ) : errorMessage ? (
                    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">Não foi possível carregar a configuração de auditoria.</p>
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 break-words">{errorMessage}</p>
                        <button
                            type="button"
                            onClick={loadConfig}
                            className="mt-3 text-xs font-bold text-red-700 dark:text-red-300 hover:underline"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : visibleTables.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Nenhuma tabela encontrada.
                    </p>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {visibleTables.map(table => {
                            const enabled = draftEnabled[table.table_name] ?? false;
                            const label = tableLabels.get(table.table_name) || table.table_name;
                            return (
                                <label
                                    key={table.table_name}
                                    className={`flex items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-slate-900/30 ${table.table_exists ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'opacity-60'}`}
                                >
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                                        <span className="block text-xs text-slate-400 dark:text-slate-500 font-mono">{table.table_name}</span>
                                        {!table.table_exists && (
                                            <span className="block mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                                                Tabela inexistente neste banco; não pode ser ativada.
                                            </span>
                                        )}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={enabled}
                                        disabled={!table.table_exists || saving}
                                        onChange={event => setDraftEnabled(previous => ({
                                            ...previous,
                                            [table.table_name]: event.target.checked,
                                        }))}
                                        className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                                        aria-label={`Auditar tabela ${label}`}
                                    />
                                </label>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};
