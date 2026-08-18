/**
 * Feature Flags do SIGES
 * 
 * Para ativar/desativar funcionalidades em desenvolvimento/produção,
 * altere as variáveis de ambiente correspondentes.
 */

/**
 * Verifica se a funcionalidade de Aprovação Financeira de Visitas está habilitada
 * 
 * Para ativar: VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL=true
 * Para desativar: VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL=false (ou não definir)
 */
export const isFinancialApprovalEnabled = (): boolean => {
  return import.meta.env.VITE_FEATURE_ORDER_VISIT_FINANCIAL_APPROVAL === 'true';
};

/**
 * Status possíveis para aprovação financeira de visitas
 */
export type VisitCostsStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

/**
 * Configuração dos status de aprovação financeira
 */
export const VISIT_COSTS_STATUS_CONFIG: Record<VisitCostsStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: 'Aguardando Custos',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  submitted: {
    label: 'Custos Enviados',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  approved: {
    label: 'Financeiro Aprovado',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  rejected: {
    label: 'Custos Rejeitados',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
};
