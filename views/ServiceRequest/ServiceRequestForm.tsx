import React, { useState, useEffect } from 'react';
import { Client, Unit, OrderType, AssetTag, Order, Priority, User } from '../../types';
import { dataService } from '../../services/dataService';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { PhotoViewer } from '../../components/ui/PhotoViewer';
import { ImageUploadSheet } from '../../components/ui/ImageUploadSheet';
import { ImageEditorModal } from '../../components/ui/ImageEditorModal';
import { DuplicateServiceRequestWarning } from '../../components/serviceRequests/DuplicateServiceRequestWarning';

interface ServiceRequestFormProps {
    onBack: () => void;
    onSubmit?: (data: any) => void;
    initialData?: Partial<Order>;
    initialContext?: {
        clientName?: string;
        unitDescription?: string;
        assetTagDescription?: string;
        companyLogo?: string | null;
    };
    onSelectOrder?: (order: Order) => void;
}

type InitialOrderData = Partial<Order> & Record<string, any>;

const toFormValue = (value: unknown) => value == null ? '' : String(value);

const getInitialFormData = (initialData?: InitialOrderData) => ({
    clientId: toFormValue(initialData?.clientId ?? initialData?.client_id),
    unitId: toFormValue(initialData?.unitId ?? initialData?.unit_id),
    unitAssetTagId: toFormValue(initialData?.unitAssetTagId ?? initialData?.unit_asset_tag_id),
    orderTypeId: toFormValue(initialData?.typeId ?? initialData?.type_id ?? initialData?.orderTypeId ?? initialData?.order_type_id),
    priorityId: toFormValue(initialData?.priorityId ?? initialData?.priority_id),
    requestedServices: toFormValue(initialData?.requestedServices ?? initialData?.requested_services)
});

const withSelectedOption = (
    options: { value: string; label: string }[],
    value?: string,
    fallbackLabel?: string
) => {
    if (!value || options.some(option => option.value === value)) return options;
    return [{ value, label: fallbackLabel || value }, ...options];
};

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({ onBack, onSubmit, initialData, initialContext, onSelectOrder }) => {
    // State
    const [step, setStep] = useState(initialContext ? 2 : 1);
    const [clients, setClients] = useState<Client[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
    const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [loadingDuplicates, setLoadingDuplicates] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Form State
    const [formData, setFormData] = useState(() => getInitialFormData(initialData as InitialOrderData | undefined));

    useEffect(() => {
        setFormData(getInitialFormData(initialData as InitialOrderData | undefined));
        setStep(initialContext ? 2 : 1);
    }, [initialData?.id, initialContext]);

    type PhotoItem = { file: File | null; url: string; filename: string | null };
    const [photos, setPhotos] = useState<PhotoItem[]>(() => {
        if (!initialData) return [];
        let files = initialData.imgFilesNames || (initialData as any).img_files_names || initialData.images;
        if (typeof files === 'string') {
            try {
                if (files.startsWith('[')) files = JSON.parse(files);
                else files = files.split(',').map(s => s.trim());
            } catch(e) {
                files = files.replace(/[{}]/g, '').split(',').map(s => s.trim().replace(/"/g, ''));
            }
        }
        if (!files || !Array.isArray(files) || files.length === 0) return [];
        
        const folderPath = initialData.imgFilePath || (initialData.companyId && initialData.id ? `companies/${initialData.companyId}/orders/${initialData.id}/images` : null);
        if (!folderPath) return [];

        return files.map(filename => ({
            file: null,
            filename: filename,
            url: dataService.getPublicImageUrl(folderPath, filename, { width: 400, height: 400, resize: 'cover' }) || ''
        })).filter(p => p.url !== '');
    });
    const [isLoading, setIsLoading] = useState(false);
    const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
    const [isPhotoActionOpen, setIsPhotoActionOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<{ url: string | File; index: number | null } | null>(null);

    // Load initial data
    useEffect(() => {
        const loadLists = async () => {
            try {
                const [clientsList, typesList, prioritiesList, user] = await Promise.all([
                    dataService.getClients(),
                    dataService.getOrderTypes('active'),
                    dataService.getPriorities('active'),
                    dataService.getCurrentUser()
                ]);

                // Filter clients: only show those with company_id = 0 or null
                setClients(clientsList.filter(c => c.status === 'active' && (!c.companyId || c.companyId === '0')));
                setOrderTypes(typesList);
                setPriorities(prioritiesList);
                if (user) setCurrentUser(user);
            } catch (err) {
                console.error("Error loading lists", err);
                toast.error("Erro ao carregar listas");
            }
        };

        loadLists();
    }, []);

    // Load Units when Client changes
    useEffect(() => {
        if (formData.clientId) {
            const loadUnits = async () => {
                try {
                    const clientUnits = await dataService.getUnitsByClient(formData.clientId);
                    setUnits(clientUnits);
                } catch (err) {
                    console.error("Error loading units", err);
                    setUnits([]);
                }
            };
            loadUnits();
        } else {
            setUnits([]);
        }
    }, [formData.clientId]);

    // Load AssetTags when Unit changes
    useEffect(() => {
        if (formData.unitId) {
            const loadAssetTags = async () => {
                try {
                    const unitAssetTags = await dataService.getUnitsAssetsByUnit(formData.unitId);
                    setAssetTags(unitAssetTags);
                } catch (err) {
                    console.error("Error loading asset tags", err);
                    setAssetTags([]);
                }
            };
            loadAssetTags();
        } else {
            setAssetTags([]);
        }
    }, [formData.unitId]);

    const handleAddPhotos = async () => {
        if (photos.length >= 4) {
            toast.error("Máximo de 4 fotos permitido");
            return;
        }

        try {
            const result = await Camera.pickImages({
                quality: 80,
                limit: 1 // Sequential editing for better UX
            });

            if (result.photos.length > 0) {
                const photo = result.photos[0];
                if (photo.webPath) {
                    const response = await fetch(photo.webPath);
                    const blob = await response.blob();
                    const file = new File([blob], `ss_evidence_${Date.now()}.${photo.format}`, { type: blob.type });
                    setEditingImage({ url: file, index: null });
                }
            }
        } catch (error) {
            console.error('Error picking images', error);
        }
    };

    const takeCameraPhoto = async () => {
        if (photos.length >= 4) {
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
                const file = new File([blob], `ss_evidence_${Date.now()}.${image.format}`, { type: blob.type });
                setEditingImage({ url: file, index: null });
            }
        } catch (error) {
            console.error('Error taking photo', error);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveEditedImage = (editedFile: File) => {
        if (!editingImage) return;

        const newUrl = URL.createObjectURL(editedFile);

        if (editingImage.index !== null) {
            // Editing existing
            setPhotos(prev => {
                const next = [...prev];
                next[editingImage.index!] = { file: editedFile, url: newUrl, filename: null };
                return next;
            });
        } else {
            // New photo
            setPhotos(prev => [...prev, { file: editedFile, url: newUrl, filename: null }]);
        }

        setEditingImage(null);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.clientId || !formData.unitId || !formData.orderTypeId || !formData.requestedServices) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        if (formData.requestedServices.trim().length < 10) {
            toast.error("A descrição do problema deve ter pelo menos 10 caracteres");
            return;
        }

        setIsLoading(true);
        try {
            const orderPayload: Partial<Order> = {
                clientId: formData.clientId,
                unitId: formData.unitId,
                typeId: formData.orderTypeId,
                priorityId: formData.priorityId || undefined,
                unitAssetTagId: formData.unitAssetTagId || undefined,
                requestedServices: formData.requestedServices,
            };

            let savedOrder: Order;
            
            if (initialData?.id) {
                savedOrder = await dataService.updateOrder(initialData.id, orderPayload);
                toast.success("Solicitação atualizada com sucesso!");
            } else {
                savedOrder = await dataService.createServiceRequest(orderPayload);
                toast.success("Solicitação enviada!");
            }

            if (photos.length >= 0 && savedOrder.id && savedOrder.companyId) {
                // Determine new files and keep old filenames
                const newPhotos = photos.filter(p => p.file !== null);
                const keptFilenames = photos.filter(p => p.filename !== null).map(p => p.filename as string);

                const uploadPromises = newPhotos.map(p => dataService.uploadOrderImage(savedOrder.companyId!, savedOrder.id, p.file!));
                const uploadResults = await Promise.all(uploadPromises);

                const finalFilenames = [...keptFilenames, ...uploadResults.map(res => res.filename)];
                
                await dataService.updateOrderFiles(savedOrder.id, finalFilenames);

                if (finalFilenames.length > 0) {
                    const heroFolderPath = `companies/${savedOrder.companyId}/orders/${savedOrder.id}/images`;
                    await dataService.updateOrderImage(savedOrder.id, heroFolderPath, finalFilenames[0]);
                } else {
                    await dataService.updateOrderImage(savedOrder.id, '', '');
                }
            }

            // Ensure we have the latest data (with all joins and images) before returning to detail screen
            const refreshed = await dataService.getOrderById(savedOrder.id);
            if (refreshed) savedOrder = refreshed;

            if (onSubmit) onSubmit(savedOrder);
            else onBack();

        } catch (error) {
            console.error("Error saving SS", error);
            toast.error("Erro ao salvar. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const isStep1Valid = !!(formData.clientId && formData.unitId);
    const isStep2Valid = !!(formData.orderTypeId && formData.requestedServices && formData.requestedServices.trim().length >= 10);

    const handleNext = async () => {
        if (step === 1 && isStep1Valid) {
            setStep(2);
        } else if (step === 2 && isStep2Valid) {
            if (initialData?.id) {
                // Edit mode - skip duplicate check (step 3)
                setStep(4);
                return;
            }
            setLoadingDuplicates(true);
            try {
                const selectedAssetTag = assetTags.find(a => a.id === formData.unitAssetTagId);
                const selectedAssetTagId = selectedAssetTag?.asset_tag_id?.toString() || '';
                const selectedAssetTagSubId = selectedAssetTag?.asset_tag_sub_id?.toString() || null;

                const result = await dataService.getOrdersFilters({
                    parentId: null,
                    unitId: formData.unitId,
                    unitAssetTagId: formData.unitAssetTagId,
                    orderTypeId: formData.orderTypeId,
                    assetTagId: selectedAssetTagId,
                    assetTagSubId: selectedAssetTagSubId,
                    useGeneralView: false,
                    pageSize: 1
                });
                setStep(result.data.length > 0 ? 3 : 4);
            } catch (error) {
                console.error('Erro ao verificar duplicatas:', error);
                setStep(4);
            } finally {
                setLoadingDuplicates(false);
            }
        } else if (step === 3) {
            setStep(4);
        } else {
            toast.error("Preencha os campos obrigatórios");
        }
    };

    const handlePrev = () => {
        if (step > 1 && !initialContext) {
            if (initialData?.id && step === 4) {
                // Edit mode - skip step 3 when going back
                setStep(2);
            } else {
                setStep(step - 1);
            }
        } else if (step > 2 && initialContext) setStep(step - 1);
        else onBack();
    };

    const isUnitDisabled = !formData.clientId;
    const initialOrder = initialData as InitialOrderData | undefined;
    const clientOptions = withSelectedOption(
        clients.map(c => ({ value: c.id, label: c.name })),
        formData.clientId,
        initialOrder?.clientName ?? initialOrder?.client_name
    );
    const unitOptions = withSelectedOption(
        units.map(u => ({ value: u.id, label: u.descriptionFull || u.description })),
        formData.unitId,
        initialOrder?.unitDescriptionFull ?? initialOrder?.description_full ?? initialOrder?.unitDescription ?? initialOrder?.unit_description
    );
    const assetTagOptions = withSelectedOption(
        assetTags.map(s => ({ value: s.id, label: s.description })),
        formData.unitAssetTagId,
        initialOrder?.unitAssetTagDescription ?? initialOrder?.unit_asset_tag_description ?? initialOrder?.assetTagDescription ?? initialOrder?.asset_tag_description
    );
    const orderTypeOptions = withSelectedOption(
        orderTypes.map(t => ({ value: t.id, label: t.description })),
        formData.orderTypeId,
        initialOrder?.typeDescription ?? initialOrder?.type_description
    );
    const priorityOptions = withSelectedOption(
        priorities.map(p => ({ value: p.id, label: p.description })),
        formData.priorityId,
        initialOrder?.priorityDescription ?? initialOrder?.priority_description
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f172a] relative">
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 z-50 overflow-hidden">
                    <div className="h-full bg-blue-500 animate-loading-bar" />
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex-1 overflow-y-auto no-scrollbar">

                    <div className="relative h-48 w-full shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-slate-900/60 z-10 transition-colors duration-500"
                            style={{ backgroundColor: step === 1 ? 'rgba(15, 23, 42, 0.6)' : step === 2 ? 'rgba(15, 23, 42, 0.7)' : step === 3 ? 'rgba(15, 23, 42, 0.75)' : 'rgba(15, 23, 42, 0.8)' }}
                        ></div>
                        <img
                            src="/hero-bg.png"
                            alt="Background"
                            className="w-full h-full object-cover transition-transform duration-700 ease-out"
                            style={{ transform: `scale(${1 + step * 0.05})` }}
                        />

                        <div className="absolute bottom-5 left-4 right-4 z-20">
                            {step > 1 && !initialContext && (
                                <div className="mb-3 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <span className="text-xs font-bold text-slate-200">
                                        {clients.find(c => c.id === formData.clientId)?.name}
                                    </span>
                                    <span className="text-xs font-bold text-slate-200">
                                        {units.find(u => u.id === formData.unitId)?.descriptionFull || units.find(u => u.clientId === formData.clientId)?.description}
                                    </span>
                                    {formData.unitAssetTagId && (
                                        <span className="text-xs font-bold text-slate-200">
                                            {assetTags.find(s => s.id === formData.unitAssetTagId)?.description}
                                        </span>
                                    )}
                                </div>
                            )}

                            {initialContext && (
                                <div className="mb-3 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <span className="text-xs font-black text-slate-100 uppercase tracking-tight">
                                        {initialContext.clientName}
                                    </span>
                                    <span className="text-xs font-black text-slate-100 uppercase tracking-tight">
                                        {initialContext.unitDescription}
                                    </span>
                                    <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                                        {initialContext.assetTagDescription}
                                    </span>
                                </div>
                            )}

                            <span className="text-[10px] font-black tracking-widest text-white uppercase mb-1 flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>1</span>
                                <div className={`w-3 h-0.5 rounded ${step >= 2 ? 'bg-blue-500' : 'bg-white/20'}`} />
                                <span className={`px-1.5 py-0.5 rounded ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>2</span>
                                <div className={`w-3 h-0.5 rounded ${step >= 3 ? 'bg-blue-500' : 'bg-white/20'}`} />
                                <span className={`px-1.5 py-0.5 rounded ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>3</span>
                                <div className={`w-3 h-0.5 rounded ${step >= 4 ? 'bg-blue-500' : 'bg-white/20'}`} />
                                <span className={`px-1.5 py-0.5 rounded ${step >= 4 ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>4</span>
                            </span>
                            <h2 className="text-2xl font-black text-white leading-none mt-2">
                                {step === 1 && "Localização"}
                                {step === 2 && "Detalhes do Serviço"}
                                {step === 3 && "Verificação"}
                                {step === 4 && "Evidências"}
                            </h2>
                        </div>
                    </div>

                    <div className="px-4 py-4 space-y-5 animate-in slide-in-from-right-4 duration-300">
                        {step === 1 && (
                            <section className="space-y-5">
                                <div className="space-y-4">
                                    <Select
                                        label="Cliente"
                                        required
                                        value={formData.clientId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value, unitId: '', unitAssetTagId: '' }))}
                                        options={clientOptions}
                                        placeholder="Selecione o Cliente"
                                    />
                                    <Select
                                        label="Unidade"
                                        required
                                        value={formData.unitId}
                                        disabled={isUnitDisabled}
                                        onChange={(e) => setFormData(prev => ({ ...prev, unitId: e.target.value, unitAssetTagId: '' }))}
                                        options={unitOptions}
                                        placeholder={isUnitDisabled ? "Selecione o Cliente Primeiro" : "Selecione a Unidade"}
                                    />
                                    {(() => {
                                        const isSectorDisabled = !formData.unitId;
                                        return (
                                            <Select
                                                label="Setor > Posição"
                                                value={formData.unitAssetTagId}
                                                disabled={isSectorDisabled}
                                                onChange={(e) => setFormData(prev => ({ ...prev, unitAssetTagId: e.target.value }))}
                                                options={assetTagOptions}
                                                placeholder={isSectorDisabled ? "Selecione a Unidade Primeiro" : "Selecione o Setor > Posição"}
                                            />
                                        );
                                    })()}
                                </div>

                                <div className="flex gap-4 py-4">
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
                                        disabled={!isStep1Valid}
                                    >
                                        Próximo
                                    </Button>
                                </div>
                            </section>
                        )}

                        {step === 2 && (
                            <section className="space-y-5">
                                <div className="space-y-4">
                                    <Select
                                        label="Tipo de OS"
                                        required
                                        value={formData.orderTypeId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, orderTypeId: e.target.value }))}
                                        options={orderTypeOptions}
                                        placeholder="Selecione o Tipo"
                                    />
                                    <Select
                                        label="Prioridade"
                                        value={formData.priorityId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priorityId: e.target.value }))}
                                        options={priorityOptions}
                                        placeholder="Selecione a Prioridade"
                                    />
                                    <Textarea
                                        label="Descrição do Problema"
                                        required
                                        rows={2}
                                        value={formData.requestedServices}
                                        onChange={e => setFormData(prev => ({ ...prev, requestedServices: e.target.value }))}
                                        placeholder="Ex.: Realizar vistoria, GMB01: Painel nao liga ..."
                                        error={formData.requestedServices.length > 0 && formData.requestedServices.trim().length < 10 ? "Mínimo de 10 caracteres" : ""}
                                    />
                                </div>

                                <div className="flex gap-4 py-4">
                                    <Button
                                        variant="secondary"
                                        onClick={handlePrev}
                                        className="flex-1 text-slate-500 hover:bg-slate-300 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 shadow-sm min-h-[52px] rounded-2xl"
                                        disabled={isLoading || loadingDuplicates}
                                    >
                                        Cancelar
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        className={`flex-1 min-h-[52px] rounded-2xl ${!isStep2Valid || loadingDuplicates ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!isStep2Valid || loadingDuplicates}
                                    >
                                        {loadingDuplicates ? 'Verificando...' : 'Próximo'}
                                    </Button>
                                </div>
                            </section>
                        )}

                        {step === 3 && (
                            <DuplicateServiceRequestWarning
                                unitId={formData.unitId}
                                unitAssetTagId={formData.unitAssetTagId}
                                typeId={formData.orderTypeId}
                                assetTagId={assetTags.find(a => a.id === formData.unitAssetTagId)?.asset_tag_id?.toString() || ''}
                                assetTagSubId={assetTags.find(a => a.id === formData.unitAssetTagId)?.asset_tag_sub_id?.toString() || null}
                                onContinue={() => setStep(4)}
                                onCancel={() => setStep(2)}
                                onSelectOrder={onSelectOrder}
                                currentUser={currentUser}
                            />
                        )}

                        {step === 4 && (
                            <section className="space-y-3">
                                <div className="flex flex-col gap-2 mb-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Adicione até 4 fotos para ajudar a equipe a identificar o problema.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {photos.map((photo, index) => (
                                        <div
                                            key={index}
                                            className="relative aspect-video rounded-[14px] overflow-hidden group cursor-pointer shadow-sm min-h-[140px] bg-slate-900 border border-slate-200 dark:border-white/10"
                                            onClick={() => setExpandedImageUrl(photo.url)}
                                        >
                                            <img
                                                src={photo.url}
                                                alt={`Evidência ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            
                                            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 z-20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removePhoto(index);
                                                    }}
                                                    className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingImage({ url: photo.url, index });
                                                    }}
                                                    className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 px-2 backdrop-blur-[2px]">
                                                <p className="text-[9px] text-white font-bold uppercase tracking-wider">Foto {index + 1}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {photos.length < 4 && (
                                        <div
                                            onClick={() => setIsPhotoActionOpen(true)}
                                            className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-[12px] h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group relative overflow-hidden"
                                        >
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
                                        {isLoading ? 'Salvando...' : (initialData?.id ? 'Salvar Edição' : 'Enviar')}
                                    </Button>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {expandedImageUrl && (
                <PhotoViewer
                    src={expandedImageUrl || undefined}
                    onClose={() => setExpandedImageUrl(null)}
                    alt="Evidência da Solicitação"
                />
            )}

            <ImageUploadSheet
                isOpen={isPhotoActionOpen}
                onClose={() => setIsPhotoActionOpen(false)}
                onSelectGallery={handleAddPhotos}
                onTakeCamera={takeCameraPhoto}
                title="Foto evidência"
            />

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
};
