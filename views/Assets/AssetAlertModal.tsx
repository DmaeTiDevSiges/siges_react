import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AssetAlert } from '../../types';
import { dataService } from '../../services/dataService';
import { Modal } from '../../components/ui/Modal';
import { AssetAlertForm, AssetAlertFormHandle } from './AssetAlertForm';

interface AssetAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string;
    ovaId?: string;
    initialAlert?: AssetAlert;
    onSaved: () => void;
}

export const AssetAlertModal: React.FC<AssetAlertModalProps> = ({
    isOpen,
    onClose,
    assetId,
    ovaId,
    initialAlert,
    onSaved
}) => {
    const alertFormRef = useRef<AssetAlertFormHandle>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (alertData: Partial<AssetAlert>) => {
        try {
            if (initialAlert) {
                await dataService.updateAssetAlert(initialAlert.id, alertData);
                toast.success('Alerta atualizado com sucesso!');
            } else {
                await dataService.createAssetAlert({
                    ...alertData,
                    assetId,
                    ovaId
                });
                toast.success('Alerta criado com sucesso!');
            }
            onSaved();
        } catch (error) {
            console.error('Error saving alert:', error);
            toast.error('Erro ao salvar alerta.');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={async () => {
                if (alertFormRef.current) {
                    setIsSaving(true);
                    try {
                        const success = await alertFormRef.current.submit();
                        if (success) {
                            onClose();
                        }
                    } finally {
                        setIsSaving(false);
                    }
                }
            }}
            title={initialAlert ? 'Editar Alerta' : 'Novo Alerta'}
            confirmLabel="Salvar"
            confirmLoading={isSaving}
            confirmLoadingLabel="Salvando..."
            maxWidth="sm"
        >
            <AssetAlertForm
                ref={alertFormRef}
                assetId={assetId}
                ovaId={ovaId}
                initialAlert={initialAlert}
                onSave={handleSave}
                onCancel={onClose}
            />
        </Modal>
    );
};
