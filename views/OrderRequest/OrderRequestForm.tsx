import React, { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Client, Unit, OrderType, OrderSubType, OrderObject, OrderPlan, Contract, Team, Priority, Order, AssetTag, AssetAlert } from '../../types';
import { dataService } from '../../services/dataService';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { PhotoViewer } from '../../components/ui/PhotoViewer';
import { ImageEditorModal } from '../../components/ui/ImageEditorModal';
import { OrderCardDetail } from '../../components/orderRequests/OrderRequestCardDetail';
import { OrderAlertCard } from './OrderAlertCard';

export interface OrderRequestFormProps {
    onBack: () => void;
    onSubmit?: (data: any) => void;
    initialData?: Partial<Order>;
    mode?: 'create' | 'edit';
    showCardHeader?: boolean;
    hideFooter?: boolean;
}

export interface OrderRequestFormRef {
    submit: () => Promise<boolean>;
}

export const OrderRequestForm = forwardRef<OrderRequestFormRef, OrderRequestFormProps>(({ onBack, onSubmit, initialData, mode, showCardHeader, hideFooter }, ref) => {
    // Detect edit mode — only respect the explicit mode prop
    const isEdit = mode === 'edit';

    // Captura o parentId no momento em que o form abre, para evitar que
    // selectedOrder mude durante o preenchimento e gere parent_id errado
    const capturedParentIdRef = useRef<number | undefined>(
        !isEdit && initialData?.id ? parseInt(initialData.id) : undefined
    );

    // State
    const [step, setStep] = useState(1);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
    const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
    const [orderSubTypes, setOrderSubTypes] = useState<OrderSubType[]>([]);
    const [orderObjects, setOrderObjects] = useState<OrderObject[]>([]);
    const [orderPlans, setOrderPlans] = useState<OrderPlan[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);

    const [formData, setFormData] = useState({
        clientId: initialData?.clientId || '',
        departmentId: initialData?.departmentId || '',
        unitId: initialData?.unitId || '',
        unitAssetTagId: initialData?.unitAssetTagId || '',
        orderTypeId: initialData?.typeId ? String(initialData.typeId) : '',
        orderTypeSubId: initialData?.typeSubId ? String(initialData.typeSubId) : '',
        orderObjectId: initialData?.objectId ? String(initialData.objectId) : '',
        orderPlanId: initialData?.planId ? String(initialData.planId) : '',
        contractId: initialData?.contractId ? String(initialData.contractId) : '',
        teamId: initialData?.teamId ? String(initialData.teamId) : '',
        priorityId: initialData?.priorityId ? String(initialData.priorityId) : '',
        requestedServices: initialData?.requestedServices || '',
    });

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
    const [isPhotoActionOpen, setIsPhotoActionOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<{ url: string | File; index: number | null } | null>(null);

    // Alert states
    const [availableAlerts, setAvailableAlerts] = useState<AssetAlert[]>([]);
    const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(false);
    const [initialLinkedAlertIds, setInitialLinkedAlertIds] = useState<string[]>([]);

    useEffect(() => {
        const loadLists = async () => {
            try {
                let currentInitialData = initialData;
                if (initialData?.id && (!initialData.typeId || !initialData.contractId)) {
                    const fullOrder = await dataService.getOrderById(initialData.id);
                    if (fullOrder) {
                        currentInitialData = { ...initialData, ...fullOrder };
                    }
                }

                const [clientsList, typesList, prioritiesList, objectsList, plansList, teamsList] = await Promise.all([
                    dataService.getClients(),
                    dataService.getOrderTypes('active'),
                    dataService.getPriorities('active'),
                    dataService.getOrderObjects('active'),
                    dataService.getOrderPlans('active'),
                    dataService.getTeams(),
                ]);

                setClients(clientsList.filter(c => c.status === 'active' && (!c.companyId || c.companyId === '0')));
                setOrderTypes(typesList);
                setPriorities(prioritiesList);
                setOrderObjects(objectsList);
                setOrderPlans(plansList);
                setTeams(teamsList);

                if (currentInitialData) {
                    setFormData(prev => ({
                        ...prev,
                        clientId: currentInitialData.clientId || prev.clientId,
                        departmentId: currentInitialData.departmentId || prev.departmentId,
                        unitId: currentInitialData.unitId || prev.unitId,
                        unitAssetTagId: currentInitialData.unitAssetTagId || prev.unitAssetTagId,
                        orderTypeId: currentInitialData.typeId ? String(currentInitialData.typeId) : prev.orderTypeId,
                        orderTypeSubId: currentInitialData.typeSubId ? String(currentInitialData.typeSubId) : prev.orderTypeSubId,
                        orderObjectId: currentInitialData.objectId ? String(currentInitialData.objectId) : prev.orderObjectId,
                        orderPlanId: currentInitialData.planId ? String(currentInitialData.planId) : prev.orderPlanId,
                        contractId: currentInitialData.contractId ? String(currentInitialData.contractId) : prev.contractId,
                        teamId: currentInitialData.teamId ? String(currentInitialData.teamId) : prev.teamId,
                        priorityId: currentInitialData.priorityId ? String(currentInitialData.priorityId) : prev.priorityId,
                        requestedServices: currentInitialData.requestedServices || prev.requestedServices
                    }));

                    if (currentInitialData.clientId) {
                        const [clientUnits, clientContracts] = await Promise.all([
                            dataService.getUnitsByClient(currentInitialData.clientId),
                            dataService.getContractsByClientId(currentInitialData.clientId)
                        ]);
                        setUnits(clientUnits);
                        setContracts(clientContracts);

                        if (currentInitialData.unitId) {
                            const unitAssets = await dataService.getUnitsAssetsByUnit(currentInitialData.unitId);
                            setAssetTags(unitAssets);
                        }
                    }

                    if (currentInitialData.typeId) {
                        const subTypes = await dataService.getOrderSubTypesByType(currentInitialData.typeId);
                        setOrderSubTypes(subTypes);
                    }
                }
            } catch (err) {
                console.error("Error loading OS lists", err);
                toast.error("Erro ao carregar configurações");
            }
        };

        loadLists();
    }, [initialData?.id]);

    useEffect(() => {
        if (initialData?.imgFilesNames) {
            setExistingImages(initialData.imgFilesNames);
        }
    }, [initialData]);

    useEffect(() => {
        if (formData.clientId) {
            const loadUnits = async () => {
                try {
                    const clientUnits = await dataService.getUnitsByClient(formData.clientId!);
                    setUnits(clientUnits);
                } catch (err) {
                    console.error("Error loading units", err);
                }
            };
            loadUnits();
        } else {
            setUnits([]);
        }
    }, [formData.clientId]);

    useEffect(() => {
        const loadContracts = async () => {
            try {
                const user = await dataService.getCurrentUser();
                if (user && user.departmentId) {
                    const contractsByDept = await dataService.getContractsByClientDepartmentId(user.departmentId, formData.clientId || undefined);
                    const validContracts = contractsByDept.filter(c => Number(c.statusId) === 1);
                    setContracts(validContracts);
                }
            } catch (err) {
                console.error("Error loading contracts", err);
            }
        };
        loadContracts();
    }, [formData.clientId]);

    useEffect(() => {
        if (formData.unitId) {
            const loadUnitAssets = async () => {
                try {
                    const unitAssets = await dataService.getUnitsAssetsByUnit(formData.unitId);
                    setAssetTags(unitAssets);
                } catch (err) {
                    console.error("Error loading unit assets", err);
                }
            };
            loadUnitAssets();
        } else {
            setAssetTags([]);
        }
    }, [formData.unitId]);

    useEffect(() => {
        if (formData.orderTypeId) {
            const loadSubTypes = async () => {
                try {
                    const subTypes = await dataService.getOrderSubTypesByType(formData.orderTypeId);
                    setOrderSubTypes(subTypes);
                } catch (err) {
                    console.error("Error loading sub types", err);
                }
            };
            loadSubTypes();
        } else {
            setOrderSubTypes([]);
        }
    }, [formData.orderTypeId]);

    useEffect(() => {
        const loadAlerts = async () => {
            if (formData.unitAssetTagId && formData.orderTypeId) {
                setLoadingAlerts(true);
                try {
                    const alerts = await dataService.getOpenAlertsBySectorAndType(
                        formData.unitAssetTagId,
                        formData.orderTypeId
                    );
                    setAvailableAlerts(alerts);

                    // In edit mode, pre-load alerts linked to this OS
                    if (isEdit && initialData?.id) {
                        try {
                            const linkedIds = await dataService.getAlertsByOrderId(initialData.id);
                            if (linkedIds.length > 0) {
                                setSelectedAlertIds(linkedIds);
                                setInitialLinkedAlertIds(linkedIds);
                            }
                        } catch (err) {
                            console.error("Error loading linked alerts", err);
                        }
                    }
                } catch (err) {
                    console.error("Error loading alerts", err);
                    setAvailableAlerts([]);
                } finally {
                    setLoadingAlerts(false);
                }
            } else {
                setAvailableAlerts([]);
                setSelectedAlertIds([]);
            }
        };

        loadAlerts();
    }, [formData.unitAssetTagId, formData.orderTypeId, isEdit, initialData?.id]);

    const handleAddPhotos = async () => {
        const totalPhotos = selectedFiles.length + existingImages.length;
        if (totalPhotos >= 4) {
            toast.error("Máximo de 4 fotos permitido");
            return;
        }

        try {
            const result = await Camera.pickImages({
                quality: 80,
                limit: 1 // Sequential editing
            });

            if (result.photos.length > 0) {
                const photo = result.photos[0];
                if (photo.webPath) {
                    const response = await fetch(photo.webPath);
                    const blob = await response.blob();
                    const file = new File([blob], `os_evidence_${Date.now()}.${photo.format}`, { type: blob.type });
                    setEditingImage({ url: file, index: null });
                }
            }
        } catch (error) {
            console.error('Error picking images', error);
        }
    };

    const takeCameraPhoto = async () => {
        const totalPhotos = selectedFiles.length + existingImages.length;
        if (totalPhotos >= 4) {
            toast.error("Máximo de 4 fotos permitido");
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
                const response = await fetch(image.webPath);
                const blob = await response.blob();
                const file = new File([blob], `os_evidence_${Date.now()}.${image.format}`, { type: blob.type });
                setEditingImage({ url: file, index: null });
            }
        } catch (error) {
            console.error('Error taking photo', error);
        }
    };

    const removePhoto = (index: number) => {
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingPhoto = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };
    const handleSaveEditedImage = (editedFile: File) => {
        if (!editingImage) return;

        const newUrl = URL.createObjectURL(editedFile);

        if (editingImage.index !== null) {
            // Editing existing
            setPreviewUrls(prev => {
                const next = [...prev];
                next[editingImage.index!] = newUrl;
                return next;
            });
            setSelectedFiles(prev => {
                const next = [...prev];
                next[editingImage.index!] = editedFile;
                return next;
            });
        } else {
            // Adding new
            setPreviewUrls(prev => [...prev, newUrl]);
            setSelectedFiles(prev => [...prev, editedFile]);
        }

        setEditingImage(null);
    };

    const handleSubmit = async (): Promise<boolean> => {
        if (!formData.clientId || !formData.unitId || !formData.orderTypeId || !formData.requestedServices || !formData.contractId || !formData.priorityId || !formData.orderTypeSubId || !formData.orderObjectId) {
            toast.error("Preencha todos os campos obrigatórios");
            return false;
        }

        setIsLoading(true);
        try {
            const orderData: Partial<Order> = {
                clientId: formData.clientId,
                unitId: formData.unitId,
                unitAssetTagId: formData.unitAssetTagId || undefined,
                typeId: formData.orderTypeId,
                typeSubId: formData.orderTypeSubId || undefined,
                objectId: formData.orderObjectId || undefined,
                priorityId: formData.priorityId || undefined,
                contractId: formData.contractId || undefined,
                planId: formData.orderPlanId || undefined,
                teamId: formData.teamId || undefined,
                assetTagId: selectedAsset?.asset_tag_id?.toString() || initialData?.assetTagId,
                assetTagSubId: selectedAsset?.asset_tag_sub_id?.toString() || initialData?.assetTagSubId,
                requestedServices: formData.requestedServices,
                images: existingImages,
            };

            let resultOrder: Order;

            if (isEdit && initialData?.id) {
                resultOrder = await dataService.updateOrder(initialData.id, orderData);
                toast.success("Ordem de Serviço atualizada!");
            } else {
                const parentOrderId = capturedParentIdRef.current;
                if (!parentOrderId) {
                    toast.error("Erro: SS pai não identificada");
                    setIsLoading(false);
                    return;
                }
                const newOrder = {
                    ...orderData,
                    parentId: parentOrderId,
                };
                resultOrder = await dataService.createOrder(newOrder);

                if (existingImages.length > 0 && initialData?.id && resultOrder.id && initialData.companyId && resultOrder.companyId) {
                    try {
                        await dataService.copyImagesFromOrderToOrder(initialData.companyId, initialData.id, resultOrder.companyId, resultOrder.id, existingImages);
                    } catch (copyError) {
                        console.error("Error copying images", copyError);
                    }
                }
                toast.success("Ordem de Serviço criada!");
            }

            // Link selected alerts to the order
            if (selectedAlertIds.length > 0 && resultOrder.id) {
                try {
                    await dataService.linkAlertsToOrder(resultOrder.id, selectedAlertIds);
                } catch (linkError) {
                    console.error("Error linking alerts to order", linkError);
                }
            }

            // In edit mode, unlink alerts that were deselected
            if (isEdit && resultOrder.id && initialLinkedAlertIds.length > 0) {
                const toUnlink = initialLinkedAlertIds.filter(id => !selectedAlertIds.includes(id));
                for (const alertId of toUnlink) {
                    try {
                        await dataService.unlinkAlertFromOrder(resultOrder.id, alertId);
                    } catch (unlinkError) {
                        console.error("Error unlinking alert from order", unlinkError);
                    }
                }
            }

            const finalCompanyId = resultOrder.companyId || initialData?.companyId || (resultOrder as any).company_id;

            if (selectedFiles.length > 0 && resultOrder.id && finalCompanyId) {
                let progresses = new Array(selectedFiles.length).fill(0);
                const uploadPromises = selectedFiles.map((file, idx) => dataService.uploadOrderImage(finalCompanyId.toString(), resultOrder.id, file, (progress) => {
                    progresses[idx] = progress;
                    setUploadProgress(progresses.reduce((a,b) => a+b, 0) / selectedFiles.length);
                }));
                const uploadResults = await Promise.all(uploadPromises);
                const newFilenames = uploadResults.map(res => res.filename);
                const allFilenames = [...existingImages, ...newFilenames];
                await dataService.updateOrderFiles(resultOrder.id, allFilenames);
                if (uploadResults.length > 0) {
                    await dataService.updateOrderImage(resultOrder.id, uploadResults[0].path, uploadResults[0].filename);
                }
            }

            if (onSubmit) onSubmit(resultOrder);
            else onBack();
            return true;
        } catch (error: any) {
            console.error("Error processing OS", error);
            toast.error(error instanceof Error ? error.message : "Erro ao processar OS");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const selectedClient = clients.find(c => c.id === formData.clientId);
    const selectedUnit = units.find(u => u.id === formData.unitId);
    const selectedAsset = assetTags.find(a => a.id === formData.unitAssetTagId);

    const displayClient = selectedClient?.name || initialData?.clientName;
    const displayUnit = selectedUnit?.descriptionFull || selectedUnit?.description || initialData?.unitDescription || initialData?.unitName;
    const displayAsset = selectedAsset?.description ||
        (initialData?.assetTagDescription || initialData?.unitAssetTagDescription ?
            `${initialData.assetTagDescription || initialData.unitAssetTagDescription}${initialData.assetTagSubDescription || initialData.unitAssetTagSubDescription ? ` / ${initialData.assetTagSubDescription || initialData.unitAssetTagSubDescription}` : ''}`
            : undefined);
    const hasContextInfo = !!(displayClient || displayUnit);

    const alertsByAsset = useMemo(() => {
        const map = new Map<string, AssetAlert[]>();
        for (const alert of availableAlerts) {
            const key = alert.assetId || alert.id;
            const existing = map.get(key);
            if (existing) existing.push(alert);
            else map.set(key, [alert]);
        }
        return Array.from(map.values());
    }, [availableAlerts]);

    const isStep1Valid = !!(formData.orderTypeId && formData.priorityId && formData.requestedServices && formData.contractId && formData.orderTypeSubId && formData.orderObjectId && (hasContextInfo || (formData.clientId && formData.unitId)));

    const handleNext = () => {
        if (step === 1 && isStep1Valid) setStep(2);
        else if (step === 2) setStep(3);
        else if (step === 3) handleSubmit();
        else toast.error("Preencha os campos obrigatórios");
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
        else onBack();
    };

    const toggleAlertSelection = (alertId: string) => {
        const alert = availableAlerts.find(a => a.id === alertId);
        if (alert?.orderId && alert.orderId !== initialData?.id) {
            toast.warning(`Este alerta já está vinculado à OS ${alert.orderMask}`);
            return;
        }

        setSelectedAlertIds(prev =>
            prev.includes(alertId)
                ? prev.filter(id => id !== alertId)
                : [...prev, alertId]
        );
    };

    useImperativeHandle(ref, () => ({
        submit: async () => {
            if (isStep1Valid) {
                return await handleSubmit();
            } else {
                toast.error("Preencha todos os dados obrigatórios da OS");
                return false;
            }
        }
    }));

    return (
        <div className={`flex flex-col ${hideFooter ? '' : 'h-full'} bg-slate-100 dark:bg-[#0f172a] relative`}>
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 z-50 overflow-hidden">
                    {uploadProgress > 0 ? (
                        <div 
                            className="h-full bg-blue-500 transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                        />
                    ) : (
                        <div className="h-full bg-blue-500 animate-loading-bar" />
                    )}
                </div>
            )}

            <div className={`flex flex-col ${hideFooter ? '' : 'flex-1 overflow-hidden'} relative`}>
                <div className={`${hideFooter ? '' : 'flex-1 overflow-y-auto'} no-scrollbar ${hideFooter ? 'pb-0' : 'pb-6'}`}>
                    {showCardHeader && initialData && (initialData as Order).id ? (
                        <div className="relative w-full shrink-0 overflow-hidden bg-slate-50 dark:bg-[#0f172a] px-4 pt-6 pb-2">
                            <OrderCardDetail order={initialData as Order} noBorder={true} noShadow={true} />
                        </div>
                    ) : (
                        <div className="relative h-48 w-full shrink-0 overflow-hidden">
                            <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
                            <img src="/hero-bg.png" alt="Background" className="w-full h-full object-cover" />

                            {initialData && (
                                <div className={`absolute top-4 right-4 z-30 flex flex-col px-4 py-2.5 rounded-[16px] shadow-lg transform transition-transform animate-in slide-in-from-top-4 duration-500 min-w-[140px] text-white ${isEdit ? 'bg-indigo-600 shadow-indigo-900/20' : 'bg-rose-500 shadow-rose-900/20'}`}>
                                    <span className="text-[18px] font-black leading-none tracking-tight">{initialData.orderMask || (isEdit ? 'OS' : 'SS')}</span>
                                    <div className="flex justify-between items-center w-full mt-1">
                                        <span className="text-[9px] font-bold opacity-90 uppercase tracking-tighter">
                                            {isEdit ? 'OS' : 'SS'} {initialData.typeCode || 'N/I'}{initialData.typeSubCode ? `/${initialData.typeSubCode}` : ''}{initialData.objectCode ? `/${initialData.objectCode}` : ''}
                                        </span>
                                        <span className="text-[9px] font-black opacity-80">{initialData.priorityCode || 'AT'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="absolute bottom-5 left-5 right-5 z-20">
                                {hasContextInfo && (
                                    <div className="mb-4 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        {displayClient && <span className="text-xs font-bold text-slate-200 uppercase">{displayClient}</span>}
                                        <span className="text-xs font-bold text-slate-200 uppercase">{displayUnit}</span>
                                        {displayAsset && <span className="text-xs font-bold text-slate-200 uppercase">{displayAsset}</span>}
                                    </div>
                                )}

                                {!hideFooter && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black transition-colors ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/50'}`}>1</div>
                                        <div className={`w-5 h-0.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-white/20'}`} />
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black transition-colors ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/50'}`}>2</div>
                                        <div className={`w-5 h-0.5 rounded-full transition-colors ${step >= 3 ? 'bg-blue-600' : 'bg-white/20'}`} />
                                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black transition-colors ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/50'}`}>3</div>
                                    </div>
                                )}

                                <h2 className="text-2xl font-black text-white leading-none mt-2">
                                    {isEdit
                                        ? (step === 1 ? "Editar OS" : step === 2 ? "Alertas em Aberto" : "Evidências")
                                        : (step === 1 ? "Dados da OS" : step === 2 ? "Alertas em Aberto" : "Evidências")
                                    }
                                </h2>
                            </div>
                        </div>
                    )}

                    <div className={`px-4 pt-0 ${hideFooter ? 'pb-0' : 'pb-6'} space-y-4 animate-in slide-in-from-right-4 duration-300`}>
                        {(step === 1 || hideFooter) && (
                            <section className="space-y-4">
                                {!showCardHeader && (
                                    <Textarea
                                        label="Serviços a serem executados"
                                        required
                                        rows={4}
                                        value={formData.requestedServices}
                                        onChange={e => setFormData(prev => ({ ...prev, requestedServices: e.target.value }))}
                                        placeholder="Detalhamento do que deve ser executado..."
                                    />
                                )}

                                {!hasContextInfo && (
                                    <>
                                        <Select
                                            label="Cliente"
                                            required
                                            value={formData.clientId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                                            options={clients.map(c => ({ value: c.id, label: c.name }))}
                                        />
                                        <Select
                                            label="Unidade"
                                            required
                                            value={formData.unitId}
                                            disabled={!formData.clientId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, unitId: e.target.value }))}
                                            options={units.map(u => ({ value: u.id, label: u.descriptionFull || u.description }))}
                                        />
                                        <Select
                                            label="Setor > Posição"
                                            value={formData.unitAssetTagId}
                                            disabled={!formData.unitId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, unitAssetTagId: e.target.value }))}
                                            options={assetTags.map(s => ({ value: s.id, label: s.description }))}
                                        />
                                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />
                                    </>
                                )}

                                {hasContextInfo && (
                                    <Select
                                        label="Setor > Posição"
                                        value={formData.unitAssetTagId}
                                        disabled={!formData.unitId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, unitAssetTagId: e.target.value }))}
                                        options={assetTags.map(s => ({ value: s.id, label: s.description }))}
                                    />
                                )}

                                <Select
                                    label="Tipo OS"
                                    required
                                    value={formData.orderTypeId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, orderTypeId: e.target.value }))}
                                    options={orderTypes.map(t => ({ value: t.id, label: t.description }))}
                                />

                                <Select
                                    label="Sub-Tipo OS"
                                    required
                                    value={formData.orderTypeSubId}
                                    disabled={!formData.orderTypeId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, orderTypeSubId: e.target.value }))}
                                    options={orderSubTypes.map(st => ({ value: st.id, label: st.description }))}
                                />

                                <Select
                                    label="Prioridade"
                                    required
                                    value={formData.priorityId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, priorityId: e.target.value }))}
                                    options={priorities.map(p => ({ value: p.id, label: p.description }))}
                                />

                                <Select
                                    label="Finalidade"
                                    required
                                    value={formData.orderObjectId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, orderObjectId: e.target.value }))}
                                    options={orderObjects.map(o => ({ value: o.id, label: o.description }))}
                                />

                                <Select
                                    label="Contrato"
                                    required
                                    value={formData.contractId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, contractId: e.target.value }))}
                                    options={contracts.map(c => ({ value: c.id, label: c.description || c.code || 'S/N' }))}
                                />

                                <Select
                                    label="Plano"
                                    value={formData.orderPlanId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, orderPlanId: e.target.value }))}
                                    options={orderPlans.map(p => ({ value: p.id, label: p.description }))}
                                    placeholder="Nenhum plano selecionado"
                                />

                                {!hideFooter && (
                                    <div className="flex gap-4 py-4 pt-2">
                                        <Button
                                            variant="secondary"
                                            onClick={handlePrev}
                                            className="flex-1 text-slate-500 hover:bg-slate-300 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 shadow-sm min-h-[52px] rounded-2xl"
                                            disabled={isLoading}
                                        >
                                            Cancelar
                                        </Button>

                                        <Button
                                            onClick={handleNext}
                                            className={`flex-1 min-h-[52px] rounded-2xl ${!isStep1Valid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={!isStep1Valid || isLoading}
                                        >
                                            Próximo
                                        </Button>
                                    </div>
                                )}
                            </section>
                        )}

                        {(step === 2 && !hideFooter) && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {loadingAlerts
                                            ? 'Buscando alertas...'
                                            : availableAlerts.length === 0
                                                ? 'Nenhum alerta encontrado para este setor e tipo de OS'
                                                : `${availableAlerts.length} alerta(s) encontrado(s)`
                                        }
                                    </p>
                                </div>

                                {selectedAlertIds.length > 0 && (
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        {selectedAlertIds.length} selecionado(s)
                                    </span>
                                )}

                                {loadingAlerts ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : availableAlerts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">
                                            notifications_off
                                        </span>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Nenhum alerta em aberto para o setor e tipo de OS selecionados
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {alertsByAsset.map((group, idx) => (
                                            <OrderAlertCard
                                                key={group[0].assetId || idx}
                                                alerts={group}
                                                selectedIds={selectedAlertIds}
                                                onToggle={toggleAlertSelection}
                                                disabled={group.every(a => !!a.orderId && a.orderId !== initialData?.id)}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-4 py-4 pt-2">
                                    <Button
                                        variant="secondary"
                                        onClick={handlePrev}
                                        className="flex-1 text-slate-500 hover:bg-slate-300 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 shadow-sm min-h-[52px] rounded-2xl"
                                        disabled={isLoading}
                                    >
                                        Voltar
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        className="flex-1 min-h-[52px] rounded-2xl"
                                    >
                                        Próximo
                                    </Button>
                                </div>
                            </section>
                        )}

                        {(step === 3 && !hideFooter) && (
                            <section className="space-y-3">
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                    Adicione até 4 fotos para ajudar a equipe a identificar o problema (Opcional).
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    {existingImages.map((img, index) => {
                                        const folderPath = initialData?.imgFilePath || `companies/${initialData?.companyId}/orders/${initialData?.id}/images`;
                                        const imageUrl = dataService.getPublicImageUrl(folderPath, img);
                                        return (
                                            <div key={`ss-img-${index}`} className="relative group rounded-[12px] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-32 shadow-sm cursor-pointer" onClick={() => setExpandedImageUrl(imageUrl || null)}>
                                                <div className="absolute top-1.5 left-1.5 z-10 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">SS</div>
                                                <OptimizedImage src={imageUrl || ""} alt={`Evidence SS ${index + 1}`} preset="thumbnail" className="w-full h-full object-cover" />
                                                <button onClick={(e) => { e.stopPropagation(); removeExistingPhoto(index); }} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg z-20">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 px-2 backdrop-blur-[2px]">
                                                    <p className="text-[10px] text-white font-bold uppercase tracking-wider">FOTO {index + 1}</p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {previewUrls.map((url, index) => {
                                        const photoNumber = existingImages.length + index + 1;
                                        return (
                                            <div key={`new-img-${index}`} className="relative group rounded-[12px] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-32 shadow-sm cursor-pointer" onClick={() => setExpandedImageUrl(url)}>
                                                <div className="absolute top-1.5 left-1.5 z-10 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">NOVA</div>
                                                <OptimizedImage src={url} alt={`Evidence ${photoNumber}`} className="w-full h-full object-cover" preset="thumbnail" />

                                                <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 z-20">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removePhoto(index);
                                                        }}
                                                        className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingImage({ url, index });
                                                        }}
                                                        className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                </div>

                                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 px-2 backdrop-blur-[2px]">
                                                    <p className="text-[10px] text-white font-bold uppercase tracking-wider">FOTO {photoNumber}</p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {existingImages.length + previewUrls.length < 4 && (
                                        <div onClick={() => setIsPhotoActionOpen(true)} className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-[12px] h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-2xl group-hover:text-blue-500">add_a_photo</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Adicionar Foto</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 py-6 mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={handlePrev}
                                        className="flex-1 text-slate-500 hover:bg-slate-300 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 shadow-sm min-h-[52px] rounded-2xl"
                                        disabled={isLoading}
                                    >
                                        Voltar
                                    </Button>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 min-h-[52px] rounded-2xl"
                                    >
                                        {isLoading ? 'Enviando...' : 'Enviar'}
                                    </Button>
                                </div>
                            </section>
                        )}
                    </div>
                </div>

            </div>

            {expandedImageUrl && (
                <PhotoViewer src={expandedImageUrl || undefined} onClose={() => setExpandedImageUrl(null)} alt="Evidência da OS" />
            )}

            {isPhotoActionOpen && (
                <div className="fixed inset-0 z-150 bg-black/60 flex items-end justify-center animate-in fade-in" onClick={() => setIsPhotoActionOpen(false)}>
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[24px] p-6 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Anexar evidência</h3>
                        <div className="space-y-1">
                            <button className="w-full text-left py-4 px-4 text-lg font-semibold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl flex items-center gap-4 transition-colors"
                                onClick={() => { setIsPhotoActionOpen(false); handleAddPhotos(); }}>
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <span className="material-symbols-outlined">collections</span>
                                </div>
                                Galeria de Imagens
                            </button>
                            <button className="w-full text-left py-4 px-4 text-lg font-semibold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl flex items-center gap-4 transition-colors"
                                onClick={() => { setIsPhotoActionOpen(false); takeCameraPhoto(); }}>
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <span className="material-symbols-outlined">photo_camera</span>
                                </div>
                                Usar Câmera
                            </button>
                        </div>
                        <Button variant="ghost" className="w-full mt-4" onClick={() => setIsPhotoActionOpen(false)}>Cancelar</Button>
                    </div>
                </div>
            )}

            {editingImage && (
                <ImageEditorModal
                    isOpen={!!editingImage}
                    imageFile={editingImage?.url}
                    onClose={() => setEditingImage(null)}
                    onSave={handleSaveEditedImage}
                />
            )}
        </div>
    );
});

OrderRequestForm.displayName = 'OrderRequestForm';
