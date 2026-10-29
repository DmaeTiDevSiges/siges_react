import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { unitEditScopeAllows, UnitClientIdInput } from '../utils/unitEditScope';

/**
 * Cache por departamento — `cfg_departments.clients_ids` muda raramente.
 * Evita refazer a query a cada tela montada.
 */
const departmentClientsCache = new Map<string, string[]>();

/** Referência estável para "sem escopo" (evita re-render/loop nas deps). */
const EMPTY_CLIENT_IDS: string[] = [];

interface UseClientScopeReturn {
    /**
     * `cfg_departments.clients_ids` do departamento do usuário logado.
     * Lista vazia = sem escopo (sem acesso aos módulos escopados).
     */
    clientIds: string[];
    /**
     * Super admin. Continua isentando o escopo em EDIÇÃO de unidades
     * (`unitEditScopeAllows`/`unitScopeQueryIds`), mas o filtro SISTEMA usa
     * `clientIds` normalmente — inclusive para ele (decisão de 27/10/2026).
     */
    isAdminSuper: boolean;
    /**
     * Escopo resolvido: autenticação carregada E (sem departamento OU
     * `clients_ids` do departamento atual já obtidos).
     */
    scopeReady: boolean;
    /** A unidade está no escopo de cliente do usuário? */
    inScope: (unitClientsIds: readonly UnitClientIdInput[] | null | undefined) => boolean;
}

/**
 * Escopo de cliente do usuário logado (Fase 1D do plano de escopos por cliente).
 *
 * Fonte: `users.department_id` -> `cfg_departments.clients_ids`.
 * Requer AuthProvider.
 */
export const useClientScope = (): UseClientScopeReturn => {
    const { currentUser, loading: authLoading } = useAuth();

    const isAdminSuper = currentUser?.isAdminSuper === true;
    const departmentId = currentUser?.departmentId;

    // `null` = ainda não resolvido; objeto guarda o departamento ao qual pertence
    // para nunca aplicar ids de outro departamento durante uma troca.
    const [scopeState, setScopeState] = useState<{ departmentId: string; clientIds: string[] } | null>(null);

    useEffect(() => {
        let active = true;

        if (authLoading || !departmentId) {
            // Auth carregando / sem departamento: sem consulta.
            // (Super admin COM departamento também consulta: o escopo de
            // clientes vale para todos os perfis no filtro SISTEMA.)
            setScopeState(null);
            return () => { active = false; };
        }

        const cached = departmentClientsCache.get(departmentId);
        if (cached) {
            setScopeState({ departmentId, clientIds: cached });
            return () => { active = false; };
        }

        setScopeState(null); // recarregando — consumidores esperam scopeReady

        dataService.getDepartmentClientsIds(departmentId)
            .then((ids) => {
                departmentClientsCache.set(departmentId, ids);
                if (active) setScopeState({ departmentId, clientIds: ids });
            })
            .catch((error) => {
                console.error('Error loading department clients_ids:', error);
                // Sem escopo confirmado = sem acesso.
                if (active) setScopeState({ departmentId, clientIds: EMPTY_CLIENT_IDS });
            });

        return () => { active = false; };
    }, [authLoading, isAdminSuper, departmentId]);

    const resolved = scopeState && scopeState.departmentId === departmentId ? scopeState : null;
    const clientIds = resolved?.clientIds ?? EMPTY_CLIENT_IDS;

    const scopeReady =
        !authLoading && (!departmentId || resolved !== null);

    const inScope = (unitClientsIds: readonly UnitClientIdInput[] | null | undefined): boolean =>
        unitEditScopeAllows(isAdminSuper, clientIds, unitClientsIds);

    return {
        clientIds,
        isAdminSuper,
        scopeReady,
        inScope,
    };
};
