/**
 * OrderVisitAssetReport - View for asset individual report during a visit.
 */
import React, { useEffect, useState } from 'react';
import { dataService } from '../../../services/dataService';
import { OrderVisitAssetActivity, OrderVisitAssetMaterial, OrderVisitAssetView, Asset } from '../../../types';
import { OrderVisitAssetCardDetail } from '../../../components/ordersVisits/ordersVisitsAssets/OrderVisitAssetCardDetail';
import { OrderVisitAssetCardListItem } from '../../../components/ordersVisits/ordersVisitsAssets/OrderVisitAssetCardListItem';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { OptimizedImage } from '../../../components/ui/OptimizedImage';
import { PhotoViewer } from '../../../components/ui/PhotoViewer';
import { Button } from '../../../components/ui/Button';
import { ButtonNew } from '../../../components/ui/ButtonNew';
import { createPortal } from 'react-dom';
import { usePermissions } from '../../../contexts/PermissionsContext';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { getProcessingStatus } from '../../../components/ordersVisits/OrderVisitProcessingButton';
import { MaintenanceChecklistView } from '../../../components/ordersVisits/ordersVisitsAssets/MaintenanceChecklistView';

const Switch: React.FC<{ checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

interface OrderVisitAssetReportProps {
    assetId: string;
    onBack: () => void;
    onManageActivities?: (orderTypeId: string) => void;
    onManageMaterials?: () => void;
}

export const OrderVisitAssetReport: React.FC<OrderVisitAssetReportProps> = ({ assetId, onBack, onManageActivities, onManageMaterials }) => {
    const [asset, setAsset] = useState<OrderVisitAssetView | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialCondition, setInitialCondition] = useState('');
    const [finalCondition, setFinalCondition] = useState('');
    const [initialImages, setInitialImages] = useState<string[]>([]);
    const [finalImages, setFinalImages] = useState<string[]>([]);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [photoActionSection, setPhotoActionSection] = useState<'initial' | 'final' | null>(null);
    const [activities, setActivities] = useState<OrderVisitAssetActivity[]>([]);
    const [usedMaterials, setUsedMaterials] = useState<OrderVisitAssetMaterial[]>([]);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [localEditMode, setLocalEditMode] = useState<'review' | 'approval' | null>(null);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showReportConfirmModal, setShowReportConfirmModal] = useState(false);
    const [showApproveMovedModal, setShowApproveMovedModal] = useState(false);
    const [visitProcessingId, setVisitProcessingId] = useState<number | null>(null);
    const [isVisitFiled, setIsVisitFiled] = useState(false);

    // Asset swap state
    const [showSwapPage, setShowSwapPage] = useState(false);
    const [swapSearchCode, setSwapSearchCode] = useState('');
    const [swapSearchResults, setSwapSearchResults] = useState<Asset[]>([]);
    const [isSearchingSwap, setIsSearchingSwap] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);
    const [swapSearchUnitId, setSwapSearchUnitId] = useState('');
    const [swapSearchClientId, setSwapSearchClientId] = useState('');
    const [swapClientsList, setSwapClientsList] = useState<{ value: string; label: string }[]>([]);
    const [swapUnitsList, setSwapUnitsList] = useState<{ value: string; label: string }[]>([]);
    const [selectedAssetForSwap, setSelectedAssetForSwap] = useState<Asset | null>(null);

    // Movement state
    const [isMoved, setIsMoved] = useState(false);
    const [afterClientId, setAfterClientId] = useState('');
    const [afterUnitId, setAfterUnitId] = useState('');
    const [afterUnitAssetTagId, setAfterUnitAssetTagId] = useState('');
    const [afterTagId, setAfterTagId] = useState('');
    const [afterTagSubId, setAfterTagSubId] = useState('');
    const [afterStatusId, setAfterStatusId] = useState('');
    const [afterPriorityId, setAfterPriorityId] = useState<number | undefined>(undefined);
    const [afterLocation, setAfterLocation] = useState('');
    const [movedComments, setMovedComments] = useState('');

    const [clientsList, setClientsList] = useState<any[]>([]);
    const [unitsList, setUnitsList] = useState<any[]>([]);
    const [unitAssetTagsList, setUnitAssetTagsList] = useState<any[]>([]);
    const [statusesList, setStatusesList] = useState<any[]>([]);
    const [prioritiesList, setPrioritiesList] = useState<any[]>([]);

    const { canView } = usePermissions();

    const isReadOnly = asset ? (
        ![1, 3, 4].includes(asset.processingId || 1) && !localEditMode
    ) : true;

    const loadPageData = async () => {
        try {
            setLoading(true);
            const [data, activitiesData, materialsData, user] = await Promise.all([
                dataService.getOrderVisitAssetById(assetId),
                dataService.getOrderVisitAssetActivities(assetId),
                dataService.getOrderVisitAssetMaterials(assetId),
                dataService.getCurrentUser()
            ]);

            if (data?.ovId) {
                try {
                    const visitData = await dataService.getActiveOrderVisit(data.ovId);
                    if (visitData) {
                        setVisitProcessingId(visitData.ovProcessingId);
                        setIsVisitFiled(!!visitData.isFiled);
                    }
                } catch (vError) {
                    console.warn('Could not fetch visit data', vError);
                }
            }

            if (user) setCurrentUserId(user.id);

            if (data) {
                setAsset(data);
                setActivities(activitiesData.filter(act => !act.maintenancePlanId || act.maintenancePlanId === '0'));
                setUsedMaterials(materialsData);
                setInitialCondition(data.beforeComments || '');
                setFinalCondition(data.afterComments || '');
                setInitialImages(data.initialPhotoUrls || []);
                setFinalImages(data.finalPhotoUrls || []);

                setIsMoved(data.isMoved || false);
                const initialClientId = data.afterClientId || data.beforeClientId || data.clientId || '';
                const initialUnitId = data.afterUnitId || data.beforeUnitId || '';

                setAfterClientId(initialClientId);
                setAfterUnitId(initialUnitId);
                setAfterUnitAssetTagId(data.afterUnitAssetTagId || '');
                setAfterTagId(data.afterTagId || '');
                setAfterTagSubId(data.afterTagSubId || '');
                setAfterStatusId(data.afterStatusId || '');
                setAfterPriorityId(data.afterPriorityId);
                setAfterLocation(data.afterLocation || '');
                setMovedComments(data.movedComments || '');
            } else {
                toast.error('Ativo da visita não encontrado');
                onBack();
            }
        } catch (error) {
            console.error('Error loading asset:', error);
            toast.error('Erro ao carregar detalhes do ativo');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (assetId) {
            loadPageData();
        }
    }, [assetId]);

    useEffect(() => {
        if (isMoved) {
            const loadLists = async () => {
                try {
                    const [clients, statuses, priorities] = await Promise.all([
                        dataService.getClients(),
                        dataService.getAssetStatuses(),
                        dataService.getAssetPriorities()
                    ]);

                    setClientsList(clients.map(c => ({ value: c.id, label: c.name })));
                    setStatusesList(statuses.map(s => ({ value: s.id, label: s.description })));
                    setPrioritiesList(priorities.map(p => ({ value: p.id, label: p.description })));

                    if (afterClientId) {
                        const units = await dataService.getUnitsByClient(afterClientId);
                        setUnitsList(units.map(u => ({ value: u.id, label: u.descriptionFull || u.description })));
                    }

                    if (afterUnitId) {
                        const unitTags = await dataService.getAssetTagsByUnit(afterUnitId);
                        setUnitAssetTagsList(unitTags);
                    }
                } catch (error) {
                    console.error('Error loading movement lists:', error);
                }
            };
            loadLists();
        }
    }, [isMoved, afterClientId, afterUnitId]);

    useEffect(() => {
        if (isMoved && afterClientId) {
            dataService.getUnitsByClient(afterClientId).then(units => {
                setUnitsList(units.map(u => ({ value: u.id, label: u.descriptionFull || u.description })));
            });
        } else {
            setUnitsList([]);
        }
    }, [afterClientId, isMoved]);

    useEffect(() => {
        if (isMoved && afterUnitId) {
            dataService.getAssetTagsByUnit(afterUnitId).then(tags => {
                setUnitAssetTagsList(tags);
            });
        } else {
            setUnitAssetTagsList([]);
        }
    }, [afterUnitId, isMoved]);

    const handleUpdateField = async (updates: any) => {
        try {
            await dataService.updateOrderVisitAsset(assetId, updates);
        } catch (error) {
            console.error('Error autosaving field:', error);
        }
    };

    const handleConfirmApproval = async () => {
        try {
            setIsUpdatingStatus(true);
            const targetStatus = localEditMode === 'review' ? 3 : 5;
            await dataService.updateOrderVisitAssetProcessingStatus(assetId, targetStatus, currentUserId);
            setAsset(prev => prev ? {
                ...prev,
                processingId: targetStatus,
                processingDescription: targetStatus === 3 ? 'Revisado' : 'Aprovado'
            } : prev);
            setLocalEditMode(null);
            setShowApproveMovedModal(false);
            toast.success(`Processamento alterado para ${targetStatus === 3 ? 'Revisado' : 'Aprovado'}`);
        } catch (error) {
            toast.error('Erro ao confirmar processamento');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleToggleMoved = async (val: boolean) => {
        if (!val) {
            const confirmed = window.confirm("Se retornar o switch para false, os dados de destino serão desconsiderados voltando o que era originalmente. Deseja continuar?");
            if (!confirmed) return;

            setIsMoved(false);
            setAfterClientId('');
            setAfterUnitId('');
            setAfterUnitAssetTagId('');
            setAfterTagId('');
            setAfterTagSubId('');
            setAfterStatusId('');
            setAfterPriorityId(undefined);
            setAfterLocation('');
            setMovedComments('');

            await handleUpdateField({
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
        } else {
            setIsMoved(true);
            const updates: any = { is_moved: true };
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
            await handleUpdateField(updates);
        }
    };

    const validateMovement = (): boolean => {
        if (!isMoved) return true;
        const isSameDestination =
            afterClientId === (asset?.clientId || '') &&
            afterUnitId === (asset?.beforeUnitId || '') &&
            afterUnitAssetTagId === (asset?.beforeUnitAssetTagId || '') &&
            afterPriorityId === asset?.beforePriorityId &&
            afterStatusId === (asset?.beforeStatusId || '') &&
            afterLocation === (asset?.beforeLocation || '');

        if (isSameDestination) {
            setShowMovementModal(true);
            return false;
        }
        return true;
    };

    const handleRemoveAsset = async () => {
        try {
            setIsUpdatingStatus(true);
            await dataService.removeAssetFromOrderVisit(assetId);
            toast.success('Ativo removido da visita');
            onBack();
        } catch (error) {
            console.error('Error removing asset:', error);
            toast.error('Erro ao remover ativo');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSearchNewAsset = async () => {
        if (!swapSearchCode.trim()) {
            toast.info('Informe o código para pesquisar');
            return;
        }

        try {
            setIsSearchingSwap(true);
            const results = await dataService.getAssets('active', swapSearchCode, swapSearchUnitId || undefined);
            // Filter out current asset
            const filteredResults = results.filter(r => r.id !== asset?.assetId);
            setSwapSearchResults(filteredResults);
            setSelectedAssetForSwap(null);

            if (filteredResults.length === 0) {
                toast.info('Nenhum ativo encontrado com este código para esta unidade');
            }
        } catch (error) {
            console.error('Error searching assets:', error);
            toast.error('Erro ao pesquisar ativos');
        } finally {
            setIsSearchingSwap(false);
        }
    };

    const openSwapModal = async () => {
        setShowSwapPage(true);
        try {
            const clients = await dataService.getClients();
            const clientsMapped = clients.map(c => ({ value: c.id, label: c.name }));
            setSwapClientsList(clientsMapped);
            
            const initialClientId = asset?.clientId || '';
            setSwapSearchClientId(initialClientId);

            if (initialClientId) {
                const units = await dataService.getUnitsByClient(initialClientId);
                setSwapUnitsList(units.map(u => ({ value: u.id, label: u.descriptionFull || u.description })));
                if (!swapSearchUnitId || swapSearchClientId !== initialClientId) {
                    setSwapSearchUnitId(asset?.unitId || '');
                }
            }
        } catch (error) {
            console.error('Error loading data for swap modal:', error);
        }
    };

    const handleSwapClientChange = async (clientId: string) => {
        setSwapSearchClientId(clientId);
        setSwapSearchUnitId(''); // Reset unit when client changes
        setSwapUnitsList([]);
        setSwapSearchResults([]); // Clear results on client change
        setSelectedAssetForSwap(null); // Clear selection on client change
        
        if (clientId) {
            try {
                const units = await dataService.getUnitsByClient(clientId);
                setSwapUnitsList(units.map(u => ({ value: u.id, label: u.descriptionFull || u.description })));
            } catch (error) {
                console.error('Error loading units for client:', clientId, error);
            }
        }
    };

    const handleSwapAsset = async (newAsset: Asset) => {
        try {
            setIsSwapping(true);
            await dataService.changeOrderVisitAsset(assetId, newAsset.id, currentUserId);
            toast.success('Ativo alterado com sucesso!');
            setShowSwapPage(false);
            loadPageData(); // Redirecionar/Recarregar para o relatório do novo ativo
        } catch (error: any) {
            console.error('Error swapping asset:', error);
            toast.error(error.message || 'Erro ao trocar ativo');
        } finally {
            setIsSwapping(false);
        }
    };

    const handleUpdateComments = async (field: 'before' | 'after', value: string) => {
        try {
            await dataService.updateOrderVisitAsset(assetId, {
                [field === 'before' ? 'before_comments' : 'after_comments']: value
            });
        } catch (error) {
            console.error('Error autosaving comments:', error);
        }
    };

    const handleAddPhotos = async (type: 'initial' | 'final') => {
        const currentImages = type === 'initial' ? initialImages : finalImages;
        if (currentImages.length >= 3) {
            toast.error("Máximo de 3 fotos permitido");
            return;
        }

        try {
            const result = await Camera.pickImages({
                quality: 80,
                limit: 3 - currentImages.length
            });

            const photosToUpload = result.photos.slice(0, 3 - currentImages.length);

            if (photosToUpload.length > 0) {
                setUploadingCount(photosToUpload.length);
                try {
                    const newUrls: string[] = [];
                    const newFilenames: string[] = [];

                    for (const photo of photosToUpload) {
                        let blob: Blob;
                        try {
                            // No APK, o pickImages retorna um webPath que as vezes falha com fetch direto
                            // Tentamos ler via fetch, e se falhar (especialmente em caminhos locais), usamos Filesystem
                            const response = await fetch(photo.webPath!);
                            blob = await response.blob();
                        } catch (fetchError) {
                            console.warn('Fetch falhou no webPath, tentando ler via capacitor-filesystem:', photo.webPath);
                            // Fallback para ler o arquivo nativo se o webPath falhar no WebView do Android
                            if (photo.path) {
                                const { Filesystem } = await import('@capacitor/filesystem');
                                const fileData = await Filesystem.readFile({
                                    path: photo.path
                                });
                                // Converter b64 para blob
                                const responseB64 = await fetch(`data:image/${photo.format};base64,${fileData.data}`);
                                blob = await responseB64.blob();
                            } else {
                                throw new Error('Não foi possível ler o arquivo da foto (caminho não encontrado)');
                            }
                        }

                        const file = new File([blob], `report_${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${photo.format}`, { type: blob.type || `image/${photo.format}` });

                        const uploadResult = await dataService.uploadOrderVisitAssetPhoto(
                            assetId,
                            file,
                            type === 'initial' ? 'before' : 'after'
                        );

                        newUrls.push(photo.webPath!);
                        newFilenames.push(uploadResult.filename);
                    }

                    if (type === 'initial') {
                        setInitialImages(prev => [...prev, ...newUrls]);
                        setAsset(prev => prev ? {
                            ...prev,
                            beforeImgFilesNames: [...(prev.beforeImgFilesNames || []), ...newFilenames],
                            initialPhotoUrls: [...(prev.initialPhotoUrls || []), ...newUrls]
                        } : prev);
                    } else {
                        setFinalImages(prev => [...prev, ...newUrls]);
                        setAsset(prev => prev ? {
                            ...prev,
                            afterImgFilesNames: [...(prev.afterImgFilesNames || []), ...newFilenames],
                            finalPhotoUrls: [...(prev.finalPhotoUrls || []), ...newUrls]
                        } : prev);
                    }
                    toast.success("Fotos enviadas com sucesso!");
                } finally {
                    setUploadingCount(0);
                }
            }
        } catch (error) {
            console.error('Error picking images', error);
            setUploadingCount(0);
        }
    };

    const takeCameraPhoto = async (type: 'initial' | 'final') => {
        const currentImages = type === 'initial' ? initialImages : finalImages;
        if (currentImages.length >= 3) {
            toast.error("Máximo de 3 fotos permitido");
            return;
        }

        try {
            const image = await Camera.getPhoto({
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera
            });

            if (image.webPath) {
                const uploadPromise = async () => {
                    const response = await fetch(image.webPath!);
                    const blob = await response.blob();
                    const file = new File([blob], `report_${type}_${Date.now()}.${image.format}`, { type: blob.type });

                    const uploadResult = await dataService.uploadOrderVisitAssetPhoto(
                        assetId,
                        file,
                        type === 'initial' ? 'before' : 'after'
                    );

                    if (type === 'initial') {
                        setInitialImages(prev => [...prev, image.webPath!]);
                        setAsset(prev => prev ? {
                            ...prev,
                            beforeImgFilesNames: [...(prev.beforeImgFilesNames || []), uploadResult.filename],
                            initialPhotoUrls: [...(prev.initialPhotoUrls || []), image.webPath!]
                        } : prev);
                    } else {
                        setFinalImages(prev => [...prev, image.webPath!]);
                        setAsset(prev => prev ? {
                            ...prev,
                            afterImgFilesNames: [...(prev.afterImgFilesNames || []), uploadResult.filename],
                            finalPhotoUrls: [...(prev.finalPhotoUrls || []), image.webPath!]
                        } : prev);
                    }
                };

                toast.promise(uploadPromise(), {
                    loading: 'Enviando foto...',
                    success: 'Foto salva!',
                    error: 'Erro ao salvar foto'
                });
            }
        } catch (error) {
            console.error('Error taking photo', error);
        }
    };

    const removeImage = async (type: 'initial' | 'final', index: number) => {
        if (!asset) return;
        const currentImages = type === 'initial' ? initialImages : finalImages;
        if (currentImages.length <= 1) {
            toast.error('É necessário manter pelo menos 1 foto');
            return;
        }

        const filenames = type === 'initial' ? asset.beforeImgFilesNames : asset.afterImgFilesNames;
        const fileNameToDelete = filenames?.[index];

        if (!fileNameToDelete) {
            if (type === 'initial') setInitialImages(prev => prev.filter((_, i) => i !== index));
            else setFinalImages(prev => prev.filter((_, i) => i !== index));
            return;
        }

        try {
            const deletePromise = dataService.removeOrderVisitAssetPhoto(
                assetId,
                type === 'initial' ? 'before' : 'after',
                fileNameToDelete
            );

            toast.promise(deletePromise, {
                loading: 'Removendo foto...',
                success: () => {
                    if (type === 'initial') {
                        setInitialImages(prev => prev.filter((_, i) => i !== index));
                        setAsset(prev => prev ? {
                            ...prev,
                            beforeImgFilesNames: (prev.beforeImgFilesNames || []).filter((_, i) => i !== index)
                        } : prev);
                    } else {
                        setFinalImages(prev => prev.filter((_, i) => i !== index));
                        setAsset(prev => prev ? {
                            ...prev,
                            afterImgFilesNames: (prev.afterImgFilesNames || []).filter((_, i) => i !== index)
                        } : prev);
                    }
                    return 'Foto removida!';
                },
                error: 'Erro ao remover foto'
            });
        } catch (error) {
            console.error('Error removing image', error);
        }
    };

    const handleAfterClientChange = async (clientId: string) => {
        setAfterClientId(clientId);
        setAfterUnitId('');
        setAfterUnitAssetTagId('');
        setAfterTagId('');
        setAfterTagSubId('');

        await handleUpdateField({
            after_client_id: clientId,
            after_unit_id: null,
            after_unit_asset_tag_id: null,
            after_tag_id: null,
            after_tag_sub_id: null
        });
    };

    const handleUnitAssetTagChange = async (unitAssetTagId: string) => {
        const selectedTag = unitAssetTagsList.find(t => t.id === unitAssetTagId);
        if (selectedTag) {
            const updates = {
                after_unit_asset_tag_id: unitAssetTagId,
                after_tag_id: selectedTag.asset_tag_id?.toString() || null,
                after_tag_sub_id: selectedTag.asset_tag_sub_id?.toString() || null
            };
            setAfterUnitAssetTagId(unitAssetTagId);
            setAfterTagId(updates.after_tag_id || '');
            setAfterTagSubId(updates.after_tag_sub_id || '');
            await handleUpdateField(updates);
        } else {
            setAfterUnitAssetTagId('');
            setAfterTagId('');
            setAfterTagSubId('');
            await handleUpdateField({
                after_unit_asset_tag_id: null,
                after_tag_id: null,
                after_tag_sub_id: null
            });
        }
    };

    const SectionHeader: React.FC<{ icon: string; title: string; required?: boolean; action?: React.ReactNode }> = ({ icon, title, required, action }) => (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                </div>
                <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1">
                    {title}
                    {required && <span className="text-red-500 text-lg leading-none">*</span>}
                </h2>
            </div>
            {action}
        </div>
    );

    const ImageGrid: React.FC<{ images: string[]; type: 'initial' | 'final' }> = ({ images, type }) => {
        console.log(`[ImageGrid] type=${type} images=`, images);
        return (
            <div className="space-y-2 mt-3">
                <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((idx) => {
                        const img = images[idx];
                        if (img) {
                            return (
                                <div key={idx} className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer" style={{ height: '96px' }}>
                                    <OptimizedImage
                                        src={img}
                                        alt={`Foto ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        onClick={() => setExpandedImage(img)}
                                        preset="medium"
                                    />
                                    {images.length > 1 && !isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage(type, idx);
                                            }}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg z-20"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">delete</span>
                                        </button>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 px-2 backdrop-blur-[2px] text-center">
                                        <p className="text-[8px] text-white font-bold uppercase tracking-wider">Foto {idx + 1}</p>
                                    </div>
                                </div>
                            );
                        } else if (!isReadOnly) {
                            return (
                                <div
                                    key={idx}
                                    onClick={() => setPhotoActionSection(type)}
                                    className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden ${images.length === 0 && idx === 0
                                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:border-red-500'
                                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500/50'
                                        }`}
                                    style={{ height: '96px' }}
                                >
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center mb-1 shadow-sm">
                                        <span className={`material-symbols-outlined text-xl ${(images.length === 0 && idx === 0) ? 'text-red-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500'}`}>
                                            add_a_photo
                                        </span>
                                    </div>
                                    <div className="text-center px-1">
                                        <p className={`text-[8px] font-bold uppercase ${(images.length === 0 && idx === 0) ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {(images.length === 0 && idx === 0) ? 'Obrigatório' : 'Adicionar'}
                                        </p>
                                        <p className="text-[7px] text-slate-400 dark:text-slate-600 font-medium italic">Foto {idx + 1}</p>
                                    </div>
                                </div>
                            );
                        } else {
                            return (
                                <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10 flex flex-col items-center justify-center" style={{ height: '96px' }}>
                                    <span className="material-symbols-outlined text-slate-200 dark:text-slate-800 text-lg mb-1">image_not_supported</span>
                                    <p className="text-[7px] text-slate-300 dark:text-slate-700 font-medium italic">Sem Foto {idx + 1}</p>
                                </div>
                            );
                        }
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!asset) return null;

    const processingStatus = getProcessingStatus(asset.processingId || 1);

    return (
        <div className="min-h-screen bg-transparent">

            <div className="max-w-md mx-auto p-4 space-y-6 pb-8">


                {asset.processingId === 4 && asset.disapprovedNotes && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                            <span className="material-symbols-outlined text-sm">info</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Motivo da Rejeição</span>
                        </div>
                        <p className="text-xs font-bold text-red-800 dark:text-red-300 leading-relaxed">
                            {asset.disapprovedNotes}
                        </p>
                    </div>
                )}

                {/* Asset Detail Card */}
                <OrderVisitAssetCardDetail asset={asset} />

                {/* Condição Antes */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <SectionHeader icon="assignment" title="Condição Antes" required />
                    <textarea
                        value={initialCondition}
                        onChange={(e) => setInitialCondition(e.target.value)}
                        onBlur={(e) => handleUpdateComments('before', e.target.value)}
                        disabled={isReadOnly}
                        placeholder={isReadOnly ? "Sem comentários" : "Descreva como foi encontrado o ativo..."}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px] disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                    <ImageGrid images={initialImages} type="initial" />
                </div>

                {/* Checklist de Manutenção Preventiva */}
                <MaintenanceChecklistView 
                    ovAssetId={asset.id} 
                    assetId={asset.assetId}
                    assetTypeId={asset.assetTypeId} 
                    companyId={asset.oCompanyId}
                    userId={currentUserId}
                    initialPlanId={asset.maintenancePlanId}
                    onUpdateProcessing={(val) => handleUpdateField({ processing_id: val })}
                    disabled={isReadOnly || isVisitFiled}
                />

                {/* Intervencoes realizadas */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <SectionHeader
                        icon="build"
                        title="Intervencoes realizadas"
                        action={!isReadOnly && <ButtonNew onClick={() => {
                            if (asset?.orderTypeId && onManageActivities) {
                                onManageActivities(asset.orderTypeId);
                            } else {
                                toast.error('Não foi possível identificar o tipo de OS');
                            }
                        }} />}
                    />
                    {activities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {activities.map((act) => (
                                <div
                                    key={act.id}
                                    className="px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex items-center gap-2 group"
                                >
                                    <span className="material-symbols-outlined text-xs text-emerald-500 font-black">done</span>
                                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none pt-0.5">
                                        {act.activityDescription}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Nenhuma intervenção selecionada.
                            </p>
                        </div>
                    )}
                </div>

                {/* Materiais utilizados */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <SectionHeader
                        icon="inventory_2"
                        title="Materiais utilizados"
                        action={!isReadOnly && <ButtonNew onClick={() => {
                            if (onManageMaterials) {
                                onManageMaterials();
                            } else {
                                toast.error('Funcionalidade indisponível');
                            }
                        }} />}
                    />
                    {usedMaterials.length > 0 ? (
                        <>
                            <div className="space-y-2">
                                {usedMaterials.map((item) => (
                                    <div
                                        key={item.id}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
                                    >
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                                {item.materialCode}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                                {item.materialDescription}
                                            </span>
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                                                {item.amount} {item.materialUnit}
                                            </span>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            {canView('orders_visits_costs') && (
                                                <span className="text-[10px] font-black text-slate-900 dark:text-white">
                                                    {item.valueTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                ))}
                            </div>
                            {canView('orders_visits_costs') && (
                                <div className="mt-4 flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                                        TOTAL
                                    </span>
                                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                                        {usedMaterials.reduce((sum, item) => sum + (item.valueTotal || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-8 border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Nenhum material registrado.
                            </p>
                        </div>
                    )}
                </div>

                {/* 4) Movimentação */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300">
                    <SectionHeader
                        icon="local_shipping"
                        title="Movimentação"
                        action={<Switch checked={isMoved} onChange={handleToggleMoved} disabled={isReadOnly} />}
                    />

                    {isMoved ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 pt-2 pb-2">
                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10 mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                        <span className="material-symbols-outlined text-sm">info</span>
                                    </div>
                                    <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">
                                        Informe o destino
                                    </p>
                                </div>
                            </div>

                            <Select
                                label="Cliente / Parceiro ? *"
                                placeholder="Selecione o destino..."
                                options={clientsList}
                                value={afterClientId}
                                onChange={(e) => handleAfterClientChange(e.target.value)}
                                disabled={isReadOnly}
                            />

                            <Select
                                label="Unidade ? *"
                                placeholder="Selecione a unidade de destino..."
                                options={unitsList}
                                value={afterUnitId}
                                onChange={(e) => {
                                    setAfterUnitId(e.target.value);
                                    setAfterUnitAssetTagId('');
                                    handleUpdateField({ after_unit_id: e.target.value, after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null });
                                }}
                                disabled={isReadOnly || !afterClientId}
                            />

                            <Select
                                label="Setor / Posição ? *"
                                placeholder="Selecione o setor/posição..."
                                options={unitAssetTagsList.map(t => ({ value: t.id, label: t.description }))}
                                value={afterUnitAssetTagId}
                                onChange={(e) => handleUnitAssetTagChange(e.target.value)}
                                disabled={isReadOnly || !afterUnitId}
                            />

                            <Select
                                label="Situação ? *"
                                options={statusesList}
                                value={afterStatusId}
                                onChange={(e) => {
                                    setAfterStatusId(e.target.value);
                                    handleUpdateField({ after_status_id: e.target.value });
                                }}
                                disabled={isReadOnly}
                            />

                            <Select
                                label="Prioridade ? *"
                                options={prioritiesList}
                                value={afterPriorityId?.toString()}
                                onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                                    setAfterPriorityId(val);
                                    handleUpdateField({ after_priority_id: val });
                                }}
                                disabled={isReadOnly}
                            />

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                    Localização ?
                                </label>
                                <textarea
                                    value={afterLocation}
                                    onChange={(e) => setAfterLocation(e.target.value)}
                                    onBlur={(e) => handleUpdateField({ after_location: e.target.value })}
                                    disabled={isReadOnly}
                                    placeholder="Localização específica..."
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[50px] disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                    Observações ?
                                </label>
                                <textarea
                                    value={movedComments}
                                    onChange={(e) => setMovedComments(e.target.value)}
                                    onBlur={(e) => handleUpdateField({ moved_comments: e.target.value })}
                                    disabled={isReadOnly}
                                    placeholder="Observações sobre a movimentação..."
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px] disabled:opacity-70 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Clique no switch para informar movimentação do ativo.
                            </p>
                        </div>
                    )}
                </div>

                {/* Condição Depois */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                    <SectionHeader icon="assignment_turned_in" title="Condição Depois" required />
                    <textarea
                        value={finalCondition}
                        onChange={(e) => setFinalCondition(e.target.value)}
                        onBlur={(e) => handleUpdateComments('after', e.target.value)}
                        disabled={isReadOnly}
                        placeholder={isReadOnly ? "Sem comentários" : "Descreva a condição final (depois) do ativo..."}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px] disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                    <ImageGrid images={finalImages} type="final" />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 pb-12">
                    {/* 1) RASCUNHO (1) ou REJEITADO (4) actions */}
                    {([1, 4].includes(Number(asset.processingId || 1))) && (
                        <div className="flex flex-col gap-3">
                            <button
                                disabled={uploadingCount > 0 || isUpdatingStatus}
                                onClick={() => {
                                    if (!initialCondition.trim() || initialImages.length === 0 || !finalCondition.trim() || finalImages.length === 0) {
                                        toast.error('Preencha as condições e adicione fotos antes de reportar');
                                        return;
                                    }

                                    if (activities.length === 0) {
                                        toast.error('É necessário selecionar ao menos uma intervenção realizada');
                                        return;
                                    }

                                    if (isMoved) {
                                        if (!afterClientId || !afterUnitId || !afterUnitAssetTagId || !afterPriorityId || !afterStatusId) {
                                            toast.error('Preencha todos os campos obrigatórios da movimentação');
                                            return;
                                        }
                                        if (!validateMovement()) return;
                                    }

                                    setShowReportConfirmModal(true);
                                }}
                                className="w-full py-4 rounded-2xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                            >
                                {isUpdatingStatus ? 'Processando...' : 'Reportar Relatório do Ativo'}
                            </button>

                            <button
                                onClick={onBack}
                                className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                            >
                                Manter como Rascunho
                            </button>

                        </div>
                    )}

                    {/* 2) REPORTADO (2) button for simple exit (only if visit is also in draft/processing) */}
                    {Number(asset.processingId) === 2 && !localEditMode && Number(visitProcessingId || 1) === 1 && (
                        <button
                            disabled={isUpdatingStatus}
                            onClick={async () => {
                                try {
                                    setIsUpdatingStatus(true);
                                    await dataService.updateOrderVisitAssetProcessingStatus(assetId, 1, currentUserId);
                                    toast.info('Relatório do ativo revertido para Rascunho');
                                    onBack();
                                } catch (error) {
                                    console.error('Error reverting asset to draft:', error);
                                    toast.error('Erro ao retornar para rascunho');
                                    onBack(); // Go back anyway to avoid being stuck
                                } finally {
                                    setIsUpdatingStatus(false);
                                }
                            }}
                            className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            {isUpdatingStatus ? 'Processando...' : 'Manter como Rascunho'}
                        </button>
                    )}

                    {/* 2) REPORTADO -> Review / Approve actions (for users with permissions) */}
                    {([2, 3].includes(Number(asset.processingId)) || localEditMode) && (
                        <div className="flex flex-col gap-3">
                            {!localEditMode ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        {canView('orders_visits_processing_disapprove') && (
                                            <button
                                                onClick={() => setShowRejectionModal(true)}
                                                className={`py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-black uppercase tracking-widest active:scale-95 transition-all ${!canView('orders_visits_processing_review') ? 'col-span-2' : ''}`}
                                            >
                                                Rejeitar
                                            </button>
                                        )}
                                        {canView('orders_visits_processing_review') && (
                                            <button
                                                onClick={() => setLocalEditMode('review')}
                                                className={`py-4 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-black uppercase tracking-widest active:scale-95 transition-all ${!canView('orders_visits_processing_disapprove') ? 'col-span-2' : ''}`}
                                            >
                                                Revisar
                                            </button>
                                        )}
                                    </div>
                                    {canView('orders_visits_processing_approve') && (
                                        <button
                                            onClick={() => setLocalEditMode('approval')}
                                            className="py-4 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            Aprovar
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setLocalEditMode(null)}
                                        className="py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={isUpdatingStatus}
                                        onClick={async () => {
                                            if (!initialCondition.trim() || initialImages.length === 0 || !finalCondition.trim() || finalImages.length === 0) {
                                                toast.error('Preencha as condições e adicione fotos antes de confirmar');
                                                return;
                                            }

                                            if (activities.length === 0) {
                                                toast.error('É necessário selecionar ao menos uma intervenção realizada');
                                                return;
                                            }
                                            if (!validateMovement()) return;
                                            
                                            // Se for aprovação e tiver movimentação, mostra modal de aviso
                                            if (localEditMode === 'approval' && isMoved) {
                                                setShowApproveMovedModal(true);
                                                return;
                                            }

                                            await handleConfirmApproval();
                                        }}
                                        className={`py-4 rounded-2xl text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg ${localEditMode === 'review' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
                                    >
                                        {isUpdatingStatus ? (localEditMode === 'review' ? 'Revisando...' : 'APROVANDO...') : localEditMode === 'review' ? 'Confirmar Revisão' : 'Confirmar Aprovação'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botão Trocar Ativo (condições específicas: Status Reportado/Revisado/Aprovado, não movido e não arquivado) */}
                    {[2, 3, 5].includes(Number(asset.processingId)) && !isMoved && asset.isFiled === false && (
                        <div className="flex flex-col gap-3 mt-4">
                            <button
                                type="button"
                                onClick={openSwapModal}
                                className="w-full py-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-100 dark:border-amber-500/20 text-xs font-black uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all active:scale-95"
                            >
                                Trocar Ativo (Ativo Errado)
                            </button>
                        </div>
                    )}

                    {(!asset.isFiled || !isMoved) && (
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => setShowRemoveModal(true)}
                                className="w-full py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20 text-xs font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95"
                            >
                                Remover Ativo da Visita
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Asset Swap Page (Overlay) */}
            {showSwapPage && (
                <div className="fixed inset-0 z-150 bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-right duration-300 overflow-y-auto">
                    {/* Page Header */}
                    <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800 p-4">
                        <div className="max-w-md mx-auto flex items-center gap-4">
                            <button 
                                onClick={() => {
                                    setShowSwapPage(false);
                                    setSwapSearchCode('');
                                    setSwapSearchResults([]);
                                    setSelectedAssetForSwap(null);
                                }}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 active:scale-90 transition-all"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Buscar Ativo</h2>
                        </div>
                    </div>

                    <div className="max-w-md mx-auto p-4 pb-12 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                        Cliente
                                    </label>
                                    <Select
                                        options={swapClientsList}
                                        value={swapSearchClientId}
                                        onChange={(e) => handleSwapClientChange(e.target.value)}
                                        placeholder="Selecione o cliente..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                        Unidade
                                    </label>
                                    <Select
                                        options={swapUnitsList}
                                        value={swapSearchUnitId}
                                        onChange={(e) => setSwapSearchUnitId(e.target.value)}
                                        placeholder="Selecione a unidade..."
                                        disabled={!swapSearchClientId}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                        Código do Ativo
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={swapSearchCode}
                                            onChange={(e) => setSwapSearchCode(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchNewAsset()}
                                            placeholder="Ex: MTR-01"
                                            className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            disabled={!swapSearchUnitId}
                                        />
                                        <button
                                            onClick={handleSearchNewAsset}
                                            disabled={isSearchingSwap || !swapSearchCode}
                                            className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20"
                                        >
                                            {isSearchingSwap ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <span className="material-symbols-outlined">search</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isSearchingSwap && (
                            <div className="flex justify-center py-12">
                                <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            </div>
                        )}

                        {!isSearchingSwap && swapSearchResults.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                                    Resultados Encontrados ({swapSearchResults.length})
                                </h4>
                                <div className="space-y-3">
                                    {swapSearchResults.map(res => {
                                        const isSelected = selectedAssetForSwap?.id === res.id;
                                        const mappedAsset: any = {
                                            ...res,
                                            beforeUnitDescription: res.unitDescriptionFull,
                                            beforeTagDescription: res.tagName,
                                            beforeTagSubDescription: res.tagSubName,
                                            beforeStatusDescription: res.statusCode,
                                            beforeStatusColor: res.statusColor,
                                        };

                                        return (
                                            <div key={res.id} className="space-y-3">
                                                <div className={`${isSelected ? 'ring-2 ring-indigo-500 rounded-2xl shadow-xl ring-offset-4 bg-white dark:bg-slate-900 dark:ring-offset-slate-950 transition-all' : ''}`}>
                                                    <OrderVisitAssetCardListItem
                                                        asset={mappedAsset}
                                                        onClick={() => setSelectedAssetForSwap(isSelected ? null : res)}
                                                    />
                                                </div>
                                                {isSelected && (
                                                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 px-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSwapAsset(res);
                                                            }}
                                                            disabled={isSwapping}
                                                            className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-black rounded-[24px] shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 group"
                                                        >
                                                            {isSwapping ? (
                                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <span className="material-symbols-outlined text-2xl transition-transform group-hover:scale-110">check_circle</span>
                                                                    CONFIRMAR SUBSTITUIÇÃO
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {!isSearchingSwap && swapSearchResults.length === 0 && swapSearchCode && (
                            <div className="text-center py-12 px-6">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <span className="material-symbols-outlined text-4xl">search_off</span>
                                </div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum Ativo Encontrado</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {expandedImage && (
                <PhotoViewer
                    src={expandedImage}
                    onClose={() => setExpandedImage(null)}
                    alt="Visita Técnica"
                    images={[...initialImages, ...finalImages]}
                    initialIndex={[...initialImages, ...finalImages].indexOf(expandedImage)}
                />
            )}

            {/* Photo Action Sheet Overlay */}
            {photoActionSection && (
                <div
                    className="fixed inset-0 z-150 bg-linear-to-b from-black/20 to-black/60 flex items-end justify-center animate-in fade-in duration-200"
                    onClick={() => setPhotoActionSection(null)}
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[24px] overflow-hidden animate-in slide-in-from-bottom duration-300 p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Captura de Evidência</h3>

                        <div className="space-y-2">
                            <button
                                className="w-full text-left py-4 px-3 text-sm font-black text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 flex items-center justify-between group"
                                onClick={() => {
                                    handleAddPhotos(photoActionSection);
                                    setPhotoActionSection(null);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 transition-transform group-hover:scale-110">
                                        <span className="material-symbols-outlined text-xl">collections</span>
                                    </div>
                                    <span>Escolher da Galeria</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                            </button>
                            <button
                                className="w-full text-left py-4 px-3 text-sm font-black text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 flex items-center justify-between group"
                                onClick={() => {
                                    takeCameraPhoto(photoActionSection);
                                    setPhotoActionSection(null);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                                        <span className="material-symbols-outlined text-xl">photo_camera</span>
                                    </div>
                                    <span>Tirar Foto Agora</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                            </button>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full mt-6 py-4 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest border border-slate-100 dark:border-slate-800 rounded-xl"
                            onClick={() => setPhotoActionSection(null)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            {/* Upload Progress Overlay */}
            {uploadingCount > 0 && (
                <div className="fixed inset-0 z-200 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl max-w-sm mx-4 animate-in zoom-in duration-300">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-indigo-500 animate-bounce">
                                        cloud_upload
                                    </span>
                                </div>
                                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    Enviando {uploadingCount} {uploadingCount === 1 ? 'foto' : 'fotos'}
                                </h3>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Aguarde um momento...
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectionModal && createPortal(
                <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowRejectionModal(false)}>
                    <div
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                                <span className="material-symbols-outlined text-3xl">rebase_edit</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Rejeitar Relatório</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                Informe abaixo o motivo do ajuste ou rejeição para que o técnico possa corrigir.
                            </p>
                            <textarea
                                value={rejectionNotes}
                                onChange={(e) => setRejectionNotes(e.target.value)}
                                placeholder="Descreva os motivos..."
                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-[120px]"
                            />
                        </div>
                        <div className="p-6 pt-0 flex flex-col gap-3">
                            <button
                                disabled={!rejectionNotes.trim() || isUpdatingStatus}
                                onClick={async () => {
                                    try {
                                        setIsUpdatingStatus(true);
                                        await dataService.disapproveOrderVisitAsset(assetId, currentUserId, rejectionNotes);
                                        setAsset({
                                            ...asset!,
                                            processingId: 4,
                                            processingDescription: 'Rejeitado',
                                            disapprovedNotes: rejectionNotes
                                        });
                                        setShowRejectionModal(false);
                                        toast.success('Relatório Rejeitado');
                                    } catch (error) {
                                        toast.error('Erro ao rejeitar');
                                    } finally {
                                        setIsUpdatingStatus(false);
                                    }
                                }}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isUpdatingStatus ? 'Processando...' : 'Confirmar Rejeição'}
                            </button>
                            <button
                                onClick={() => setShowRejectionModal(false)}
                                className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Movement Validation Modal */}
            <Modal
                isOpen={showMovementModal}
                onClose={() => setShowMovementModal(false)}
                title="Atenção"
                message="O destino da movimentação deve ser diferente da origem (Cliente, Unidade, Setor/Posição, Prioridade ou Situação)."
                type="warning"
                confirmLabel="Entendi"
            />

            {/* Remove Confirmation Modal */}
            <Modal
                isOpen={showRemoveModal}
                onClose={() => setShowRemoveModal(false)}
                onConfirm={handleRemoveAsset}
                title="Remover Ativo"
                message="Tem certeza que deseja remover este ativo desta visita? Isso excluirá permanentemente todos os dados associados, incluindo materiais, intervenções e imagens. Esta ação não pode ser desfeita."
                type="error"
                confirmLabel="Sim, Remover"
                confirmLoading={isUpdatingStatus}
                confirmLoadingLabel="REMOVENDO..."
                cancelLabel="Não, Manter"
            />

            {/* Approval with Movement Confirmation Modal */}
            <Modal
                isOpen={showApproveMovedModal}
                onClose={() => setShowApproveMovedModal(false)}
                onConfirm={handleConfirmApproval}
                title="Confirmar Aprovação com Movimentação"
                message="Este ativo possui uma movimentação registrada! Ao confirmar a aprovação, os dados de movimentação deste relatório (situação, local/unidade, tag) irão substituir as informações reais do ativo. Tem certeza que deseja aprovar e confirmar esta movimentação?"
                type="warning"
                confirmLabel="Aprovar Modificando Ativo"
                confirmLoading={isUpdatingStatus}
                confirmLoadingLabel="APROVANDO..."
                cancelLabel="Cancelar"
            />

            {/* Report Confirmation Modal */}
            <Modal
                isOpen={showReportConfirmModal}
                onClose={() => setShowReportConfirmModal(false)}
                onConfirm={async () => {
                    try {
                        setIsUpdatingStatus(true);
                        if (initialCondition) await handleUpdateComments('before', initialCondition);
                        if (finalCondition) await handleUpdateComments('after', finalCondition);
                        await dataService.reportedOrderVisitAsset(assetId, currentUserId);
                        toast.success('Relatório reportado com sucesso!');
                        onBack();
                    } catch (error) {
                        toast.error('Erro ao reportar');
                    } finally {
                        setIsUpdatingStatus(false);
                    }
                }}
                title="Confirmar Reporte"
                message="Após reportar, as informações não poderão ser mais atualizadas. Deseja continuar?"
                type="warning"
                confirmLabel="Sim, Reportar"
                confirmLoading={isUpdatingStatus}
                confirmLoadingLabel="REPORTANDO..."
                cancelLabel="Cancelar"
            />
        </div>
    );
};
