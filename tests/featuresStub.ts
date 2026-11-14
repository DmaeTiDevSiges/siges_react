// Substitui features.ts nos testes de UI (usa import.meta.env do Vite, que o Jest não entende).
// Tudo desligado; um teste que precise de uma flag ligada usa jest.mock('<caminho>/features', ...).
export const isFinancialApprovalEnabled = () => false;
export const isVehicleRentalEnabled = () => false;
export const isMultiClientUnitsEnabled = () => false;
export const isOfflineModeEnabled = () => false;
export const isOfflineFieldCardEnabled = () => false;
export const isUiV2Available = () => false;
export type VisitCostsStatus = 'pending' | 'waiting' | 'approved' | 'rejected';
export const VISIT_COSTS_STATUS_CONFIG = {} as Record<VisitCostsStatus, any>;
