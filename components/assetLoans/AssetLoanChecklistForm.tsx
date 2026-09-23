import React, { useState, useEffect } from 'react';
import { AssetLoanChecklist, AssetLoanChecklistImage } from '../../types';
import { dataService } from '../../services/dataService';
import { AssetLoanChecklistImageViewer } from './AssetLoanChecklistImageViewer';
import { AssetLoanCustomChecklistItem } from './AssetLoanCustomChecklistItem';
import { Loading } from '../ui/Loading';
import { toast } from 'sonner';

interface AssetLoanChecklistFormProps {
    loanId: string;
    phase: 'before' | 'after';
    assetTypeId: string;
    readonly?: boolean;
    hideSaveButton?: boolean;
    canSave?: boolean;
    userId?: string;
    canDeleteImages?: boolean;
    items?: ChecklistItemState[];
    onItemsLoad?: (phase: string, items: ChecklistItemState[]) => void;
    onSave?: () => void;
    onCompleteChange?: (isComplete: boolean) => void;
}

export interface ChecklistItemState {
    checklistTypeId?: string;
    checklistDbId?: number;
    customItemDescription?: string;
    itemDescription?: string;
    status: 'pending' | 'ok' | 'damaged' | 'missing' | 'not_applicable';
    notes: string;
    images: AssetLoanChecklistImage[];
    pendingImageFiles: File[];
    isCustom: boolean;
    isDivergent?: boolean;
}

export const AssetLoanChecklistForm: React.FC<AssetLoanChecklistFormProps> = ({
    loanId,
    phase,
    assetTypeId,
    readonly = false,
    hideSaveButton = false,
    canSave = true,
    userId,
    canDeleteImages = true,
    items: externalItems,
    onItemsLoad,
    onSave,
    onCompleteChange,
}) => {
    const [items, setItems] = useState<ChecklistItemState[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (externalItems) {
            setItems(externalItems);
            setIsLoading(false);
        } else {
            loadData();
        }
    }, [loanId, phase, assetTypeId, externalItems]);

    useEffect(() => {
        if (onCompleteChange) {
            const isComplete = items.length > 0 && items.every(item => item.status !== 'pending');
            onCompleteChange(isComplete);
        }
    }, [items, onCompleteChange]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            
            const existingChecklists = await dataService.getAssetLoanChecklists(loanId, phase);
            
            if (existingChecklists.length > 0) {
                const loadedItems: ChecklistItemState[] = await Promise.all(
                    existingChecklists.map(async (checklist) => {
                        const images = await dataService.getAssetLoanChecklistImages(checklist.id);
                        return {
                            checklistTypeId: checklist.checklistTypeId,
                            checklistDbId: parseInt(checklist.id),
                            customItemDescription: checklist.customItemDescription,
                            itemDescription: checklist.itemDescription,
                            status: checklist.status,
                            notes: checklist.notes || '',
                            images,
                            pendingImageFiles: [],
                            isCustom: !checklist.checklistTypeId,
                            isDivergent: checklist.isDivergent,
                        };
                    })
                );
                setItems(loadedItems);
                onItemsLoad?.(phase, loadedItems);
            } else {
                setItems([]);
                onItemsLoad?.(phase, []);
            }
        } catch (error) {
            toast.error('Erro ao carregar checklist');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = (index: number, status: ChecklistItemState['status']) => {
        if (readonly) return;
        const newItems = [...items];
        newItems[index].status = status;
        setItems(newItems);
    };

    const handleNotesChange = (index: number, notes: string) => {
        if (readonly) return;
        const newItems = [...items];
        newItems[index].notes = notes;
        setItems(newItems);
    };

    const handleRemoveCustomItem = (index: number) => {
        if (readonly) return;
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleCustomItemDescriptionChange = (index: number, description: string) => {
        if (readonly) return;
        const newItems = [...items];
        newItems[index].customItemDescription = description;
        setItems(newItems);
    };

    const handleImagesChange = (index: number, images: AssetLoanChecklistImage[]) => {
        const newItems = [...items];
        newItems[index].images = images;
        setItems(newItems);
    };

    const handlePendingImageAdd = (index: number, file: File) => {
        const newItems = [...items];
        newItems[index].pendingImageFiles = [...newItems[index].pendingImageFiles, file];
        setItems(newItems);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            
            for (const item of items) {
                if (item.checklistDbId) {
                    await dataService.updateAssetLoanChecklistItem(
                        item.checklistDbId,
                        item.status,
                        item.notes,
                        userId || '1'
                    );
                }
            }

            const imageUploads: Promise<unknown>[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.pendingImageFiles.length > 0 && item.checklistDbId) {
                    for (const file of item.pendingImageFiles) {
                        imageUploads.push(
                            dataService
                                .uploadAssetLoanChecklistImageFromPending(item.checklistDbId, file, userId || '1', loanId)
                                .catch((imgError) => {
                                    console.error('Error uploading checklist image:', imgError);
                                })
                        );
                    }
                }
            }
            if (imageUploads.length > 0) {
                await Promise.allSettled(imageUploads);
            }
            
            toast.success('Checklist salvo com sucesso!');
            onSave?.();
        } catch (error) {
            toast.error('Erro ao salvar checklist');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loading size="md" />
            </div>
        );
    }

    const statusOptions = [
        { value: 'ok', label: 'OK', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
        { value: 'damaged', label: 'Danificado', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
        { value: 'missing', label: 'Ausente', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
        { value: 'not_applicable', label: 'Não se aplica', color: 'text-slate-600 bg-slate-100 dark:bg-slate-700' },
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`bg-white dark:bg-card-dark rounded-xl border p-4 space-y-3 ${
                            readonly && item.isDivergent
                                ? 'border-amber-400 dark:border-amber-500'
                                : 'border-slate-100 dark:border-slate-800'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 flex items-center gap-2">
                                {readonly && item.isDivergent && (
                                    <span className="material-symbols-outlined text-amber-500 text-base">warning</span>
                                )}
                                {item.isCustom ? (
                                    <AssetLoanCustomChecklistItem
                                        value={item.customItemDescription || ''}
                                        onChange={(value) => handleCustomItemDescriptionChange(index, value)}
                                        onRemove={() => handleRemoveCustomItem(index)}
                                        readonly={readonly}
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {item.itemDescription || 'Item'}
                                    </span>
                                )}
                            </div>
                            {readonly && item.isDivergent && (
                                <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full whitespace-nowrap">
                                    Divergente
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleStatusChange(index, option.value as ChecklistItemState['status'])}
                                    disabled={readonly}
                                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                                        item.status === option.value
                                            ? option.color + ' border-current'
                                            : 'text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    } ${readonly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleNotesChange(index, e.target.value)}
                            placeholder="Observações (opcional)"
                            disabled={readonly}
                            className="w-full px-3 py-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        />

                        <AssetLoanChecklistImageViewer
                            loanId={loanId}
                            checklistId={item.checklistDbId?.toString() || `custom_${index}`}
                            images={item.images}
                            onImagesChange={(images) => handleImagesChange(index, images)}
                            readonly={readonly}
                            deferredUpload={!item.checklistDbId}
                            onPendingImageAdd={(file) => handlePendingImageAdd(index, file)}
                            pendingImagesCount={item.pendingImageFiles.length}
                            canDeleteImages={canDeleteImages}
                        />
                    </div>
                ))}
            </div>

            {!readonly && !hideSaveButton && canSave && items.length > 0 && (
                <button
                    onClick={handleSave}
                    disabled={isSaving || items.some(item => item.status === 'pending')}
                    className="w-full py-3 bg-primary text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <Loading size="sm" />
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">save</span>
                            Salvar Checklist
                        </>
                    )}
                </button>
            )}
        </div>
    );
};
