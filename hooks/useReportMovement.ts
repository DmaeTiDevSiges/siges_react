import { useState } from 'react';
import { toast } from 'sonner';
import { isMovementComplete as destinationIsComplete } from '../utils/assetReportRules';
import type { UnitAssetTagOption } from '../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportMovementSection';
import type { OrderVisitAssetView } from '../types';

/**
 * Movimentação do ativo no relatório (OrderVisitAssetReport): marcar "movido",
 * escolher o destino (cliente → unidade → setor, situação, prioridade, local,
 * observação) e desligar descartando o destino. Ligar pré-preenche o destino
 * com a origem; trocar cliente/unidade zera o que depende deles. Cada mudança
 * grava pelo autosave (`saveNow`). As regras (completa, igual à origem) ficam em
 * utils/assetReportRules.
 */
export const useReportMovement = (
    asset: OrderVisitAssetView | null,
    initialAsset: OrderVisitAssetView | undefined,
    saveNow: (updates: Record<string, unknown>) => Promise<void> | void,
) => {
    /** Confirmação de "desligar movimentação". */
    const [showUnmoveConfirmModal, setShowUnmoveConfirmModal] = useState(false);
    const [isMoved, setIsMoved] = useState(initialAsset?.isMoved || false);
    const [afterClientId, setAfterClientId] = useState('');
    const [afterUnitId, setAfterUnitId] = useState('');
    const [afterUnitAssetTagId, setAfterUnitAssetTagId] = useState('');
    const [afterStatusId, setAfterStatusId] = useState('');
    const [afterPriorityId, setAfterPriorityId] = useState<number | undefined>(undefined);
    const [afterLocation, setAfterLocation] = useState('');
    const [movedComments, setMovedComments] = useState(initialAsset?.movedComments || '');

    const clearMovement = async () => {
        setShowUnmoveConfirmModal(false);
        setIsMoved(false);
        setAfterClientId('');
        setAfterUnitId('');
        setAfterUnitAssetTagId('');
        setAfterStatusId('');
        setAfterPriorityId(undefined);
        setAfterLocation('');
        setMovedComments('');
        await saveNow({
            is_moved: false,
            after_client_id: null,
            after_unit_id: null,
            after_unit_asset_tag_id: null,
            after_tag_id: null,
            after_tag_sub_id: null,
            after_status_id: null,
            after_priority_id: null,
            after_location: null,
            moved_comments: null
        });
        toast.info('Movimentação desativada e dados de destino resetados');
    };

    const handleToggleMoved = async (val: boolean) => {
        if (!val) {
            setShowUnmoveConfirmModal(true);
            return;
        }
        setIsMoved(true);
        const updates: Record<string, unknown> = { is_moved: true };
        if (!afterClientId && asset?.clientId) {
            setAfterClientId(asset.clientId);
            updates.after_client_id = asset.clientId;
        }
        if (!afterUnitId && asset?.beforeUnitId) {
            setAfterUnitId(asset.beforeUnitId);
            updates.after_unit_id = asset.beforeUnitId;
        }
        if (!afterUnitAssetTagId && asset?.beforeUnitAssetTagId) {
            setAfterUnitAssetTagId(asset.beforeUnitAssetTagId);
            updates.after_unit_asset_tag_id = asset.beforeUnitAssetTagId;
        }
        if (afterPriorityId === undefined && asset?.beforePriorityId !== undefined) {
            setAfterPriorityId(asset.beforePriorityId);
            updates.after_priority_id = asset.beforePriorityId;
        }
        if (!afterStatusId && asset?.beforeStatusId) {
            setAfterStatusId(asset.beforeStatusId);
            updates.after_status_id = asset.beforeStatusId;
        }
        if (!afterLocation && asset?.beforeLocation) {
            setAfterLocation(asset.beforeLocation);
            updates.after_location = asset.beforeLocation;
        }
        await saveNow(updates);
    };

    const handleAfterClientChange = (clientId: string) => {
        setAfterClientId(clientId);
        setAfterUnitId('');
        setAfterUnitAssetTagId('');
        saveNow({
            after_client_id: clientId,
            after_unit_id: null,
            after_unit_asset_tag_id: null,
            after_tag_id: null,
            after_tag_sub_id: null
        });
    };

    const handleAfterUnitChange = (unitId: string) => {
        setAfterUnitId(unitId);
        setAfterUnitAssetTagId('');
        saveNow({ after_unit_id: unitId, after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null });
    };

    const handleUnitAssetTagChange = (tag: UnitAssetTagOption | null) => {
        setAfterUnitAssetTagId(tag?.id || '');
        saveNow({
            after_unit_asset_tag_id: tag?.id || null,
            after_tag_id: tag?.asset_tag_id?.toString() || null,
            after_tag_sub_id: tag?.asset_tag_sub_id?.toString() || null
        });
    };

    const movementDestination = { afterClientId, afterUnitId, afterUnitAssetTagId, afterPriorityId, afterStatusId, afterLocation };
    const isMovementComplete = destinationIsComplete(movementDestination);

    return {
        showUnmoveConfirmModal, setShowUnmoveConfirmModal,
        isMoved, setIsMoved, afterClientId, setAfterClientId, afterUnitId, setAfterUnitId,
        afterUnitAssetTagId, setAfterUnitAssetTagId, afterStatusId, setAfterStatusId,
        afterPriorityId, setAfterPriorityId, afterLocation, setAfterLocation, movedComments, setMovedComments,
        clearMovement, handleToggleMoved, handleAfterClientChange, handleAfterUnitChange, handleUnitAssetTagChange,
        movementDestination, isMovementComplete,
    };
};
