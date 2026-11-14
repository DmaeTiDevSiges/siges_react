import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import type { AssetAlert, OrderVisitAssetView } from '../types';

/**
 * Alertas do ativo no relatório da visita (OrderVisitAssetReport): carrega os
 * visíveis, marca/desmarca como concluídos NESTE ativo (com desfazer se a
 * gravação falhar), conclui o que ficou pendente ao reportar e atualiza a lista
 * depois de criar um alerta novo.
 *
 * Visível = não apagado e (em aberto ou concluído por este ativo da visita).
 */
const isVisible = (alert: AssetAlert, ovaId: string | undefined) =>
    !alert.isDeleted && (!alert.isDone || alert.ovaId === ovaId);

export const useReportAlerts = (asset: OrderVisitAssetView | null, currentUserId: string) => {
    const [alerts, setAlerts] = useState<AssetAlert[]>([]);
    const [completedAlertIds, setCompletedAlertIds] = useState<string[]>([]);
    const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);
    /** Janela de "novo alerta" aberta, e o texto inicial (vem da checklist). */
    const [isAddingAlert, setIsAddingAlert] = useState(false);
    const [alertInitialDescription, setAlertInitialDescription] = useState('');

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!asset?.assetId) {
                setAlerts([]);
                setCompletedAlertIds([]);
                return;
            }
            try {
                const ovaId = asset.id;
                const all = await dataService.getAssetAlerts(asset.assetId);
                const visible = all.filter(a => isVisible(a, ovaId));
                if (!isMounted) return;
                setAlerts(visible);
                setCompletedAlertIds(visible.filter(a => a.isDone && a.ovaId === ovaId).map(a => a.id));
            } catch (error) {
                console.error('Error loading asset alerts:', error);
                if (isMounted) {
                    setAlerts([]);
                    setCompletedAlertIds([]);
                }
            }
        };
        load();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [asset?.assetId]);

    /** Marca/desmarca na tela na hora e grava; se falhar, desfaz. */
    const toggleCompletedAlert = async (alertId: string) => {
        if (!asset?.id) return;
        const alert = alerts.find(item => item.id === alertId);
        if (!alert) return;
        const shouldComplete = !completedAlertIds.includes(alertId);
        const apply = (complete: boolean) => {
            setCompletedAlertIds(prev => complete ? [...prev, alertId] : prev.filter(id => id !== alertId));
            setAlerts(prev => prev.map(item =>
                item.id === alertId ? { ...item, isDone: complete, ovaId: complete ? asset.id : null } : item
            ));
        };

        apply(shouldComplete);
        try {
            setUpdatingAlertId(alertId);
            await dataService.updateAssetAlert(alertId, {
                isDone: shouldComplete,
                updatedUserId: currentUserId,
                ovaId: shouldComplete ? asset.id : null
            });
        } catch (error) {
            console.error('Error updating alert status:', error);
            toast.error('Erro ao atualizar status do alerta.');
            apply(!shouldComplete);
        } finally {
            setUpdatingAlertId(null);
        }
    };

    /** Grava o que difere do banco (ao reportar); some da lista o que não foi marcado. */
    const completeSelectedAlerts = async () => {
        const ovaId = asset?.id;
        const updates = alerts
            .filter(alert => completedAlertIds.includes(alert.id) !== (alert.isDone && alert.ovaId === ovaId))
            .map(alert => {
                const shouldComplete = completedAlertIds.includes(alert.id);
                return dataService.updateAssetAlert(alert.id, {
                    isDone: shouldComplete,
                    updatedUserId: currentUserId,
                    ovaId: shouldComplete ? ovaId : null
                });
            });
        if (updates.length === 0) return;
        await Promise.all(updates);
        setAlerts(prev => prev.filter(alert => completedAlertIds.includes(alert.id)));
    };

    /** Depois de criar um alerta: fecha a janela e recarrega a lista. */
    const refreshAlerts = async () => {
        if (!asset?.assetId) return;
        setIsAddingAlert(false);
        const all = await dataService.getAssetAlerts(asset.assetId);
        setAlerts(all.filter(a => isVisible(a, asset.id)));
    };

    return {
        alerts, completedAlertIds, updatingAlertId,
        isAddingAlert, setIsAddingAlert, alertInitialDescription, setAlertInitialDescription,
        toggleCompletedAlert, completeSelectedAlerts, refreshAlerts,
    };
};
