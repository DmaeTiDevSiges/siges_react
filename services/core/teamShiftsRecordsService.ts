import { supabase } from './supabase';
import { TeamShiftsRecord, TeamShiftsMonthLock, TeamShiftsSaveEntry } from '../../types';
import { getBrazilTimestamp } from '../../utils/dateUtils';

/**
 * Registro mensal de turnos por equipe (lançamento manual — aba OCIOSIDADE).
 *
 * - teams_shifts_records: 1 linha por equipe × mês de competência.
 * - teams_shifts_months:   fechamento de competência por departamento —
 *                          quando registrado, o mês não pode mais ser editado.
 *
 * As políticas de escrita "admin" são feitas na aplicação (gate isAdminSuper),
 * mesmo padrão das demais tabelas cfg_* do projeto.
 */
const RECORDS_TABLE = 'teams_shifts_records';
const LOCKS_TABLE = 'teams_shifts_months';

const hasContent = (entry: TeamShiftsSaveEntry): boolean =>
    (entry.normalShifts > 0) || (entry.extraShifts > 0) || !!entry.note?.trim();

export const teamShiftsRecordsService = {

    async getTeamShiftsRecords(referenceMonth: string): Promise<TeamShiftsRecord[]> {
        const { data, error } = await supabase
            .from(RECORDS_TABLE)
            .select('*')
            .eq('reference_month', referenceMonth)
            .order('team_id', { ascending: true });

        if (error) {
            console.error('Error fetching team shifts records:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id?.toString(),
            teamId: row.team_id.toString(),
            referenceMonth: row.reference_month,
            normalShifts: row.normal_shifts ?? 0,
            extraShifts: row.extra_shifts ?? 0,
            note: row.note || null,
            createdBy: row.created_by?.toString(),
            updatedBy: row.updated_by?.toString(),
            updatedAt: row.updated_at
        })) as TeamShiftsRecord[];
    },

    /**
     * Salva o lançamento do mês em lote (upsert por equipe × mês).
     *
     * - `records` deve conter TODAS as equipes da página com o estado atual
     *   dos inputs; lançamentos sem conteúdo (zerados e sem observação) são
     *   REMOVIDOS, para que o contador de "equipes sem lançamento" continue
     *   fazendo sentido.
     * - `created_by` original é preservado: inserts e updates são separados.
     * - Lança erro se a competência estiver fechada.
     */
    async saveTeamShiftsRecords(
        referenceMonth: string,
        departmentId: string,
        records: TeamShiftsSaveEntry[],
        userId: string
    ): Promise<void> {
        const lock = await teamShiftsRecordsService.getMonthLock(referenceMonth, departmentId);
        if (lock) {
            throw new Error('Este mês está fechado e não pode mais ser editado.');
        }

        const existing = await teamShiftsRecordsService.getTeamShiftsRecords(referenceMonth);
        const existingById = new Map(existing.map(r => [r.teamId, r]));
        const draftsById = new Map(records.map(r => [r.teamId, r]));
        const now = getBrazilTimestamp();

        const toInsert = records
            .filter(r => hasContent(r) && !existingById.has(r.teamId))
            .map(r => ({
                team_id: Number(r.teamId),
                reference_month: referenceMonth,
                normal_shifts: Math.max(0, Math.round(r.normalShifts || 0)),
                extra_shifts: Math.max(0, Math.round(r.extraShifts || 0)),
                note: r.note?.trim() || null,
                created_by: Number(userId),
                created_at: now,
                updated_by: Number(userId),
                updated_at: now
            }));

        if (toInsert.length > 0) {
            const { error } = await supabase.from(RECORDS_TABLE).insert(toInsert);
            if (error) throw new Error(`Erro ao salvar turnos: ${error.message}`);
        }

        for (const entry of records) {
            if (!hasContent(entry) || !existingById.has(entry.teamId)) continue;
            const { error } = await supabase
                .from(RECORDS_TABLE)
                .update({
                    normal_shifts: Math.max(0, Math.round(entry.normalShifts || 0)),
                    extra_shifts: Math.max(0, Math.round(entry.extraShifts || 0)),
                    note: entry.note?.trim() || null,
                    updated_by: Number(userId),
                    updated_at: now
                })
                .eq('team_id', Number(entry.teamId))
                .eq('reference_month', referenceMonth);
            if (error) throw new Error(`Erro ao salvar turnos: ${error.message}`);
        }

        // Remove registros que foram explicitamente zerados (sem conteúdo)
        const toDelete = existing
            .filter(r => {
                const draft = draftsById.get(r.teamId);
                return draft !== undefined && !hasContent(draft);
            })
            .map(r => Number(r.teamId))
            .filter(id => Number.isInteger(id) && id > 0);

        if (toDelete.length > 0) {
            const { error } = await supabase
                .from(RECORDS_TABLE)
                .delete()
                .in('team_id', toDelete)
                .eq('reference_month', referenceMonth);
            if (error) throw new Error(`Erro ao remover lançamentos zerados: ${error.message}`);
        }
    },

    async getMonthLock(referenceMonth: string, departmentId: string): Promise<TeamShiftsMonthLock | null> {
        const { data, error } = await supabase
            .from(LOCKS_TABLE)
            .select('*')
            .eq('reference_month', referenceMonth)
            .eq('department_id', Number(departmentId))
            .maybeSingle();

        if (error) {
            console.error('Error fetching team shifts month lock:', error);
            return null;
        }
        if (!data) return null;

        return {
            referenceMonth: data.reference_month,
            departmentId: data.department_id?.toString(),
            lockedBy: data.locked_by?.toString(),
            lockedAt: data.locked_at
        } as TeamShiftsMonthLock;
    },

    /** Fecha a competência do mês (idempotente). */
    async lockMonth(referenceMonth: string, departmentId: string, userId: string): Promise<void> {
        const current = await teamShiftsRecordsService.getMonthLock(referenceMonth, departmentId);
        if (current) return;

        const { error } = await supabase
            .from(LOCKS_TABLE)
            .insert({
                reference_month: referenceMonth,
                department_id: Number(departmentId),
                locked_by: Number(userId),
                locked_at: getBrazilTimestamp()
            });

        if (error) throw new Error(`Erro ao fechar o mês: ${error.message}`);
    }
};
