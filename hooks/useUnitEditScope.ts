import { usePermissions } from '../contexts/PermissionsContext';
import { useClientScope } from './useClientScope';
import { unitEditScopeAllows, UnitClientIdInput } from '../utils/unitEditScope';

interface UseUnitEditScopeReturn {
    /**
     * Pode editar a unidade? (permissão `canEdit('units')` + escopo de cliente)
     * Enquanto o escopo não carrega, devolve false (não exibe botão sem confirmação).
     */
    canEditUnit: (unitClientsIds: readonly UnitClientIdInput[] | null | undefined) => boolean;
    /**
     * Pode excluir a unidade? (permissão `canDelete('units')` + escopo de cliente)
     */
    canDeleteUnit: (unitClientsIds: readonly UnitClientIdInput[] | null | undefined) => boolean;
    /** `clients_ids` do departamento do usuário já carregados */
    scopeReady: boolean;
}

/**
 * Escopo de cliente para gerenciar unidades.
 *
 * Regra (Fase 1D do plano de escopos por cliente):
 *   `canX('units')` da rota E (`isAdminSuper` OU interseção entre os
 *   `cfg_departments.clients_ids` do departamento do usuário logado e os
 *   `units.clients_ids` da unidade alvo).
 *
 * Requer AuthProvider + PermissionsProvider.
 */
export const useUnitEditScope = (): UseUnitEditScopeReturn => {
    const { canEdit, canDelete } = usePermissions();
    const { clientIds, isAdminSuper, scopeReady } = useClientScope();

    const canEditUnit = (unitClientsIds: readonly UnitClientIdInput[] | null | undefined): boolean =>
        canEdit('units') && unitEditScopeAllows(isAdminSuper, clientIds, unitClientsIds);

    const canDeleteUnit = (unitClientsIds: readonly UnitClientIdInput[] | null | undefined): boolean =>
        canDelete('units') && unitEditScopeAllows(isAdminSuper, clientIds, unitClientsIds);

    return {
        canEditUnit,
        canDeleteUnit,
        scopeReady,
    };
};
