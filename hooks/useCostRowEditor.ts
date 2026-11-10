/**
 * useCostRowEditor — edição de linhas de custo (quantidade, valor unitário e
 * A/D) usada em materiais do ativo e serviços da visita.
 *
 * - Guarda o texto digitado (ex.: "12,") sem perder o cursor.
 * - Atualiza a linha na hora com a mesma conta do banco
 *   (amount * value_unit * COALESCE(discount, 1)).
 * - Grava ~1 s depois de parar de digitar, ao sair do campo ou após − / +;
 *   uma gravação por linha por vez, na ordem.
 * - Depois de gravar, troca o total pelo valor oficial do servidor (trigger).
 * - Ao desmontar, grava o que estiver pendente.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

export type CostField = 'amount' | 'valueUnit' | 'discount';
export type CostSaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface CostRow {
    id: string;
    amount: number;
    valueUnit: number;
    discount: number;
    valueTotal?: number;
}

export const COST_FIELD_DECIMALS: Record<CostField, number> = { amount: 2, valueUnit: 2, discount: 4 };

/** Mesma conta dos triggers do banco. */
export const computeCostTotal = (r: Pick<CostRow, 'amount' | 'valueUnit' | 'discount'>) =>
    (r.amount || 0) * (r.valueUnit || 0) * (r.discount ?? 1);

/** Só dígitos e uma vírgula, com limite de casas. pt-BR: ponto é milhar quando há vírgula. */
export const sanitizeCostNumber = (text: string, decimals: number): { display: string; value: number | null } => {
    let s = text.replace(/[^\d.,]/g, '');
    if (s.includes(',') || (s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    s = s.replace(',', '.');
    const parts = s.split('.');
    if (parts.length > 2) s = `${parts[0]}.${parts.slice(1).join('')}`;
    const [int, dec] = s.split('.');
    if (dec !== undefined && dec.length > decimals) s = `${int}.${dec.slice(0, decimals)}`;
    const value = parseFloat(s);
    const valid = s !== '' && !s.endsWith('.') && Number.isFinite(value) && value >= 0;
    return { display: s.replace('.', ','), value: valid ? value : null };
};

const formatPlain = (value: number | undefined, decimals: number) => {
    const n = value || 0;
    return n % 1 === 0 ? String(n) : n.toFixed(decimals).replace('.', ',');
};

/** Moeda BR sem "R$": 1.234,56 */
export const formatMoneyPlain = (value?: number) =>
    (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Options<T extends CostRow> {
    setRows: React.Dispatch<React.SetStateAction<T[]>>;
    /** Grava os campos alterados de uma linha. */
    save: (id: string, updates: Partial<Record<CostField, number>>) => Promise<void>;
    /** Busca o total oficial da linha após gravar (opcional). */
    fetchTotal?: (id: string) => Promise<number | undefined>;
    /** Falha ao gravar (ex.: avisar e recarregar). */
    onError?: (error: unknown) => void;
    /** Depois de cada gravação bem-sucedida (ex.: atualizar totais da visita). */
    onSaved?: () => void;
    delayMs?: number;
}

export const useCostRowEditor = <T extends CostRow>({ setRows, save, fetchTotal, onError, onSaved, delayMs = 1000 }: Options<T>) => {
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [saveState, setSaveState] = useState<CostSaveState>('idle');
    const pendingRef = useRef<Map<string, Partial<Record<CostField, number>>>>(new Map());
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const chainsRef = useRef<Map<string, Promise<void>>>(new Map());
    const inFlightRef = useRef(0);

    // Callbacks mais recentes sem recriar flushRow
    const cbRef = useRef({ save, fetchTotal, onError, onSaved });
    cbRef.current = { save, fetchTotal, onError, onSaved };

    const flushRow = useCallback((id: string): Promise<void> => {
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        const updates = pendingRef.current.get(id);
        if (!updates || Object.keys(updates).length === 0) return chainsRef.current.get(id) || Promise.resolve();
        pendingRef.current.delete(id);

        inFlightRef.current += 1;
        setSaveState('saving');
        const previous = chainsRef.current.get(id) || Promise.resolve();
        const run = previous.then(async () => {
            try {
                await cbRef.current.save(id, updates);
                const official = cbRef.current.fetchTotal ? await cbRef.current.fetchTotal(id).catch(() => undefined) : undefined;
                if (official !== undefined && !pendingRef.current.has(id)) {
                    setRows(prev => prev.map(r => (r.id === id ? { ...r, valueTotal: official } : r)));
                }
                inFlightRef.current -= 1;
                if (inFlightRef.current === 0 && pendingRef.current.size === 0) setSaveState('saved');
                cbRef.current.onSaved?.();
            } catch (error) {
                inFlightRef.current -= 1;
                console.error('Error saving cost row:', error);
                setSaveState('error');
                cbRef.current.onError?.(error);
            }
        });
        chainsRef.current.set(id, run);
        return run;
    }, [setRows]);

    const queue = (id: string, updates: Partial<Record<CostField, number>>, delay = delayMs) => {
        pendingRef.current.set(id, { ...(pendingRef.current.get(id) || {}), ...updates });
        setSaveState('saving');
        const timer = timersRef.current.get(id);
        if (timer) clearTimeout(timer);
        timersRef.current.set(id, setTimeout(() => {
            timersRef.current.delete(id);
            flushRow(id);
        }, delay));
    };

    const flushRef = useRef(flushRow);
    flushRef.current = flushRow;
    useEffect(() => () => {
        Array.from(pendingRef.current.keys()).forEach(id => { flushRef.current(id); });
    }, []);

    const applyLocal = (id: string, field: CostField, value: number) => {
        setRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            const next = { ...r, [field]: value };
            return { ...next, valueTotal: computeCostTotal(next) };
        }));
    };

    const clearDraft = (id: string, field: CostField) => setDrafts(prev => {
        const next = { ...prev };
        delete next[`${id}_${field}`];
        return next;
    });

    /** Digitação num campo. */
    const change = (id: string, field: CostField, text: string) => {
        if (field === 'valueUnit') {
            // Máscara de moeda BR (igual ao CurrencyInput do app): só dígitos,
            // lidos como centavos — "1234" → 12,34. O campo sempre mostra 1.234,56.
            const digits = text.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
            const value = digits ? parseInt(digits.slice(-13), 10) / 100 : 0;
            clearDraft(id, field);
            applyLocal(id, field, value);
            queue(id, { valueUnit: value });
            return;
        }
        const { display, value } = sanitizeCostNumber(text, COST_FIELD_DECIMALS[field]);
        setDrafts(prev => ({ ...prev, [`${id}_${field}`]: display }));
        if (value === null) return;
        applyLocal(id, field, value);
        queue(id, { [field]: value });
    };

    /** Valor pronto (ex.: calculadora). Grava já. */
    const setValue = (id: string, field: CostField, value: number) => {
        clearDraft(id, field);
        applyLocal(id, field, value);
        queue(id, { [field]: value }, 0);
    };

    const blur = (id: string, field: CostField) => {
        clearDraft(id, field);
        flushRow(id);
    };

    /** Botões − / + da quantidade; toques seguidos viram uma gravação só. */
    const step = (row: T, delta: number) => {
        const value = Math.max(0, Math.round(((row.amount || 0) + delta) * 100) / 100);
        clearDraft(row.id, 'amount');
        applyLocal(row.id, 'amount', value);
        queue(row.id, { amount: value }, 600);
    };

    /** Descarta o pendente de uma linha (ex.: antes de removê-la). */
    const cancelRow = (id: string) => {
        const timer = timersRef.current.get(id);
        if (timer) clearTimeout(timer);
        timersRef.current.delete(id);
        pendingRef.current.delete(id);
    };

    const fieldText = (row: T, field: CostField) =>
        drafts[`${row.id}_${field}`] ?? (field === 'valueUnit'
            ? formatMoneyPlain(row.valueUnit)
            : formatPlain(row[field], COST_FIELD_DECIMALS[field]));

    return { saveState, fieldText, change, setValue, blur, step, cancelRow, flushRow };
};
