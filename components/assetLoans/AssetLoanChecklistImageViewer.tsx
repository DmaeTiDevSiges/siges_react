import React, { useState, useRef } from 'react';
import { AssetLoanChecklistImage } from '../../types';
import { OptimizedImage } from '../ui/OptimizedImage';
import { PhotoViewer } from '../ui/PhotoViewer';
import { ImageUploadSheet } from '../ui/ImageUploadSheet';
import { ImageEditorModal } from '../ui/ImageEditorModal';
import { Loading } from '../ui/Loading';
import { Modal } from '../ui/Modal';
import { r2Service } from '../../services/r2Service';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';

interface AssetLoanChecklistImageViewerProps {
    loanId: string;
    checklistId: string;
    images: AssetLoanChecklistImage[];
    onImagesChange: (images: AssetLoanChecklistImage[]) => void;
    readonly?: boolean;
    deferredUpload?: boolean;
    onPendingImageAdd?: (file: File) => void;
    pendingImagesCount?: number;
    canDeleteImages?: boolean;
}

const MAX_IMAGES_PER_ITEM = 3;

export const AssetLoanChecklistImageViewer: React.FC<AssetLoanChecklistImageViewerProps> = ({
    loanId,
    checklistId,
    images,
    onImagesChange,
    readonly = false,
    deferredUpload = false,
    onPendingImageAdd,
    pendingImagesCount = 0,
    canDeleteImages = true,
}) => {
    const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);
    const [editingImage, setEditingImage] = useState<File | string | null>(null);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const totalImages = images.length + pendingImagesCount;
    const remainingSlots = MAX_IMAGES_PER_ITEM - totalImages;

    const handleDeleteImage = async (imageId: string) => {
        setImageToDelete(imageId);
    };

    const confirmDeleteImage = async () => {
        if (!imageToDelete) return;
        
        try {
            await dataService.deleteAssetLoanChecklistImage(imageToDelete);
            onImagesChange(images.filter(img => img.id !== imageToDelete));
            toast.success('Imagem excluída');
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('Erro ao excluir imagem');
        } finally {
            setImageToDelete(null);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (files.length === 0) return;

        // Single file: keep the existing edit flow
        if (files.length === 1) {
            setEditingImage(files[0]);
            setEditingImageId(null);
            return;
        }

        // Multi-file: cap to remaining slots and upload directly
        const accepted = files.slice(0, remainingSlots);
        if (accepted.length < files.length) {
            toast.warning(`Máximo de ${MAX_IMAGES_PER_ITEM} imagens por checklist`);
        }

        setIsUploading(true);
        try {
            const newImages = [...images];
            let uploadedCount = 0;

            const uploads = accepted.map(async (file, index) => {
                if (deferredUpload && onPendingImageAdd) {
                    onPendingImageAdd(file);
                    return 'pending' as const;
                }

                try {
                    const fileName = `companies/1/assets_loans/${loanId}/checklist_${checklistId}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}.webp`;
                    const uploadResult = await r2Service.uploadImageWithVariants(
                        file,
                        fileName,
                        undefined,
                        { maxDimension: 1200, quality: 0.8 }
                    );
                    const newImage = await dataService.uploadAssetLoanChecklistImage(
                        checklistId, uploadResult.publicUrl, 'photo', '1'
                    );
                    return newImage;
                } catch (error) {
                    console.error('Error uploading image:', error);
                    return null;
                }
            });

            const results = await Promise.all(uploads);

            for (const result of results) {
                if (result === 'pending') {
                    uploadedCount++;
                } else if (result) {
                    newImages.push(result);
                    uploadedCount++;
                }
            }

            if (newImages.length !== images.length) {
                onImagesChange(newImages);
            }

            if (uploadedCount > 0) {
                if (deferredUpload && onPendingImageAdd) {
                    toast.success('Fotos serão enviadas ao salvar o checklist');
                } else {
                    toast.success(`${uploadedCount} ${uploadedCount === 1 ? 'imagem enviada' : 'imagens enviadas'} com sucesso!`);
                }
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveEditedImage = async (editedFile: File) => {
        try {
            setIsUploading(true);
            setEditingImage(null);

            if (deferredUpload && onPendingImageAdd) {
                onPendingImageAdd(editedFile);
                toast.success('Foto será enviada ao salvar o checklist');
                return;
            }

            if (editingImageId) {
                // Replacing existing image
                const fileName = `companies/1/assets_loans/${loanId}/checklist_${checklistId}_${Date.now()}.webp`;
                const uploadResult = await r2Service.uploadImageWithVariants(
                    editedFile,
                    fileName,
                    undefined,
                    { maxDimension: 1200, quality: 0.8 }
                );

                await dataService.deleteAssetLoanChecklistImage(editingImageId);
                const newImage = await dataService.uploadAssetLoanChecklistImage(
                    checklistId, uploadResult.publicUrl, 'photo', '1'
                );
                onImagesChange(images.map(img => img.id === editingImageId ? newImage : img));
                toast.success('Imagem atualizada com sucesso!');
            } else {
                // New image
                const fileName = `companies/1/assets_loans/${loanId}/checklist_${checklistId}_${Date.now()}.webp`;
                const uploadResult = await r2Service.uploadImageWithVariants(
                    editedFile,
                    fileName,
                    undefined,
                    { maxDimension: 1200, quality: 0.8 }
                );

                const newImage = await dataService.uploadAssetLoanChecklistImage(
                    checklistId, uploadResult.publicUrl, 'photo', '1'
                );
                onImagesChange([...images, newImage]);
                toast.success('Imagem enviada com sucesso!');
            }
        } catch (error) {
            console.error('Error saving image:', error);
            toast.error('Erro ao salvar imagem');
        } finally {
            setIsUploading(false);
            setEditingImageId(null);
        }
    };

    return (
        <div className="space-y-3">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />

            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                        >
                            <OptimizedImage
                                src={image.imageUrl}
                                alt={`Checklist image ${image.id}`}
                                className="w-full h-full object-cover"
                                onClick={() => {
                                    if (!readonly) {
                                        setEditingImage(image.imageUrl);
                                        setEditingImageId(image.id);
                                    } else {
                                        setExpandedImage(image.imageUrl);
                                    }
                                }}
                            />
                            {!readonly && canDeleteImages && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteImage(image.id);
                                    }}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-white text-sm">delete</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!readonly && remainingSlots > 0 && (
                <button
                    onClick={() => setIsUploadSheetOpen(true)}
                    disabled={isUploading}
                    className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                    {isUploading ? (
                        <Loading size="sm" />
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">add_a_photo</span>
                            <span className="text-xs font-bold">Adicionar Foto</span>
                        </>
                    )}
                </button>
            )}

            <ImageUploadSheet
                isOpen={isUploadSheetOpen}
                onClose={() => setIsUploadSheetOpen(false)}
                onTakeCamera={() => {
                    setIsUploadSheetOpen(false);
                    // Trigger camera directly (capture attribute forces device camera in APK)
                    cameraInputRef.current?.click();
                }}
                onSelectGallery={() => {
                    setIsUploadSheetOpen(false);
                    fileInputRef.current?.click();
                }}
            />

            {editingImage && (
                <ImageEditorModal
                    isOpen={!!editingImage}
                    imageFile={editingImage}
                    onClose={() => { setEditingImage(null); setEditingImageId(null); }}
                    onSave={handleSaveEditedImage}
                />
            )}

            {expandedImage && (
                <PhotoViewer
                    images={[expandedImage]}
                    initialIndex={0}
                    onClose={() => setExpandedImage(null)}
                />
            )}

            <Modal
                isOpen={!!imageToDelete}
                onClose={() => setImageToDelete(null)}
                onConfirm={confirmDeleteImage}
                title="Excluir Imagem"
                message="Tem certeza que deseja excluir esta imagem?"
                confirmLabel="Excluir"
                type="error"
            />
        </div>
    );
};
