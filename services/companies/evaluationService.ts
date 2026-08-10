import { supabase } from '../supabase';
import type { EvaluationRequirement, ContractEvaluationRequirement, OrderVisitEvaluation } from '../../types';

const BRAZIL_TZ = 'America/Sao_Paulo';

function brazilNow(): string {
    return new Date().toLocaleString('sv-SE', { timeZone: BRAZIL_TZ }).replace(' ', 'T');
}

export const evaluationService = {

    // -------------------------------------------------------------------------
    // CFG_EVALUATION_REQUIREMENTS (Requisitos Gerais)
    // -------------------------------------------------------------------------

    async getEvaluationRequirements(): Promise<EvaluationRequirement[]> {
        const { data, error } = await supabase
            .from('cfg_evaluation_requirements')
            .select('*')
            .eq('is_deleted', false)
            .order('description');

        if (error) {
            console.error('Error fetching evaluation requirements:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            description: row.description,
            code: row.code,
            isAvailable: row.is_available,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    async createEvaluationRequirement(data: { description: string; code?: string }): Promise<EvaluationRequirement | null> {
        const { data: result, error } = await supabase
            .from('cfg_evaluation_requirements')
            .insert({
                description: data.description,
                code: data.code || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating evaluation requirement:', error);
            return null;
        }

        return {
            id: result.id.toString(),
            description: result.description,
            code: result.code,
            isAvailable: result.is_available,
        };
    },

    async updateEvaluationRequirement(id: string, data: { description?: string; code?: string; isAvailable?: boolean }): Promise<boolean> {
        const { error } = await supabase
            .from('cfg_evaluation_requirements')
            .update({
                ...(data.description !== undefined && { description: data.description }),
                ...(data.code !== undefined && { code: data.code }),
                ...(data.isAvailable !== undefined && { is_available: data.isAvailable }),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating evaluation requirement:', error);
            return false;
        }

        return true;
    },

    async deleteEvaluationRequirement(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('cfg_evaluation_requirements')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error deleting evaluation requirement:', error);
            return false;
        }

        return true;
    },

    // -------------------------------------------------------------------------
    // CONTRACTS_EVALUATION_REQUIREMENTS (Vinculação Contrato × Requisito)
    // -------------------------------------------------------------------------

    async getContractEvaluationRequirements(contractId: string): Promise<ContractEvaluationRequirement[]> {
        const { data, error } = await supabase
            .from('v_contracts_evaluation_requirements')
            .select('*')
            .eq('contract_id', contractId)
            .eq('is_available', true)
            .order('evaluation_description');

        if (error) {
            console.error('Error fetching contract evaluation requirements:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            contractId: row.contract_id.toString(),
            evaluationId: row.evaluation_id.toString(),
            weight: row.weight,
            isAvailable: row.is_available,
            evaluationDescription: row.evaluation_description,
            evaluationCode: row.evaluation_code,
        }));
    },

    async addEvaluationToContract(contractId: string, evaluationId: string, weight: number): Promise<ContractEvaluationRequirement | null> {
        const { data: result, error } = await supabase
            .from('contracts_evaluation_requirements')
            .insert({
                contract_id: contractId,
                evaluation_id: evaluationId,
                weight: weight,
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding evaluation to contract:', error);
            return null;
        }

        return {
            id: result.id.toString(),
            contractId: result.contract_id.toString(),
            evaluationId: result.evaluation_id.toString(),
            weight: result.weight,
            isAvailable: result.is_available,
        };
    },

    async updateContractEvaluationWeight(id: string, weight: number): Promise<boolean> {
        const { error } = await supabase
            .from('contracts_evaluation_requirements')
            .update({ weight })
            .eq('id', id);

        if (error) {
            console.error('Error updating contract evaluation weight:', error);
            return false;
        }

        return true;
    },

    async removeEvaluationFromContract(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('contracts_evaluation_requirements')
            .update({ is_deleted: true })
            .eq('id', id);

        if (error) {
            console.error('Error removing evaluation from contract:', error);
            return false;
        }

        return true;
    },

    // -------------------------------------------------------------------------
    // ORDERS_VISITS_EVALUATIONS (Avaliação da Visita)
    // -------------------------------------------------------------------------

    async getVisitEvaluations(ovId: string): Promise<OrderVisitEvaluation[]> {
        const { data, error } = await supabase
            .from('v_orders_visits_evaluations')
            .select('*')
            .eq('ov_id', ovId)
            .order('evaluated_at', { ascending: false });

        if (error) {
            console.error('Error fetching visit evaluations:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id.toString(),
            ovId: row.ov_id.toString(),
            contractEvaluationId: row.contract_evaluation_id.toString(),
            wasApplied: row.was_applied,
            notes: row.notes,
            evaluatedByUserId: row.evaluated_by_user_id.toString(),
            evaluatedAt: row.evaluated_at,
            createdAt: row.created_at,
            requirementDescription: row.requirement_description,
            requirementCode: row.requirement_code,
            weight: row.weight,
            evaluatorName: row.evaluator_name,
            contractId: row.contract_id?.toString(),
        }));
    },

    async saveVisitEvaluations(ovId: string, evaluations: { contractEvaluationId: string; wasApplied: boolean; notes?: string }[], userId: string): Promise<boolean> {
        // Deleta avaliações anteriores desta visita para evitar duplicatas
        const { error: deleteError } = await supabase
            .from('orders_visits_evaluations')
            .delete()
            .eq('ov_id', ovId);

        if (deleteError) {
            console.error('Error deleting previous evaluations:', deleteError);
            return false;
        }

        // Insere as novas avaliações
        const now = brazilNow();
        const evaluationsToInsert = evaluations.map(ev => ({
            ov_id: ovId,
            contract_evaluation_id: ev.contractEvaluationId,
            was_applied: ev.wasApplied,
            notes: ev.notes || null,
            evaluated_by_user_id: userId,
            evaluated_at: now,
            created_at: now,
        }));

        const { error: insertError } = await supabase
            .from('orders_visits_evaluations')
            .insert(evaluationsToInsert);

        if (insertError) {
            console.error('Error saving visit evaluations:', insertError);
            return false;
        }

        return true;
    },

    async getVisitTotalScore(ovId: string): Promise<number> {
        const evaluations = await this.getVisitEvaluations(ovId);

        let totalScore = 0;
        for (const evaluation of evaluations) {
            if (evaluation.wasApplied && evaluation.weight) {
                totalScore += evaluation.weight;
            }
        }

        return totalScore;
    },

    async deleteVisitEvaluations(ovId: string): Promise<boolean> {
        const { error } = await supabase
            .from('orders_visits_evaluations')
            .delete()
            .eq('ov_id', ovId);

        if (error) {
            console.error('Error deleting visit evaluations:', error);
            return false;
        }

        return true;
    },
};
