// Rateio de aluguel veicular — contratos, competências e RPCs de apuração
// (dev/supabase/migrations/20261008_create_vehicle_rental_rateio.sql)
import { supabase } from '../core/supabase';
import { r2Service } from '../media/r2Service';

export type VehicleRentalPeriodStatus = 'OPEN' | 'CALCULATED' | 'ALLOCATED' | 'CLOSED';

export interface VehicleRentalContract {
    id: string;
    vehicleId: string;
    vehicleDescription?: string;
    vehiclePlates?: string;
    monthlyValue: number;
    /** Valor fixo por km integrado ao mesmo contrato do aluguel. */
    valueUnit: number;
    startDate: string;
    endDate?: string | null;
    active: boolean;
    description?: string | null;
    createdAt?: string;
}

export interface SaveVehicleRentalContractInput {
    id?: string;
    vehicleId: string;
    monthlyValue: number;
    /** Valor fixo por km integrado ao mesmo contrato do aluguel. */
    valueUnit: number;
    startDate: string;
    endDate?: string | null;
    active?: boolean;
    description?: string | null;
}

export interface VehicleRentalContractInfo {
    contractId: string;
    monthlyValue: number;
    hasConflict: boolean;
}

export interface VehicleRentalSummaryRow {
    periodId?: string | null;
    periodStatus: VehicleRentalPeriodStatus | string;
    vehicleId: string;
    vehicleDescription?: string;
    vehiclePlates?: string;
    contractId?: string | null;
    contractValue: number;
    hasConflict: boolean;
    totalKm: number;
    costPerKm?: number | null;
    allocatedValue: number;
    idleValue: number;
    utilization?: number | null;
    variableValue: number;
    variablePerKm?: number | null;
    /** Soma das linhas de Km do mês ('odometer' ou já convertidas para 'rate'). */
    operationalValue?: number | null;
    /** operational_value ÷ total_km (R$/km operacional puro). */
    operationalPerKm?: number | null;
}

export interface VehicleRentalDetailRow {
    periodId?: string | null;
    periodStatus: VehicleRentalPeriodStatus | string;
    ovId: string;
    ovvId: string;
    visitMask?: string;
    km: number;
    rate?: number | null;
    value: number;
    rentalValue: number;
    variableValue: number;
    rentalOvvId?: string | null;
    variableOvvId?: string | null;
    /** value_total da linha de Km da visita (componente R$/km). */
    operationalValue?: number | null;
}

/** Linha do painel Utilização (odômetro visita a visita na competência) */
export interface VehicleUtilizationRow {
    ovId: string;
    ovvId: string;
    visitMask?: string;
    visitStartAt?: string | null;
    visitEndAt?: string | null;
    kmInitial: number;
    kmFinal: number;
    kmDiff: number;
}

export interface VehicleRentalPeriod {
    id: string;
    vehicleId: string;
    referenceMonth: string;
    contractId?: string | null;
    contractValue: number;
    totalKm: number;
    costPerKm?: number | null;
    variableValue: number;
    variablePerKm?: number | null;
    allocatedValue: number;
    idleValue: number;
    hasConflict: boolean;
    status: VehicleRentalPeriodStatus;
    createdAt?: string;
}

// Despesas variáveis reais do mês (vehicles_monthly_expenses — Fase 2)
// Os campos de combustível (odômetro, litros e as 3 imagens) são
// preenchidos apenas pelo lançamento de combustível — ver
// dev/supabase/migrations/20261014_add_fuel_expense_fields.sql.
export interface VehicleMonthlyExpense {
    id: string;
    vehicleId: string;
    referenceMonth: string;
    costTypeId: string;
    costTypeCode?: string;
    costTypeDescription?: string;
    costTypeColor?: string;
    value: number;
    description?: string | null;
    odometer?: number | null;
    fuelQuantity?: number | null;
    plateImgPath?: string | null;
    plateImgName?: string | null;
    odometerImgPath?: string | null;
    odometerImgName?: string | null;
    invoiceImgPath?: string | null;
    invoiceImgName?: string | null;
    createdAt?: string;
    // Enriquecidos no histórico por usuário
    vehicleDescription?: string;
    vehiclePlates?: string;
}

export interface SaveVehicleMonthlyExpenseInput {
    id?: string;
    vehicleId: string;
    referenceMonth: string;
    costTypeId: string;
    value: number;
    description?: string | null;
    // Combustível (opcionais: presentes só no lançamento de combustível)
    odometer?: number | null;
    fuelQuantity?: number | null;
    plateImgPath?: string | null;
    plateImgName?: string | null;
    odometerImgPath?: string | null;
    odometerImgName?: string | null;
    invoiceImgPath?: string | null;
    invoiceImgName?: string | null;
    userId?: string;
    /** Data do abastecimento importado; grava-se em created_at para preservar o histórico. */
    createdAt?: string;
}

/** A imagem obrigatória do lançamento de combustível (comprovante) */
export interface FuelExpenseImages {
    invoice: File;
}

export interface FuelExpenseImageRefs {
    plateImgPath: string | null;
    plateImgName: string | null;
    odometerImgPath: string | null;
    odometerImgName: string | null;
    invoiceImgPath: string;
    invoiceImgName: string;
}

const num = (v: unknown): number => Number(v ?? 0);

/** '2026-09' ou '2026-09-15' => '2026-09-01' (dia 1 = competência) */
const monthStart = (month: string): string => `${month.slice(0, 7)}-01`;

const toContract = (row: any): VehicleRentalContract => ({
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    vehicleDescription: row.vehicle_description ?? undefined,
    vehiclePlates: row.vehicle_plates ?? undefined,
    monthlyValue: num(row.monthly_value),
    valueUnit: num(row.value_unit),
    startDate: row.start_date,
    endDate: row.end_date ?? null,
    active: !!row.active,
    description: row.description ?? null,
    createdAt: row.created_at
});

const toSummary = (row: any): VehicleRentalSummaryRow => ({
    periodId: row.period_id != null ? String(row.period_id) : null,
    periodStatus: row.period_status,
    vehicleId: String(row.vehicle_id),
    vehicleDescription: row.vehicle_description ?? undefined,
    vehiclePlates: row.vehicle_plates ?? undefined,
    contractId: row.contract_id != null ? String(row.contract_id) : null,
    contractValue: num(row.contract_value),
    hasConflict: !!row.has_conflict,
    totalKm: num(row.total_km),
    costPerKm: row.cost_per_km != null ? num(row.cost_per_km) : null,
    allocatedValue: num(row.allocated_value),
    idleValue: num(row.idle_value),
    utilization: row.utilization != null ? num(row.utilization) : null,
    variableValue: num(row.variable_value),
    variablePerKm: row.variable_per_km != null ? num(row.variable_per_km) : null,
    operationalValue: row.operational_value != null ? num(row.operational_value) : null,
    operationalPerKm: row.operational_per_km != null ? num(row.operational_per_km) : null
});

const toDetail = (row: any): VehicleRentalDetailRow => ({
    periodId: row.period_id != null ? String(row.period_id) : null,
    periodStatus: row.period_status,
    ovId: String(row.ov_id),
    ovvId: String(row.ovv_id),
    visitMask: row.visit_mask ?? undefined,
    km: num(row.km),
    rate: row.rate != null ? num(row.rate) : null,
    value: num(row.value),
    rentalValue: num(row.rental_value),
    variableValue: num(row.variable_value),
    rentalOvvId: row.rental_ovv_id != null ? String(row.rental_ovv_id) : null,
    variableOvvId: row.variable_ovv_id != null ? String(row.variable_ovv_id) : null,
    operationalValue: row.operational_value != null ? num(row.operational_value) : null
});

const toPeriod = (row: any): VehicleRentalPeriod => ({
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    referenceMonth: row.reference_month,
    contractId: row.contract_id != null ? String(row.contract_id) : null,
    contractValue: num(row.contract_value),
    totalKm: num(row.total_km),
    costPerKm: row.cost_per_km != null ? num(row.cost_per_km) : null,
    variableValue: num(row.variable_value),
    variablePerKm: row.variable_per_km != null ? num(row.variable_per_km) : null,
    allocatedValue: num(row.allocated_value),
    idleValue: num(row.idle_value),
    hasConflict: !!row.has_conflict,
    status: row.status,
    createdAt: row.created_at
});

const toExpense = (row: any): VehicleMonthlyExpense => ({
    id: String(row.id),
    vehicleId: String(row.vehicle_id),
    referenceMonth: row.reference_month,
    costTypeId: String(row.cost_type_id),
    costTypeCode: row.cfg_vehicles_costs_types?.code ?? undefined,
    costTypeDescription: row.cfg_vehicles_costs_types?.description ?? undefined,
    costTypeColor: row.cfg_vehicles_costs_types?.color ?? undefined,
    value: num(row.value),
    description: row.description ?? null,
    odometer: row.odometer != null ? num(row.odometer) : null,
    fuelQuantity: row.fuel_quantity != null ? num(row.fuel_quantity) : null,
    plateImgPath: row.plate_img_path ?? null,
    plateImgName: row.plate_img_name ?? null,
    odometerImgPath: row.odometer_img_path ?? null,
    odometerImgName: row.odometer_img_name ?? null,
    invoiceImgPath: row.invoice_img_path ?? null,
    invoiceImgName: row.invoice_img_name ?? null,
    createdAt: row.created_at
});

// RPC de escrita: devolve SETOF vehicles_rentals_periods (1 linha)
async function callPeriodRpc(
    fn: string,
    vehicleId: string,
    referenceMonth: string,
    userId?: string
): Promise<VehicleRentalPeriod> {
    const { data, error } = await supabase.rpc(fn, {
        p_vehicle_id: parseInt(vehicleId, 10),
        p_reference_month: referenceMonth,
        p_user_id: userId ? parseInt(userId, 10) : null
    });

    if (error) {
        console.error(`Error calling ${fn}:`, error);
        throw new Error(error.message || `Erro ao executar ${fn}.`);
    }

    const rows = (data as any[]) || [];
    if (!rows.length) {
        throw new Error(`A apuração não retornou dados (${fn}).`);
    }
    return toPeriod(rows[0]);
}

export const vehicleRentalService = {
    // -------------------------------------------------------------------------
    // CONTRATOS (cfg_vehicles_rentals_contracts)
    // -------------------------------------------------------------------------

    async getContracts(vehicleId?: string): Promise<VehicleRentalContract[]> {
        let query = supabase
            .from('cfg_vehicles_rentals_contracts')
            .select('*, vehicles!inner(description, plates)')
            .eq('is_deleted', false)
            .order('active', { ascending: false })
            .order('start_date', { ascending: false });
        if (vehicleId) {
            query = query.eq('vehicle_id', parseInt(vehicleId, 10));
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching rental contracts:', error);
            return [];
        }
        return (data || []).map((row: any) => ({
            ...toContract(row),
            vehicleDescription: row.vehicles?.description ?? undefined,
            vehiclePlates: row.vehicles?.plates ?? undefined
        }));
    },

    async saveContract(input: SaveVehicleRentalContractInput): Promise<VehicleRentalContract> {
        const payload: Record<string, unknown> = {
            vehicle_id: parseInt(input.vehicleId, 10),
            monthly_value: input.monthlyValue,
            value_unit: input.valueUnit,
            start_date: input.startDate,
            end_date: input.endDate || null,
            active: input.active !== false,
            description: input.description || null,
            updated_at: new Date().toISOString()
        };

        const query = input.id
            ? supabase.from('cfg_vehicles_rentals_contracts').update(payload).eq('id', parseInt(input.id, 10))
            : supabase.from('cfg_vehicles_rentals_contracts').insert({
                ...payload,
                created_at: new Date().toISOString()
            });

        const { data, error } = await query.select('*, vehicles!inner(description, plates)').single();
        if (error) {
            console.error('Error saving rental contract:', error);
            throw new Error(error.message || 'Erro ao salvar o contrato de aluguel.');
        }

        return {
            ...toContract(data),
            vehicleDescription: (data as any).vehicles?.description ?? undefined,
            vehiclePlates: (data as any).vehicles?.plates ?? undefined
        };
    },

    async deleteContract(contractId: string): Promise<void> {
        const { error } = await supabase
            .from('cfg_vehicles_rentals_contracts')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', parseInt(contractId, 10));
        if (error) {
            console.error('Error deleting rental contract:', error);
            throw new Error(error.message || 'Erro ao excluir o contrato de aluguel.');
        }
    },

    // -------------------------------------------------------------------------
    // DESPESAS VARIÁVEIS DO MÊS (vehicles_monthly_expenses — Fase 2)
    //    A tabela tem trigger de guarda: a escrita é bloqueada quando a
    //    competência está ALLOCATED/CLOSED (erro vira mensagem para o usuário).
    // -------------------------------------------------------------------------

    async getExpenses(vehicleId: string, referenceMonth: string): Promise<VehicleMonthlyExpense[]> {
        const { data, error } = await supabase
            .from('vehicles_monthly_expenses')
            .select('*, cfg_vehicles_costs_types!inner(code, description, color)')
            .eq('vehicle_id', parseInt(vehicleId, 10))
            .eq('reference_month', monthStart(referenceMonth))
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching monthly expenses:', error);
            return [];
        }
        return ((data as any[]) || []).map(toExpense);
    },

    async saveExpense(input: SaveVehicleMonthlyExpenseInput): Promise<VehicleMonthlyExpense> {
        const payload: Record<string, unknown> = {
            vehicle_id: parseInt(input.vehicleId, 10),
            reference_month: monthStart(input.referenceMonth),
            cost_type_id: parseInt(input.costTypeId, 10),
            value: input.value,
            description: input.description || null
        };

        // Campos de combustível: só entram quando informados (nunca
        // sobrescrevem com null lançamentos genéricos na edição).
        if (input.odometer != null) payload.odometer = input.odometer;
        if (input.fuelQuantity != null) payload.fuel_quantity = input.fuelQuantity;
        if (input.plateImgPath != null) {
            payload.plate_img_path = input.plateImgPath;
            payload.plate_img_name = input.plateImgName ?? null;
        }
        if (input.odometerImgPath != null) {
            payload.odometer_img_path = input.odometerImgPath;
            payload.odometer_img_name = input.odometerImgName ?? null;
        }
        if (input.invoiceImgPath != null) {
            payload.invoice_img_path = input.invoiceImgPath;
            payload.invoice_img_name = input.invoiceImgName ?? null;
        }

        const query = input.id
            ? supabase
                .from('vehicles_monthly_expenses')
                .update({
                    ...payload,
                    updated_user_id: input.userId ? parseInt(input.userId, 10) : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', parseInt(input.id, 10))
            : supabase.from('vehicles_monthly_expenses').insert({
                ...payload,
                created_user_id: input.userId ? parseInt(input.userId, 10) : null,
                created_at: input.createdAt ?? new Date().toISOString()
            });

        const { data, error } = await query
            .select('*, cfg_vehicles_costs_types!inner(code, description, color)')
            .single();

        if (error) {
            console.error('Error saving monthly expense:', error);
            throw new Error(error.message || 'Erro ao salvar a despesa do mês.');
        }
        return toExpense(data);
    },

    async deleteExpense(expenseId: string): Promise<void> {
        const { error } = await supabase
            .from('vehicles_monthly_expenses')
            .delete()
            .eq('id', parseInt(expenseId, 10));
        if (error) {
            console.error('Error deleting monthly expense:', error);
            throw new Error(error.message || 'Erro ao excluir a despesa do mês.');
        }
    },

    /**
     * Abastecimentos lançados por um usuário (histórico da aba
     * "Abastecimentos" do Meu Painel). Filtra pelo par odometer/litros
     * (só o lançamento de combustível os preenche) e traz veículo.
     */
    async getFuelExpensesByUser(userId: string): Promise<VehicleMonthlyExpense[]> {
        const { data, error } = await supabase
            .from('vehicles_monthly_expenses')
            .select('*, cfg_vehicles_costs_types!inner(code, description, color), vehicles!inner(description, plates)')
            .eq('created_user_id', parseInt(userId, 10))
            .not('odometer', 'is', null)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching fuel expenses by user:', error);
            return [];
        }
        return ((data as any[]) || []).map(row => ({
            ...toExpense(row),
            vehicleDescription: row.vehicles?.description ?? undefined,
            vehiclePlates: row.vehicles?.plates ?? undefined
        }));
    },


    // -------------------------------------------------------------------------
    // COMBUSTÍVEL (tela própria — 20261014_add_fuel_expense_fields.sql)
    // -------------------------------------------------------------------------

    /**
     * Base da validação de progressão do odômetro: maior recorder_end já
     * registrado em visitas técnicas (orders_visits_vehicles) do veículo.
     * null = veículo sem visita fechada → aceita qualquer valor.
     * `excludeVisitId` opcional ignora as linhas da visita atual (para não
     * bloquear correções de Km inicial contra o próprio fim já lançado).
     */
    async getMaxVehicleOdometer(vehicleId: string, excludeVisitId?: string): Promise<number | null> {
        let query = supabase
            .from('orders_visits_vehicles')
            .select('recorder_end')
            .eq('vehicle_id', parseInt(vehicleId, 10))
            .eq('is_deleted', false)
            .not('recorder_end', 'is', null)
            .gt('recorder_end', 0)
            .order('recorder_end', { ascending: false })
            .limit(1);
        if (excludeVisitId) {
            query = query.neq('ov_id', parseInt(excludeVisitId, 10));
        }
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching max vehicle odometer:', error);
            return null;
        }
        const row = ((data as any[]) || [])[0];
        return row?.recorder_end != null ? num(row.recorder_end) : null;
    },

    /**
     * Km final (recorder_end) do ÚLTIMO LANÇAMENTO anterior do mesmo veículo.
     *
     * Fonte: view `v_orders_visits_vehicles` (o `id` da view é o
     * `orders_visits_vehicles.id`; a view já exclui `is_deleted = true`).
     * `excludeRowId` = id do REGISTRO ATUAL — o próprio lançamento é ignorado,
     * de modo que a referência é o lançamento imediatamente anterior do mesmo
     * veículo (não o maior número já registrado).
     *
     * Diferente de `getMaxVehicleOdometer` (maior VALOR registrado, usado como
     * base de odômetro em abastecimentos): aqui vale o último lançamento.
     */
    async getPreviousVehicleOdometer(vehicleId: string, excludeRowId?: string): Promise<number | null> {
        let query = supabase
            .from('v_orders_visits_vehicles')
            .select('id, recorder_end')
            .eq('vehicle_id', parseInt(vehicleId, 10))
            .not('recorder_end', 'is', null)
            .gt('recorder_end', 0)
            // Último lançamento do veículo (id = orders_visits_vehicles.id)
            .order('id', { ascending: false })
            .limit(1);
        if (excludeRowId) {
            query = query.neq('id', parseInt(excludeRowId, 10));
        }
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching previous vehicle odometer:', error);
            return null;
        }
        const row = ((data as any[]) || [])[0];
        return row?.recorder_end != null ? num(row.recorder_end) : null;
    },

    /**
     * Sobe a imagem obrigatória do abastecimento (comprovante) no R2.
     * Falha ⇒ lança erro — a imagem é obrigatória.
     */
    async uploadFuelExpenseImages(
        vehicleId: string,
        companyId: string | undefined | null,
        images: FuelExpenseImages,
        onProgress?: (progress: number) => void
    ): Promise<FuelExpenseImageRefs> {
        const ts = Date.now();
        const rand = Math.random().toString(36).slice(2, 8);
        const folder = `companies/${companyId || 1}/vehicles/${vehicleId}/fuel`;
        const path = `${folder}/${ts}_${rand}_invoice.webp`;

        try {
            const res = await r2Service.uploadImageWithVariants(images.invoice, path, (p) => {
                onProgress?.(Math.round(p));
            });
            onProgress?.(100);
            return {
                plateImgPath: null,
                plateImgName: null,
                odometerImgPath: null,
                odometerImgName: null,
                invoiceImgPath: res.path,
                invoiceImgName: res.filename
            };
        } catch (error) {
            console.error('Error uploading fuel expense image:', error);
            throw new Error('Falha ao enviar o comprovante do abastecimento. Tente novamente.');
        }
    },

    // -------------------------------------------------------------------------
    // COMPETÊNCIAS (leitura)
    // -------------------------------------------------------------------------

    // Contrato vigente na competência (RPC — sinaliza conflito de vigência)
    async getContractInfo(vehicleId: string, referenceMonth: string): Promise<VehicleRentalContractInfo | null> {
        const { data, error } = await supabase.rpc('fc_vehicle_rental_contract', {
            p_vehicle_id: parseInt(vehicleId, 10),
            p_reference_month: referenceMonth
        });
        if (error) {
            console.error('Error fetching rental contract info:', error);
            return null;
        }
        const row = (data as any[])[0];
        if (!row) return null;
        return {
            contractId: String(row.contract_id),
            monthlyValue: num(row.monthly_value),
            hasConflict: !!row.has_conflict
        };
    },

    // Tabela da tela de Apuração (ao vivo quando o período ainda não existe)
    async getSummary(referenceMonth: string): Promise<VehicleRentalSummaryRow[]> {
        const { data, error } = await supabase.rpc('fc_vehicle_rental_summary', {
            p_reference_month: referenceMonth
        });
        if (error) {
            console.error('Error fetching rental summary:', error);
            return [];
        }
        return ((data as any[]) || []).map(toSummary);
    },

    // Detalhe visita a visita (SIMULAR)
    async getDetail(vehicleId: string, referenceMonth: string): Promise<VehicleRentalDetailRow[]> {
        const { data, error } = await supabase.rpc('fc_vehicle_rental_detail', {
            p_vehicle_id: parseInt(vehicleId, 10),
            p_reference_month: referenceMonth
        });
        if (error) {
            console.error('Error fetching rental detail:', error);
            return [];
        }
        return ((data as any[]) || []).map(toDetail);
    },

    async simulatePeriod(vehicleId: string, referenceMonth: string): Promise<VehicleRentalDetailRow[]> {
        return vehicleRentalService.getDetail(vehicleId, referenceMonth);
    },

    /**
     * Agregado das visitas da competência (do detalhe simulado/apurado):
     * contagem e soma de ov_total_value por ov_costs_status. Usado pelo modal
     * de confirmação de "Confirmar Apropriação".
     */
    async getCompetenceVisitsCostsSummary(vehicleId: string, referenceMonth: string): Promise<{
        totalVisits: number;
        byStatus: Record<string, { count: number; totalValue: number }>;
    }> {
        const result = { totalVisits: 0, byStatus: {} as Record<string, { count: number; totalValue: number }> };
        try {
            const detail = await vehicleRentalService.getDetail(vehicleId, referenceMonth);
            const ovIds = Array.from(new Set(detail.map(r => Number(r.ovId)).filter(id => Number.isFinite(id) && id > 0)));
            if (!ovIds.length) return result;

            const { data, error } = await supabase
                .from('orders_visits')
                .select('id, ov_costs_status, ov_total_value')
                .in('id', ovIds);
            if (error) {
                console.error('Error fetching competence visits costs summary:', error);
                return result;
            }

            for (const row of (data as any[]) || []) {
                const status = String(row.ov_costs_status || 'pending');
                if (!result.byStatus[status]) {
                    result.byStatus[status] = { count: 0, totalValue: 0 };
                }
                result.byStatus[status].count += 1;
                result.byStatus[status].totalValue += num(row.ov_total_value);
            }
            result.totalVisits = ovIds.length;
            return result;
        } catch (error) {
            console.error('Error computing competence visits costs summary:', error);
            return result;
        }
    },

    /**
     * Utilização do veículo na competência: linhas de odômetro com datas da
     * visita, Km inicial/fim e custo total. Mesma âncora de mês do RPC de
     * detalhe: COALESCE(ovv.created_at, ovs.ov_created_at).
     */
    async getUtilization(vehicleId: string, referenceMonth: string): Promise<VehicleUtilizationRow[]> {
        const month = monthStart(referenceMonth).slice(0, 7);
        const nextMonthDate = new Date(`${month}-01T00:00:00Z`);
        nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
        const nextMonth = nextMonthDate.toISOString().slice(0, 7);

        // Não filtrar created_at no SQL: o RPC usa COALESCE com a data da
        // visita — linhas com created_at nulo ficariam de fora do `.gte()`.
        const { data: ovvRows, error: ovvError } = await supabase
            .from('orders_visits_vehicles')
            .select('id, ov_id, recorder_start, recorder_end, amount, cost_type, created_at')
            .eq('vehicle_id', parseInt(vehicleId, 10))
            .eq('is_deleted', false)
            .in('cost_type', ['odometer', 'rate'])
            .gt('amount', 0)
            .order('id', { ascending: true });

        if (ovvError) {
            console.error('Error fetching utilization odometer lines:', ovvError);
            return [];
        }

        const ovIds = Array.from(new Set(((ovvRows as any[]) || []).map(r => Number(r.ov_id))));
        if (!ovIds.length) return [];

        const { data: visitRows, error: visitError } = await supabase
            .from('orders_visits')
            .select('id, ov_mask, ov_started_at, ov_ended_at, ov_created_at')
            .in('id', ovIds);

        if (visitError) {
            console.error('Error fetching utilization visits:', visitError);
            return [];
        }

        const visitsById: Record<string, any> = Object.fromEntries(
            ((visitRows as any[]) || []).map(v => [String(v.id), v])
        );

        const inMonth = (ts?: string | null): boolean => {
            if (!ts) return false;
            const ym = String(ts).slice(0, 7);
            return ym >= month && ym < nextMonth;
        };

        const lines = ((ovvRows as any[]) || []).filter(ovv => {
            const visit = visitsById[String(ovv.ov_id)];
            return inMonth(ovv.created_at) || inMonth(visit?.ov_created_at);
        });

        if (!lines.length) return [];

        const result = lines.map(ovv => {
            const visit = visitsById[String(ovv.ov_id)];
            const kmInitial = num(ovv.recorder_start);
            const kmFinal = num(ovv.recorder_end);
            const kmDiff = num(ovv.amount) || (kmFinal - kmInitial);

            return {
                ovId: String(ovv.ov_id),
                ovvId: String(ovv.id),
                visitMask: visit?.ov_mask ?? undefined,
                visitStartAt: visit?.ov_started_at ?? visit?.ov_created_at ?? ovv.created_at ?? null,
                visitEndAt: visit?.ov_ended_at ?? null,
                kmInitial,
                kmFinal,
                kmDiff
            } satisfies VehicleUtilizationRow;
        });

        // Ordena de forma crescente por data de início (com fallback para kmInitial / ovId)
        return result.sort((a, b) => {
            const timeA = a.visitStartAt ? new Date(a.visitStartAt).getTime() : 0;
            const timeB = b.visitStartAt ? new Date(b.visitStartAt).getTime() : 0;
            if (timeA !== timeB) return timeA - timeB;
            if (a.kmInitial !== b.kmInitial) return a.kmInitial - b.kmInitial;
            return Number(a.ovId) - Number(b.ovId);
        });
    },

    /**
     * Calcula a soma de 'buracos' de odômetro (gaps entre o fim de uma visita e o início da próxima)
     * para cada veículo na competência informada. Retorna um mapa { [vehicleId]: kmGaps }.
     */
    async getMonthOdometerGaps(referenceMonth: string): Promise<Record<string, number>> {
        const month = monthStart(referenceMonth).slice(0, 7);
        const nextMonthDate = new Date(`${month}-01T00:00:00Z`);
        nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
        const nextMonth = nextMonthDate.toISOString().slice(0, 7);

        const { data, error } = await supabase
            .from('orders_visits_vehicles')
            .select('vehicle_id, recorder_start, recorder_end, created_at, id')
            .eq('is_deleted', false)
            .in('cost_type', ['odometer', 'rate'])
            .gt('amount', 0)
            .gte('created_at', `${month}-01T00:00:00Z`)
            .lt('created_at', `${nextMonth}-01T00:00:00Z`)
            .order('recorder_start', { ascending: true });

        if (error || !data) {
            console.error('Error fetching month odometer gaps:', error);
            return {};
        }

        const byVehicle: Record<string, { start: number; end: number }[]> = {};
        for (const r of (data as any[])) {
            const vid = String(r.vehicle_id);
            if (!byVehicle[vid]) byVehicle[vid] = [];
            const start = Number(r.recorder_start) || 0;
            const end = Number(r.recorder_end) || 0;
            if (start > 0 && end > 0) {
                byVehicle[vid].push({ start, end });
            }
        }

        const gaps: Record<string, number> = {};
        for (const [vid, lines] of Object.entries(byVehicle)) {
            lines.sort((a, b) => a.start - b.start);
            let totalGap = 0;
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].start > lines[i - 1].end) {
                    totalGap += (lines[i].start - lines[i - 1].end);
                }
            }
            if (totalGap > 0) {
                gaps[vid] = totalGap;
            }
        }
        return gaps;
    },

    // Períodos gravados (fonte da verdade pós-cálculo)
    async getPeriods(referenceMonth: string): Promise<VehicleRentalPeriod[]> {
        const { data, error } = await supabase
            .from('vehicles_rentals_periods')
            .select('*')
            .eq('reference_month', monthStart(referenceMonth))
            .order('vehicle_id');
        if (error) {
            console.error('Error fetching rental periods:', error);
            return [];
        }
        return ((data as any[]) || []).map(toPeriod);
    },

    // -------------------------------------------------------------------------
    // APURAÇÃO (RPCs de escrita)
    // -------------------------------------------------------------------------

    async calculatePeriod(vehicleId: string, referenceMonth: string, userId?: string): Promise<VehicleRentalPeriod> {
        return callPeriodRpc('fc_vehicle_rental_calculate', vehicleId, referenceMonth, userId);
    },

    async allocatePeriod(vehicleId: string, referenceMonth: string, userId?: string): Promise<VehicleRentalPeriod> {
        return callPeriodRpc('fc_vehicle_rental_allocate', vehicleId, referenceMonth, userId);
    },

    async closePeriod(vehicleId: string, referenceMonth: string, userId?: string): Promise<VehicleRentalPeriod> {
        return callPeriodRpc('fc_vehicle_rental_close', vehicleId, referenceMonth, userId);
    },

    async reopenPeriod(vehicleId: string, referenceMonth: string, userId?: string): Promise<VehicleRentalPeriod> {
        return callPeriodRpc('fc_vehicle_rental_reopen', vehicleId, referenceMonth, userId);
    },

    async revertPeriod(vehicleId: string, referenceMonth: string, userId?: string): Promise<VehicleRentalPeriod> {
        return callPeriodRpc('fc_vehicle_rental_revert', vehicleId, referenceMonth, userId);
    }
};

export default vehicleRentalService;
