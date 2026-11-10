/**
 * Movimentação do ativo: origem (como está hoje) → destino (como fica ao aprovar).
 * Carrega as próprias listas (clientes, unidades, setores, situações, prioridades).
 */
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../../../../services/dataService';
import { Select } from '../../../ui/Select';
import { ReportEmptyState, ReportSection, ReportSwitch, reportLabelClass, reportTextareaClass } from './assetReportShared';

type Option = { value: string; label: string };

export interface UnitAssetTagOption {
    id: string;
    description: string;
    asset_tag_id?: string | number | null;
    asset_tag_sub_id?: string | number | null;
}

export interface MovementOrigin {
    clientName?: string;
    unitDescription?: string;
    tagDescription?: string;
    statusDescription?: string;
    location?: string;
}

export interface MovementValues {
    clientId: string;
    unitId: string;
    unitAssetTagId: string;
    statusId: string;
    priorityId?: number;
    location: string;
    comments: string;
}

interface Props {
    id: string;
    className?: string;
    isMoved: boolean;
    isReadOnly: boolean;
    origin: MovementOrigin;
    values: MovementValues;
    /** Marca a seção quando falta campo obrigatório na hora de reportar. */
    showMissing?: boolean;
    onToggle: (value: boolean) => void;
    onClientChange: (clientId: string) => void;
    onUnitChange: (unitId: string) => void;
    onUnitAssetTagChange: (tag: UnitAssetTagOption | null) => void;
    onStatusChange: (statusId: string) => void;
    onPriorityChange: (priorityId: number | undefined) => void;
    onLocationChange: (value: string) => void;
    onCommentsChange: (value: string) => void;
    onTextBlur: () => void;
}

const labelOf = (options: Option[], value?: string | number) =>
    value === undefined || value === '' ? undefined : options.find(o => String(o.value) === String(value))?.label;

const OriginDestRow: React.FC<{ label: string; from?: string; to?: string }> = ({ label, from, to }) => {
    const changed = !!to && to !== from;
    return (
        <div className="grid grid-cols-[88px_minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-2 py-1.5 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</span>
            <span className="truncate text-slate-500 dark:text-slate-400" title={from}>{from || '—'}</span>
            <span className="material-symbols-outlined text-sm text-slate-300">arrow_forward</span>
            <span className={`truncate font-bold ${changed ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} title={to}>
                {to || '—'}
            </span>
        </div>
    );
};

export const AssetReportMovementSection: React.FC<Props> = ({
    id, className, isMoved, isReadOnly, origin, values, showMissing,
    onToggle, onClientChange, onUnitChange, onUnitAssetTagChange, onStatusChange, onPriorityChange,
    onLocationChange, onCommentsChange, onTextBlur,
}) => {
    const [clients, setClients] = useState<Option[]>([]);
    const [statuses, setStatuses] = useState<Option[]>([]);
    const [priorities, setPriorities] = useState<Option[]>([]);
    const [units, setUnits] = useState<Option[]>([]);
    const [tags, setTags] = useState<UnitAssetTagOption[]>([]);

    useEffect(() => {
        if (!isMoved) return;
        let active = true;
        Promise.all([dataService.getClients(), dataService.getAssetStatuses(), dataService.getAssetPriorities()])
            .then(([c, s, p]) => {
                if (!active) return;
                setClients(c.map(x => ({ value: x.id, label: x.name })));
                setStatuses(s.map(x => ({ value: x.id, label: x.description })));
                setPriorities(p.map(x => ({ value: x.id, label: x.description })));
            })
            .catch(error => {
                console.error('Error loading movement lists:', error);
                if (active) toast.error('Erro ao carregar opções de movimentação');
            });
        return () => { active = false; };
    }, [isMoved]);

    useEffect(() => {
        let active = true;
        setUnits([]);
        if (!isMoved || !values.clientId) return () => { active = false; };
        dataService.getUnitsByClient(values.clientId)
            .then(list => {
                if (!active) return;
                setUnits(list
                    .map(u => ({ value: u.id, label: u.descriptionFull || u.description }))
                    .sort((a, b) => a.label.localeCompare(b.label)));
            })
            .catch(error => {
                console.error('Error loading units for selected client:', error);
                if (active) toast.error('Erro ao carregar unidades do cliente selecionado');
            });
        return () => { active = false; };
    }, [values.clientId, isMoved]);

    useEffect(() => {
        let active = true;
        setTags([]);
        if (!isMoved || !values.unitId) return () => { active = false; };
        dataService.getAssetTagsByUnit(values.unitId)
            .then(list => { if (active) setTags(list as UnitAssetTagOption[]); })
            .catch(error => {
                console.error('Error loading sectors for selected unit:', error);
                if (active) toast.error('Erro ao carregar setores da unidade selecionada');
            });
        return () => { active = false; };
    }, [values.unitId, isMoved]);

    const tagOptions = tags.map(t => ({ value: t.id, label: t.description }));
    const dest = {
        client: labelOf(clients, values.clientId),
        unit: labelOf(units, values.unitId),
        tag: labelOf(tagOptions, values.unitAssetTagId),
        status: labelOf(statuses, values.statusId),
    };

    return (
        <ReportSection
            id={id}
            className={className}
            icon="local_shipping"
            title="Movimentação"
            status={showMissing ? 'missing' : undefined}
            summary={isMoved ? `Destino: ${dest.unit || '—'}` : 'Sem movimentação'}
            action={<ReportSwitch checked={isMoved} onChange={onToggle} disabled={isReadOnly} label="Ativo foi movimentado" />}
        >
            {isMoved ? (
                <div className="space-y-5">
                    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 px-4 py-3">
                        <div className="grid grid-cols-[88px_minmax(0,1fr)_16px_minmax(0,1fr)] gap-2 pb-1 text-[10px] font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-300">
                            <span />
                            <span>Origem</span>
                            <span />
                            <span>Destino</span>
                        </div>
                        <OriginDestRow label="Cliente" from={origin.clientName} to={dest.client} />
                        <OriginDestRow label="Unidade" from={origin.unitDescription} to={dest.unit} />
                        <OriginDestRow label="Setor" from={origin.tagDescription} to={dest.tag} />
                        <OriginDestRow label="Situação" from={origin.statusDescription} to={dest.status} />
                        <OriginDestRow label="Local" from={origin.location} to={values.location} />
                    </div>

                    <div className="grid gap-4 @lg:grid-cols-2">
                        <Select
                            label="Cliente / Parceiro *"
                            placeholder="Selecione o destino..."
                            options={clients}
                            value={values.clientId}
                            onChange={(e) => onClientChange(e.target.value)}
                            disabled={isReadOnly}
                        />
                        <Select
                            label="Unidade *"
                            placeholder="Selecione a unidade de destino..."
                            options={units}
                            value={values.unitId}
                            onChange={(e) => onUnitChange(e.target.value)}
                            disabled={isReadOnly || !values.clientId}
                        />
                        <Select
                            label="Setor / Posição *"
                            placeholder="Selecione o setor/posição..."
                            options={tagOptions}
                            value={values.unitAssetTagId}
                            onChange={(e) => onUnitAssetTagChange(tags.find(t => t.id === e.target.value) || null)}
                            disabled={isReadOnly || !values.unitId}
                        />
                        <Select
                            label="Situação *"
                            options={statuses}
                            value={values.statusId}
                            onChange={(e) => onStatusChange(e.target.value)}
                            disabled={isReadOnly}
                        />
                        <Select
                            label="Prioridade *"
                            options={priorities}
                            value={values.priorityId?.toString()}
                            onChange={(e) => onPriorityChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>
                        <label className={reportLabelClass} htmlFor={`${id}-location`}>Localização</label>
                        <textarea
                            id={`${id}-location`}
                            value={values.location}
                            onChange={(e) => onLocationChange(e.target.value)}
                            onBlur={onTextBlur}
                            disabled={isReadOnly}
                            placeholder="Localização específica..."
                            className={`${reportTextareaClass} min-h-[56px]`}
                        />
                    </div>

                    <div>
                        <label className={reportLabelClass} htmlFor={`${id}-comments`}>Observações</label>
                        <textarea
                            id={`${id}-comments`}
                            value={values.comments}
                            onChange={(e) => onCommentsChange(e.target.value)}
                            onBlur={onTextBlur}
                            disabled={isReadOnly}
                            placeholder="Observações sobre a movimentação..."
                            className={`${reportTextareaClass} min-h-[80px]`}
                        />
                    </div>
                </div>
            ) : (
                <ReportEmptyState>Ligue a chave se o ativo mudou de cliente, unidade, setor, situação ou prioridade.</ReportEmptyState>
            )}
        </ReportSection>
    );
};
