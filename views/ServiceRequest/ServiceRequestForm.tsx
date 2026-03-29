import React, { useState, useEffect } from 'react';
import { Client, Unit, OrderType, AssetTag, Order, Priority } from '../../types';
import { dataService } from '../../services/dataService';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import { PhotoViewer } from '../../components/ui/PhotoViewer';
import { ImageUploadSheet } from '../../components/ui/ImageUploadSheet';

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
}

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({ onBack, onSubmit, initialData, initialContext }) => {
    // State
    const [step, setStep] = useState(initialContext ? 2 : 1);
    const [clients, setClients] = useState<Client[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [assetTags, setAssetTags] = useState<AssetTag[]>([]);
    const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        clientId: initialData?.clientId || '',
        unitId: initialData?.unitId || '',
        unitAssetTagId: initialData?.unitAssetTagId || '',
        orderTypeId: initialData?.typeId || '',
        priorityId: initialData?.priorityId || '',
        requestedServices: initialData?.requestedServices || ''
    });

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
    const [isPhotoActionOpen, setIsPhotoActionOpen] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadLists = async () => {
            try {
                const [clientsList, typesList, prioritiesList] = await Promise.all([
                    dataService.getClients(),
                    dataService.getOrderTypes('active'),
                    dataService.getPriorities('active')
                ]);

                // Filter clients: only show those with company_id = 0 or null
                setClients(clientsList.filter(c => c.status === 'active' && (!c.companyId || c.companyId === '0')));
                setOrderTypes(typesList);
                setPriorities(prioritiesList);
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
        if (step === 1 && formData.unitId) { // Only reset if currently editing step 1 to avoid side effects if loading pre-filled data later
            setFormData(prev => ({ ...prev, unitId: '' }));
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
        if (step === 1 && formData.unitAssetTagId) {
            setFormData(prev => ({ ...prev, unitAssetTagId: '' }));
        }
    }, [formData.unitId]);

    const handleAddPhotos = async () => {
        if (selectedFiles.length >= 4) {
            toast.error("Máximo de 4 fotos permitido");
            return;
        }

        try {
            const result = await Camera.pickImages({
                quality: 80,
                limit: 4 - selectedFiles.length
            });

            if (result.photos.length > 0) {
                const newFiles: File[] = [];
                const newPreviews: string[] = [];

                const photosToTake = result.photos.slice(0, 4 - selectedFiles.length);

                for (const photo of photosToTake) {
                    if (photo.webPath) {
                        newPreviews.push(photo.webPath);
                        const response = await fetch(photo.webPath);
                        const blob = await response.blob();
                        const file = new File([blob], `ss_evidence_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${photo.format}`, { type: blob.type });
                        newFiles.push(file);
                    }
                }

                setPreviewUrls(prev => [...prev, ...newPreviews]);
                setSelectedFiles(prev => [...prev, ...newFiles]);
            }
        } catch (error) {
            console.error('Error picking images', error);
        }
    };

    const takeCameraPhoto = async () => {
        if (selectedFiles.length >= 4) {
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
                setPreviewUrls(prev => [...prev, image.webPath!]);
                const response = await fetch(image.webPath);
                const blob = await response.blob();
                const file = new File([blob], `ss_evidence_${Date.now()}.${image.format}`, { type: blob.type });
                setSelectedFiles(prev => [...prev, file]);
            }
        } catch (error) {
            console.error('Error taking photo', error);
        }
    };

    const removePhoto = (index: number) => {
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.clientId || !formData.unitId || !formData.orderTypeId || !formData.requestedServices) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setIsLoading(true);
        try {
            const newOrder: Partial<Order> = {
                clientId: formData.clientId,
                unitId: formData.unitId,
                typeId: formData.orderTypeId,
                priorityId: formData.priorityId || undefined,
                unitAssetTagId: formData.unitAssetTagId || undefined,
                requestedServices: formData.requestedServices,
            };

            const createdOrder = await dataService.createServiceRequest(newOrder);

            if (selectedFiles.length > 0 && createdOrder.id && createdOrder.companyId) {
                const uploadPromises = selectedFiles.map(file => dataService.uploadOrderImage(createdOrder.companyId!, createdOrder.id, file));
                const uploadResults = await Promise.all(uploadPromises);

                const filenames = uploadResults.map(res => res.filename);
                await dataService.updateOrderFiles(createdOrder.id, filenames);

                if (uploadResults.length > 0) {
                    await dataService.updateOrderImage(createdOrder.id, uploadResults[0].path, uploadResults[0].filename);
                }
            }

            toast.success("Solicitação enviada!");
            if (onSubmit) onSubmit(createdOrder);
            else onBack();

        } catch (error) {
            console.error("Error creating SS", error);
            toast.error("Erro ao enviar. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const isStep1Valid = !!(formData.clientId && formData.unitId);
    const isStep2Valid = !!(formData.orderTypeId && formData.requestedServices);

    const handleNext = () => {
        if (step === 1 && isStep1Valid) setStep(2);
        else if (step === 2 && isStep2Valid) setStep(3);
        else toast.error("Preencha os campos obrigatórios");
    };

    const handlePrev = () => {
        if (step > 1 && !initialContext) setStep(step - 1);
        else if (step > 2 && initialContext) setStep(step - 1);
        else onBack();
    };

    const isUnitDisabled = !formData.clientId;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f172a] relative">
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 z-50 overflow-hidden">
                    <div className="h-full bg-blue-500 animate-loading-bar" />
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex-1 overflow-y-auto no-scrollbar pb-6">

                    <div className="relative h-48 w-full shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-slate-900/60 z-10 transition-colors duration-500"
                            style={{ backgroundColor: step === 1 ? 'rgba(15, 23, 42, 0.6)' : step === 2 ? 'rgba(15, 23, 42, 0.7)' : 'rgba(15, 23, 42, 0.8)' }}
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

                            <span className="text-[10px] font-black tracking-widest text-white uppercase mb-1 flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>1</span>
                                <div className={`w-4 h-0.5 rounded ${step >= 2 ? 'bg-blue-500' : 'bg-white/20'}`} />
                                <span className={`px-1.5 py-0.5 rounded ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>2</span>
                                <div className={`w-4 h-0.5 rounded ${step >= 3 ? 'bg-blue-500' : 'bg-white/20'}`} />
                                <span className={`px-1.5 py-0.5 rounded ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>3</span>
                            </span>
                            <h2 className="text-2xl font-black text-white leading-none mt-2">
                                {step === 1 && "Localização"}
                                {step === 2 && "Detalhes do Serviço"}
                                {step === 3 && "Evidências"}
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
                                        onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                                        options={clients.map(c => ({ value: c.id, label: c.name }))}
                                        placeholder="Selecione o Cliente"
                                    />
                                    <Select
                                        label="Unidade"
                                        required
                                        value={formData.unitId}
                                        disabled={isUnitDisabled}
                                        onChange={(e) => setFormData(prev => ({ ...prev, unitId: e.target.value }))}
                                        options={units.map(u => ({ value: u.id, label: u.descriptionFull || u.description }))}
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
                                                options={assetTags.map(s => ({ value: s.id, label: s.description }))}
                                                placeholder={isSectorDisabled ? "Selecione a Unidade Primeiro" : "Selecione o Setor > Posição"}
                                            />
                                        );
                                    })()}
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
                                        options={orderTypes.map(t => ({ value: t.id, label: t.description }))}
                                        placeholder="Selecione o Tipo"
                                    />
                                    <Select
                                        label="Prioridade"
                                        value={formData.priorityId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priorityId: e.target.value }))}
                                        options={priorities.map(p => ({ value: p.id, label: p.description }))}
                                        placeholder="Selecione a Prioridade"
                                    />
                                    <Textarea
                                        label="Descrição do Problema"
                                        required
                                        rows={2}
                                        value={formData.requestedServices}
                                        onChange={e => setFormData(prev => ({ ...prev, requestedServices: e.target.value }))}
                                        placeholder="Descreva a necessidade com detalhes (Ex: ar condicionado pingando, lâmpada queimada...)"
                                    />
                                </div>
                            </section>
                        )}

                        {step === 3 && (
                            <section className="space-y-3">
                                <div className="flex flex-col gap-2 mb-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Adicione até 4 fotos para ajudar a equipe a identificar o problema.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative group rounded-[12px] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-32 shadow-sm cursor-pointer"
                                            onClick={() => setExpandedImageUrl(url)}
                                        >
                                            <OptimizedImage src={url} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" preset="thumbnail" />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removePhoto(index);
                                                }}
                                                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg z-20"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-1 px-2 backdrop-blur-[2px]">
                                                <p className="text-[9px] text-white font-bold uppercase tracking-wider">Foto {index + 1}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {previewUrls.length < 4 && (
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
                            </section>
                        )}
                    </div>

                    <div className="flex gap-3 px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] bg-white dark:bg-[#0f172a] border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom duration-300">
                        <Button
                            variant="secondary"
                            onClick={handlePrev}
                            className="flex-1 text-slate-500 hover:bg-slate-300 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 shadow-sm"
                            disabled={isLoading}
                        >
                            {step === 3 ? 'Voltar' : 'Cancelar'}
                        </Button>

                        {step < 3 ? (
                            <Button
                                onClick={handleNext}
                                className={`flex-1 ${(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                            >
                                Próximo
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                            >
                                {isLoading ? 'Enviando...' : 'Enviar'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {expandedImageUrl && (
                <PhotoViewer
                    src={expandedImageUrl}
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
        </div>
    );
};
