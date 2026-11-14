import { useState } from 'react';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { dataService } from '../services/dataService';
import { CAMERA_PHOTO_LIMITS } from '../utils/cameraOptions';
import { MAX_REPORT_PHOTOS, ReportPhotoSide } from '../components/ordersVisits/ordersVisitsAssets/assetReport/assetReportShared';
import type { OrderVisitAssetView } from '../types';
import type { useReportPhotos } from './useReportPhotos';

/**
 * Ações de foto do relatório do ativo (OrderVisitAssetReport): câmera, galeria,
 * arquivo arrastado (web), editor de imagem, visualizador e "usar como foto de
 * capa do ativo". O envio/remoção em si (fila, desfazer) fica em useReportPhotos;
 * aqui estão o estado das telas/janelas de foto e o caminho até o editor.
 * Limite: MAX_REPORT_PHOTOS por lado.
 */
export const useReportPhotoActions = (
    photos: ReturnType<typeof useReportPhotos>,
    asset: OrderVisitAssetView | null,
) => {
    const initialImages = photos.initialPhotos.map(p => p.url);
    const finalImages = photos.finalPhotos.map(p => p.url);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [photoActionSection, setPhotoActionSection] = useState<ReportPhotoSide | null>(null);
    const [editingImage, setEditingImage] = useState<{ type: ReportPhotoSide; index: number | null; src: string | File } | null>(null);
    const [showCoverConfirmModal, setShowCoverConfirmModal] = useState(false);
    const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null);
    const [isUpdatingCover, setIsUpdatingCover] = useState(false);

    const imagesOf = (side: ReportPhotoSide) => (side === 'initial' ? initialImages : finalImages);

    const ensurePhotoRoom = (side: ReportPhotoSide) => {
        if (imagesOf(side).length >= MAX_REPORT_PHOTOS) {
            toast.error(`Máximo de ${MAX_REPORT_PHOTOS} fotos permitido`);
            return false;
        }
        return true;
    };

    const handleAddPhotos = async (side: ReportPhotoSide) => {
        if (!ensurePhotoRoom(side)) return;
        try {
            const result = await Camera.pickImages({ quality: 80, limit: 1 });
            if (result.photos.length === 0) return;
            const photo = result.photos[0];
            let blob: Blob;
            try {
                blob = await (await fetch(photo.webPath!)).blob();
            } catch (fetchError) {
                if (!photo.path) throw fetchError;
                const { Filesystem } = await import('@capacitor/filesystem');
                const fileData = await Filesystem.readFile({ path: photo.path });
                blob = await (await fetch(`data:image/${photo.format};base64,${fileData.data}`)).blob();
            }
            const file = new File([blob], `report_${side}_${Date.now()}.${photo.format}`, { type: blob.type });
            setEditingImage({ type: side, index: null, src: file });
        } catch (error) {
            console.error('Error picking images', error);
        }
    };

    const takeCameraPhoto = async (side: ReportPhotoSide) => {
        if (!ensurePhotoRoom(side)) return;
        try {
            const image = await Camera.getPhoto({
                ...CAMERA_PHOTO_LIMITS,
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera
            });
            if (!image.webPath) return;
            const blob = await (await fetch(image.webPath)).blob();
            const file = new File([blob], `report_${side}_${Date.now()}.${image.format}`, { type: blob.type });
            setEditingImage({ type: side, index: null, src: file });
        } catch (error) {
            console.error('Error taking photo', error);
        }
    };

    const handleFileDrop = (side: ReportPhotoSide, file: File) => {
        if (!ensurePhotoRoom(side)) return;
        setEditingImage({ type: side, index: null, src: file });
    };

    const handleEditImage = (side: ReportPhotoSide, index: number) => {
        const photo = (side === 'initial' ? photos.initialPhotos : photos.finalPhotos)[index];
        if (!photo) return;
        if (photo.pending) {
            toast.info('Aguarde o envio desta foto terminar');
            return;
        }
        setEditingImage({ type: side, index, src: photo.url });
    };

    const handleSaveEditedImage = (editedFile: File) => {
        if (!editingImage) return;
        const { type, index } = editingImage;
        setEditingImage(null);
        photos.savePhoto(type, index, editedFile);
    };

    const handleUseAsCover = (imageUrl: string) => {
        setSelectedCoverUrl(imageUrl);
        setShowCoverConfirmModal(true);
    };

    const handleConfirmCoverPhoto = async () => {
        if (!selectedCoverUrl || !asset?.assetId || !asset?.oCompanyId) return;
        try {
            setIsUpdatingCover(true);
            const urlParts = selectedCoverUrl.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];
            const sourceFolderPath = urlParts.slice(urlParts.indexOf('companies'), urlParts.length - 1).join('/');
            await dataService.updateAssetPhotoFromReport(asset.assetId, asset.oCompanyId, fileName, sourceFolderPath);
            toast.success('Foto do ativo atualizada com sucesso!');
            setShowCoverConfirmModal(false);
            setSelectedCoverUrl(null);
        } catch (error) {
            console.error('Error updating asset cover photo:', error);
            toast.error('Erro ao atualizar foto do ativo');
        } finally {
            setIsUpdatingCover(false);
        }
    };

    // ── Movimentação ─────────────────────────────────────────────────────────

    return {
        expandedImage, setExpandedImage, photoActionSection, setPhotoActionSection, editingImage, setEditingImage,
        showCoverConfirmModal, setShowCoverConfirmModal, selectedCoverUrl, setSelectedCoverUrl, isUpdatingCover,
        handleAddPhotos, takeCameraPhoto, handleFileDrop, handleEditImage, handleSaveEditedImage,
        handleUseAsCover, handleConfirmCoverPhoto,
    };
};
