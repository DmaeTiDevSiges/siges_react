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
 * Verifica se o Rateio de Aluguel Veicular (Apuração mensal) está habilitado
 *
 * Para ativar: VITE_FEATURE_VEHICLE_RENTAL=true
 * Para desativar: VITE_FEATURE_VEHICLE_RENTAL=false (ou não definir)
 *
 * Pré-requisito: migration 20261008_create_vehicle_rental_rateio.sql aplicada.
 */
export const isVehicleRentalEnabled = (): boolean => {
  return import.meta.env.VITE_FEATURE_VEHICLE_RENTAL === 'true';
};

/**
 * Verifica se a escrita multi-cliente em unidades está habilitada.
 *
 * Fase 1B: desligada (false). O app novo escreve somente clients_ids com 1 cliente.
 * Fase 1D: pode ser habilitada para Admin/Super Admin após o Gate 4.
 *
 * Para ativar: VITE_FEATURE_MULTI_CLIENT_UNITS=true
 * Para desativar: VITE_FEATURE_MULTI_CLIENT_UNITS=false (ou não definir)
 */
export const isMultiClientUnitsEnabled = (): boolean => {
  return import.meta.env.VITE_FEATURE_MULTI_CLIENT_UNITS === 'true';
};

/**
 * Verifica se o modo offline do técnico está habilitado
 * (relatório do ativo e da visita sem internet — docs/OFFLINE_MODO_CAMPO.md).
 *
 * Para ativar: VITE_FEATURE_OFFLINE_MODE=true
 * Para desativar: VITE_FEATURE_OFFLINE_MODE=false (ou não definir)
 *
 * Lido no build (Vite embute o valor): mudar exige novo APK.
 * Desligada, bloqueia apenas gravações NOVAS offline — a fila que já estiver
 * no aparelho continua sendo sincronizada até esvaziar (nunca descartar).
 *
 * Pré-requisito: migrations 20261116_add_offline_client_uuid.sql,
 * 20261117_add_orders_visits_assets_lock.sql e
 * 20261118_create_flow_order_visit_close_v4.sql aplicadas.
 */
export const isOfflineModeEnabled = (): boolean => {
  return import.meta.env.VITE_FEATURE_OFFLINE_MODE === 'true';
};

/**
 * Mostra o cartão "Modo campo" na aba inicial da visita (preparar/atualizar o
 * pacote offline, aviso de sem internet, resumo da fila).
 *
 * Escondido por padrão (decisão de 10/11/2026): o download offline é automático e
 * a faixa do cabeçalho (ConnectionStrip) + a tela de pendências já mostram o
 * estado da conexão e da fila. Para voltar a mostrar:
 *
 * Para ativar: VITE_FEATURE_OFFLINE_FIELD_CARD=true
 * Para desativar: VITE_FEATURE_OFFLINE_FIELD_CARD=false (ou não definir)
 *
 * Lido no build: mudar exige novo APK.
 */
export const isOfflineFieldCardEnabled = (): boolean => {
  return import.meta.env.VITE_FEATURE_OFFLINE_FIELD_CARD === 'true';
};

/**
 * Status possíveis para aprovação financeira de visitas
 */
export type VisitCostsStatus = 'pending' | 'waiting' | 'approved' | 'rejected';

/**
 * Configuração dos status de aprovação financeira
 */
export const VISIT_COSTS_STATUS_CONFIG: Record<VisitCostsStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: 'Aguardando',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  waiting: {
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

/**
 * Visual novo (redesign inspirado em apps de banco digital) — beta.
 *
 * Com a flag ligada, aparece no Perfil a chave "Visual novo (beta)" (preferência por usuário,
 * padrão desligado). Com a flag desligada, ninguém vê nada novo — o app fica no visual atual.
 * Plano: docs/PLANO_DESIGN_ESTILO_NUBANK.md (seção 5.1).
 *
 * Para ativar: VITE_FEATURE_UI_V2=true
 * Para desativar: VITE_FEATURE_UI_V2=false (ou não definir)
 */
export const isUiV2Available = (): boolean => {
  return import.meta.env.VITE_FEATURE_UI_V2 === 'true';
};
