import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import { getOfflineStore, isOfflineSupported, isOnline } from '../services/offline/offlineConfig';
import { getFieldPackage } from '../services/offline/fieldPackageService';
import { deleteLockToken, getLockToken, saveLockToken } from '../services/offline/offlineLocks';
import { OFFLINE_COLLECTIONS } from '../services/offline/store/offlineStore';
import { isTmpId } from '../services/offline/offlineFlowOps';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Trava do relatório do ativo (F1 1.6 / F2 — decisão de 08/11/2026).
 *
 * COM internet, relatório editável (rascunho/rejeitado):
 *   - técnico da EQUIPE da visita → tenta travar para si (guarda o token, que
 *     o envio da fila confere). Se outro já tem → só leitura, "Em uso por Fulano".
 *   - quem não é da equipe (gestor revisando) → não trava; só mostra o aviso.
 * SEM internet (opção (a), decisão de 09/11/2026 — o preparo é automático e
 * não reserva ativos):
 *   - ativo travado por ele (token guardado) → edita;
 *   - os demais também editam; a fila trava no envio e, se outro técnico
 *     tiver a trava, a alteração vira "recusada" (conflito) para resolver.
 * Gestor do contrato/admin pode forçar a liberação (online).
 * Sem a migration 20261117 aplicada → status 'off' e nada muda.
 */
export type AssetLockStatus = 'off' | 'checking' | 'mine' | 'other' | 'free' | 'not-reserved';

export interface AssetLockState {
    status: AssetLockStatus;
    userName?: string;
}

interface UseAssetLockInput {
    ovaId?: string;
    ovId?: string;
    currentUserId?: string;
    /** Relatório editável (processing 1/4, não readOnly). */
    editable: boolean;
}

export const useAssetLock = ({ ovaId, ovId, currentUserId, editable }: UseAssetLockInput) => {
    const [lock, setLock] = useState<AssetLockState>({ status: 'off' });
    const { isConnected } = useNetworkStatus();

    const check = useCallback(async () => {
        if (!ovaId || !ovId || !currentUserId || !editable || !isOfflineSupported()) {
            setLock({ status: 'off' });
            return;
        }

        // Ativo incluído sem internet: ainda não existe no servidor — é do técnico.
        if (isTmpId(String(ovaId))) {
            setLock({ status: 'mine' });
            return;
        }

        if (!isOnline()) {
            setLock({ status: (await getLockToken(String(ovaId))) ? 'mine' : 'off' });
            return;
        }

        setLock(prev => ({ ...prev, status: prev.status === 'off' ? 'checking' : prev.status }));
        try {
            const team = await dataService.getOrderVisitTeam(String(ovId));
            const isTeamMember = team.some(m => String(m.userId) === String(currentUserId));

            if (isTeamMember) {
                const res = await dataService.lockOrderVisitAsset(String(ovaId));
                if (!res.supported) return setLock({ status: 'off' });
                if (res.locked) {
                    await saveLockToken(String(ovaId), res.lockToken);
                    setLock({ status: 'mine' });
                } else {
                    setLock({ status: 'other', userName: res.lockedUserName });
                }
                return;
            }

            const info = await dataService.getOrderVisitAssetsLocks(String(ovId));
            if (!info.supported) return setLock({ status: 'off' });
            const holder = info.locks[String(ovaId)];
            setLock(holder ? { status: 'other', userName: holder.userName } : { status: 'free' });
        } catch (e) {
            // Falha na trava não pode impedir o trabalho online.
            console.warn('[useAssetLock] não foi possível verificar a trava:', e);
            setLock({ status: 'off' });
        }
    }, [ovaId, ovId, currentUserId, editable]);

    useEffect(() => {
        check();
    }, [check, isConnected]);

    /** Gestor/admin: libera a trava de outro técnico. */
    const forceRelease = useCallback(async () => {
        if (!ovaId) return;
        try {
            await dataService.unlockOrderVisitAsset(String(ovaId), true);
            toast.success('Ativo liberado.');
            await check();
        } catch (e: any) {
            toast.error(e?.message || 'Erro ao liberar o ativo');
        }
    }, [ovaId, check]);

    /** Depois de relatar: solta a própria trava e tira o ativo do pacote. */
    const releaseMine = useCallback(async () => {
        if (!ovaId || lock.status !== 'mine') return;
        // Sem internet, o "Relatar" foi para a fila; a trava é solta quando ele subir.
        // Ativo incluído offline: não tem trava no servidor.
        if (!isOnline() || isTmpId(String(ovaId))) return;
        try {
            await dataService.unlockOrderVisitAsset(String(ovaId), false);
            await deleteLockToken(String(ovaId));
            if (ovId) {
                const pkg = await getFieldPackage(String(ovId));
                if (pkg && pkg.lockedOvaIds.includes(String(ovaId))) {
                    await getOfflineStore().put(OFFLINE_COLLECTIONS.package, String(ovId), {
                        ...pkg,
                        lockedOvaIds: pkg.lockedOvaIds.filter(id => id !== String(ovaId)),
                    });
                }
            }
            setLock({ status: 'free' });
        } catch (e) {
            console.warn('[useAssetLock] não foi possível soltar a trava:', e);
        }
    }, [ovaId, ovId, lock.status]);

    return { lock, forceRelease, releaseMine, refreshLock: check };
};
