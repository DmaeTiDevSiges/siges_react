
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Asset, Client, Unit, AssetStatus, AssetTag, AssetTagSub, AssetType, AssetAttribute } from '../../types';
import { dataService } from '../../services/dataService';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { Avatar } from '../../components/ui/Avatar';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { DynamicField } from '../../components/ui/DynamicField';
import { ImageUploadSheet } from '../../components/ui/ImageUploadSheet';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { usePermissions } from '../../contexts/PermissionsContext';
import { ImageEditorModal } from '../../components/ui/ImageEditorModal';


interface AssetFormProps {
    initialAsset?: Asset;
    isDuplicate?: boolean;
    onSave: (asset: Partial<Asset>, attributeValues: Record<string, string>, file?: File, onProgress?: (progress: number) => void) => Promise<void>;
    onCancel: () => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({ initialAsset, isDuplicate, onSave, onCancel }) => {
    const { canCreate, canEdit } = usePermissions();
    const isEdit = !!initialAsset && !isDuplicate;
    const hasAccess = isEdit ? canEdit('assets') : canCreate('assets');

    const [formData, setFormData] = useState<Partial<Asset>>(() => ({
        description: '',
        code: '',
        clientId: '',
        unitId: '',
        statusId: '',
        statusAt: '',
        tagId: '',
        tagSubId: '',
        unitAssetTagId: '',
        comments: '',
        brand: '',
        model: '',
        serial: '',
        location: '',
        acquisitionAt: '',
        typeId: '',
        // Specialized fields
        power: undefined,
        powerUnit: 'kW',
        voltage: '',
        voltageUnit: 'V',
        amperage: '',
        poles: undefined,
        rotation: undefined,
        rotationUnit: 'RPM',
        serviceFactor: undefined,
        rotorDiameter: undefined,
        rotorDiameterUnit: 'mm',
        flowRateMax: undefined,
        flowRateMin: undefined,
        flowRateOperation: undefined,
        flowRateUnit: 'm³/h',
        pressureMax: undefined,
        pressureMin: undefined,
        pressureOperation: undefined,
        pressureUnit: 'mca',
        weight: undefined,
        weightUnit: 'kg',
        ...initialAsset,
        ...(isDuplicate ? { id: undefined, code: '', serial: '', imgFilePath: undefined, imgFileName: undefined } : {})
    }));

    // ... (rest of the state)


    const [clients, setClients] = useState<Client[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [statuses, setStatuses] = useState<AssetStatus[]>([]);
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [tags, setTags] = useState<AssetTag[]>([]);
    const [unitTags, setUnitTags] = useState<AssetTag[]>([]);
    const [tagSubs, setTagSubs] = useState<AssetTagSub[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(
        initialAsset && !isDuplicate ? dataService.getPublicImageUrl(initialAsset.imgFilePath, initialAsset.imgFileName, { width: 400, height: 400, resize: 'contain' }) : null
    );
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isPhotoSheetOpen, setIsPhotoSheetOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Dynamic attributes state
    const [attributes, setAttributes] = useState<AssetAttribute[]>([]);
    const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (initialAsset) {
            setFormData(prev => ({
                ...prev,
                ...initialAsset,
                description: initialAsset.description || '',
                typeId: initialAsset.typeId || '',
                clientId: initialAsset.clientId || '',
                unitId: initialAsset.unitId || '',
                statusId: initialAsset.statusId || '',
                tagId: initialAsset.tagId || '',
                tagSubId: initialAsset.tagSubId || '',
                unitAssetTagId: initialAsset.unitAssetTagId || '',
                acquisitionAt: initialAsset.acquisitionAt || '',
                statusAt: initialAsset.statusAt || '',
                brand: initialAsset.brand || '',
                model: initialAsset.model || '',
                serial: initialAsset.serial || '',
                location: initialAsset.location || '',
                comments: initialAsset.comments || '',
                // Ensure specialized fields are mapped
                power: initialAsset.power,
                powerUnit: initialAsset.powerUnit || 'kW',
                voltage: initialAsset.voltage || '',
                amperage: initialAsset.amperage || '',
                poles: initialAsset.poles,
                rotation: initialAsset.rotation,
                rotationUnit: initialAsset.rotationUnit || 'RPM',
                serviceFactor: initialAsset.serviceFactor,
                rotorDiameter: initialAsset.rotorDiameter,
                rotorDiameterUnit: initialAsset.rotorDiameterUnit || 'mm',
                flowRateMax: initialAsset.flowRateMax,
                flowRateMin: initialAsset.flowRateMin,
                flowRateOperation: initialAsset.flowRateOperation,
                flowRateUnit: initialAsset.flowRateUnit || 'm³/h',
                pressureMax: initialAsset.pressureMax,
                pressureMin: initialAsset.pressureMin,
                pressureOperation: initialAsset.pressureOperation,
                pressureUnit: initialAsset.pressureUnit || 'mca',
                weight: initialAsset.weight,
                weightUnit: initialAsset.weightUnit || 'kg',
                ...(isDuplicate ? {
                    id: undefined,
                    code: '',
                    serial: '',
                    imgFilePath: undefined,
                    imgFileName: undefined
                } : {})
            }));
        }
    }, [initialAsset, isDuplicate]);

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const [clientsList, statusesList, typesList] = await Promise.all([
                    dataService.getClients(),
                    dataService.getAssetStatuses(),
                    dataService.getAssetTypes()
                ]);
                setClients(clientsList);
                setStatuses(statusesList);
                setAssetTypes(typesList);

                if (initialAsset?.clientId) {
                    const unitsList = await dataService.getUnitsByClient(initialAsset.clientId);
                    setUnits(unitsList);
                } else {
                    setUnits([]);
                }

                if (initialAsset?.unitId && initialAsset.unitId !== 'null') {
                    const unitTagsList = await dataService.getAssetTagsByUnit(initialAsset.unitId);
                    setUnitTags(unitTagsList);
                } else {
                    setUnitTags([]);
                }

                if (initialAsset?.tagId && initialAsset.tagId !== 'null') {
                    const subsList = await dataService.getAssetTagSubs(initialAsset.tagId);
                    setTagSubs(subsList);
                } else {
                    setTagSubs([]);
                }
            } catch (error) {
                console.error('Error fetching asset form lists:', error);
            }
        };
        fetchLists();
    }, [initialAsset]);



    const handleClientChange = async (clientId: string) => {
        setFormData(prev => ({ ...prev, clientId, unitId: '', tagId: '', tagSubId: '' }));
        setUnitTags([]);
        setTagSubs([]);
        if (clientId) {
            const unitsList = await dataService.getUnitsByClient(clientId);
            setUnits(unitsList);
        } else {
            setUnits([]);
        }
    };

    const handleUnitChange = async (unitId: string) => {
        const cleanUnitId = (unitId === 'null' || !unitId) ? '' : unitId;

        setFormData(prev => ({ ...prev, unitId: cleanUnitId, tagId: '', tagSubId: '' }));
        setTagSubs([]);

        if (cleanUnitId) {
            const tagsList = await dataService.getAssetTagsByUnit(cleanUnitId);
            setUnitTags(tagsList);
        } else {
            setUnitTags([]);
        }
    };

    // Lógica de bloqueio hierárquico refinada
    const isUnitDisabled = !formData.clientId || formData.clientId === '' || formData.clientId === 'null';
    const isTagDisabled = isUnitDisabled || !formData.unitId || formData.unitId === '' || formData.unitId === 'null';

    const handleTagChange = (unitTagId: string) => {
        const selectedTag = unitTags.find(t => t.id === unitTagId);
        if (selectedTag) {
            setFormData(prev => ({
                ...prev,
                unitAssetTagId: unitTagId,
                tagId: (selectedTag as any).asset_tag_id?.toString() || '',
                tagSubId: (selectedTag as any).asset_tag_sub_id?.toString() || ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                unitAssetTagId: '',
                tagId: '',
                tagSubId: ''
            }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const takePhoto = async (source: CameraSource) => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: source
            });

            if (image.webPath) {
                setImagePreview(image.webPath);

                let blob: Blob;
                try {
                    const response = await fetch(image.webPath);
                    blob = await response.blob();
                } catch (fetchError) {
                    console.warn('Fetch falhou no webPath, tentando ler via Filesystem:', image.webPath);
                    if (image.path) {
                        const { Filesystem } = await import('@capacitor/filesystem');
                        const fileData = await Filesystem.readFile({
                            path: image.path
                        });
                        const responseRaw = await fetch(`data:image/${image.format};base64,${fileData.data}`);
                        blob = await responseRaw.blob();
                    } else {
                        throw new Error('Não foi possível ler o arquivo da foto');
                    }
                }

                const file = new File([blob], `asset_image_${Date.now()}.${image.format}`, { type: blob.type || `image/${image.format}` });
                setImageFile(file);
            }
        } catch (error) {
            console.error('Error taking photo', error);
        } finally {
            setIsPhotoSheetOpen(false);
        }
    };

    const handleSaveEditedImage = (editedFile: File) => {
        const newUrl = URL.createObjectURL(editedFile);
        setImagePreview(newUrl);
        setImageFile(editedFile);
        setIsEditing(false);
    };

    useEffect(() => {
        if (assetTypes.length === 0) {
            console.log('AssetForm: assetTypes is empty, skipping auto-desc');
            return;
        }

        const selectedType = assetTypes.find(t => t.id === formData.typeId);
        if (!selectedType) {
            console.log('AssetForm: typeId not selected, skipping auto-desc');
            return;
        }

        const pattern = selectedType.namingPattern || '{type} {brand} {model}';
        console.log('AssetForm: Using pattern:', pattern);

        // Context for replacement
        const context: Record<string, string> = {
            type: selectedType.description || '',
            brand: formData.brand || '',
            model: formData.model || '',
            code: formData.code || '',
            serial: formData.serial || '',
            ...attributeValues
        };

        let generatedDesc = pattern;

        // Replace standard fields (Case insensitive for UX)
        generatedDesc = generatedDesc.replace(/\{type\}/gi, context.type);
        generatedDesc = generatedDesc.replace(/\{brand\}/gi, context.brand);
        generatedDesc = generatedDesc.replace(/\{model\}/gi, context.model);
        generatedDesc = generatedDesc.replace(/\{code\}/gi, context.code);
        generatedDesc = generatedDesc.replace(/\{serial\}/gi, context.serial);

        // Replace dynamic attributes
        attributes.forEach(attr => {
            const val = attributeValues[attr.fieldKey];
            if (val) {
                const valStr = attr.dataType === 'boolean' ? (val === 'true' ? 'SIM' : 'NÃO') : val;
                const display = attr.unit ? `${valStr}${attr.unit}` : valStr;
                const regex = new RegExp(`\\{${attr.fieldKey}\\}`, 'gi');
                generatedDesc = generatedDesc.replace(regex, display);
            } else {
                const regex = new RegExp(`\\{${attr.fieldKey}\\}`, 'gi');
                generatedDesc = generatedDesc.replace(regex, '');
            }
        });

        // Clean up double spaces and trailing separators
        generatedDesc = generatedDesc.replace(/\s+/g, ' ').trim();
        console.log('AssetForm: Generated:', generatedDesc);

        if (!generatedDesc) return;

        // SE o ativo é novo OU se a descrição atual está vazia OU se o usuário está mudando campos chave
        // Vamos atualizar a descrição para refletir o padrão.
        setFormData(prev => {
            // Só atualizamos se a descrição gerada for diferente da atual
            if (prev.description !== generatedDesc) {
                console.log('AssetForm: Syncing description to:', generatedDesc);
                return { ...prev, description: generatedDesc };
            }
            return prev;
        });
    }, [formData.typeId, formData.brand, formData.model, formData.code, attributeValues, assetTypes, attributes]);

    // Load dynamic attributes when typeId changes
    useEffect(() => {
        const loadAttributes = async () => {
            if (!formData.typeId) {
                setAttributes([]);
                setAttributeValues({});
                return;
            }

            try {
                console.log('Loading attributes for typeId:', formData.typeId);
                const attrs = await dataService.getAssetAttributesByType(formData.typeId);
                console.log('Fetched attributes:', attrs);
                setAttributes(attrs);

                // Load existing values if editing
                if (initialAsset?.id) {
                    console.log('Loading values for assetId:', initialAsset.id);
                    const values = await dataService.getAssetAttributeValues(initialAsset.id);
                    console.log('Fetched values:', values);
                    setAttributeValues(values);
                } else {
                    setAttributeValues({});
                }
            } catch (error) {
                console.error('Error loading asset attributes:', error);
                setAttributes([]);
                setAttributeValues({});
            }
        };

        loadAttributes();
    }, [formData.typeId, initialAsset?.id]);

    const handleTypeChange = (typeId: string) => {
        setFormData(prev => ({
            ...prev,
            typeId
        }));
        // Clear attribute values when type changes
        setAttributeValues({});
    };

    const renderTechnicalFields = () => {
        if (!formData.typeId) return null;

        return (
            <div className="space-y-6">
                {/* Dynamic Attributes Section */}

                {/* Dynamic Attributes Section */}
                {attributes.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">settings</span>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Especificações de {assetTypes.find(t => t.id === formData.typeId)?.description || 'Ativo'}
                            </span>
                        </div>
                        <div
                            className="grid grid-cols-12 gap-x-4 gap-y-5"
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
                        >
                            {attributes.map(attr => {
                                // Tailwind col-span mapping to ensure classes are not purged
                                const colSpanMap: Record<number, string> = {
                                    1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3',
                                    4: 'col-span-4', 5: 'col-span-5', 6: 'col-span-6',
                                    7: 'col-span-7', 8: 'col-span-8', 9: 'col-span-9',
                                    10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12'
                                };
                                const colSpanClass = colSpanMap[attr.colSpan || 12] || 'col-span-12';

                                return (
                                    <div
                                        key={attr.id}
                                        className={colSpanClass}
                                        style={{ gridColumn: `span ${attr.colSpan || 12} / span ${attr.colSpan || 12}` }}
                                    >
                                        <DynamicField
                                            attribute={attr}
                                            value={attributeValues[attr.fieldKey] || ''}
                                            onChange={value => setAttributeValues(prev => ({ ...prev, [attr.fieldKey]: value }))}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <Textarea
                        label="Observações / Comentários"
                        rows={4}
                        value={formData.comments || ''}
                        onChange={e => setFormData({ ...formData, comments: e.target.value })}
                        placeholder="Informações adicionais importantes..."
                    />
                </div>

                <ButtonSave isSaving={isSaving} onCancel={onCancel} onSave={handleSubmit} />
            </div>
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formData.statusAt) {
            toast.error('Por favor, preencha o campo "Data Situação".');
            return;
        }

        if (!formData.brand) {
            toast.error('Por favor, preencha o campo "Marca".');
            return;
        }

        if (!formData.model) {
            toast.error('Por favor, preencha o campo "Modelo".');
            return;
        }

        if (!formData.serial) {
            toast.error('Por favor, preencha o campo "Nº de Série".');
            return;
        }

        if (!formData.clientId) {
            toast.error('Por favor, selecione um cliente.');
            return;
        }

        if (!formData.unitId) {
            toast.error('Por favor, selecione uma unidade.');
            return;
        }

        if (!formData.unitAssetTagId) {
            toast.error('Por favor, selecione um setor / posição.');
            return;
        }

        if (!formData.acquisitionAt) {
            toast.error('Por favor, preencha o campo "Aquisição em".');
            return;
        }

        // Validate required dynamic attributes
        for (const attr of attributes) {
            if (attr.required && !attributeValues[attr.fieldKey]) {
                toast.error(`Por favor, preencha o campo "${attr.label}".`);
                return;
            }
        }

        setIsSaving(true);
        try {
            // Check code uniqueness (only if not '0')
            if (formData.code && formData.code !== '0') {
                const existingAsset = await dataService.getAssetByCode(formData.code);
                // If editing and code is same as before, it's fine. 
                // However, initialAsset.id might be numeric or string, let's be careful.
                if (existingAsset && (!initialAsset?.id || existingAsset.id.toString() !== initialAsset.id.toString())) {
                    toast.error(`O código "${formData.code}" já está em uso por outro ativo.`);
                    setIsSaving(false);
                    return;
                }
            }

            setUploadProgress(0);
            await onSave(formData, attributeValues, imageFile || undefined, (progress) => {
                setUploadProgress(progress);
            });
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    // Live preview helpers
    const currentStatus = statuses.find(s => s.id === formData.statusId);
    const currentClient = clients.find(c => c.id === formData.clientId);
    const currentUnit = units.find(u => u.id === formData.unitId);
    const currentTag = tags.find(t => t.id === formData.tagId);
    const currentSubTag = tagSubs.find(s => s.id === formData.tagSubId);

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-background-light dark:bg-slate-950">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6 text-red-500">
                    <span className="material-symbols-outlined text-[40px]">lock</span>
                </div>
                <h3 className="text-slate-900 dark:text-white font-black text-xl mb-2">Acesso Negado</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-xs">
                    Você não possui as permissões necessárias para {isEdit ? 'editar este ativo' : 'cadastrar novos ativos'}.
                </p>
                <button
                    onClick={onCancel}
                    className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    Voltar para Ativos
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-slate-950 relative">
            {/* Top Loading Bar */}
            {isSaving && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 z-50 overflow-hidden">
                    <div 
                        className={`h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] ${uploadProgress === 0 ? 'animate-loading-bar w-[40%]' : 'transition-all duration-300 ease-out'}`}
                        style={uploadProgress > 0 ? { width: `${uploadProgress}%` } : undefined}
                    />
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar">

                    {/* Live Preview Header (Mockup Style) */}
                    <div className="p-4 bg-linear-to-b from-blue-600/10 to-transparent">
                        <div className="group relative bg-white dark:bg-[#111827] rounded-[16px] border border-slate-200 dark:border-white/5 shadow-xl p-4 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-500" />

                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="flex items-stretch justify-between gap-4">
                                    {/* Status/Code Badge */}
                                    <div
                                        className="rounded-[12px] px-4 py-2 flex items-center shadow-sm"
                                        style={{ backgroundColor: currentStatus?.color || '#3b82f6' }}
                                    >
                                        <div className="flex flex-col leading-tight">
                                            <span className="text-[14px] font-black tracking-tight text-white uppercase">
                                                {formData.code || 'CODE'}
                                            </span>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">
                                                    {currentStatus?.code || 'STATUS'}
                                                </span>
                                                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                                                    {formData.acquisitionAt ? new Date(formData.acquisitionAt).toLocaleDateString('pt-BR') : '--/--/----'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Selector / Preview */}
                                    <div className="relative">
                                        <Avatar
                                            src={imagePreview || ''}
                                            alt="Preview"
                                            size="md"
                                            className="border-2 border-slate-100 dark:border-white/5 shadow-md h-16 w-16"
                                        />
                                        <div className="absolute -bottom-2 -right-2 flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setIsPhotoSheetOpen(true)}
                                                className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-600 transition-colors border-2 border-white dark:border-slate-900"
                                            >
                                                <span className="material-symbols-outlined text-sm font-black">photo_camera</span>
                                            </button>
                                            {imagePreview && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(true)}
                                                    className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-indigo-600 transition-colors border-2 border-white dark:border-slate-900"
                                                >
                                                    <span className="material-symbols-outlined text-sm font-black">edit</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight uppercase truncate">
                                        {formData.description || 'DESCRIÇÃO DO ATIVO'}
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Unidade</span>
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate uppercase">
                                                {currentClient?.name || '---'}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate uppercase">
                                                {currentUnit?.descriptionFull || currentUnit?.description || '---'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 text-right">
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Setor - Posição</span>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate uppercase">
                                                {unitTags.find(t => t.id === formData.unitAssetTagId)?.description || '---'}
                                            </span>
                                            {formData.location && (
                                                <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate uppercase">
                                                    {formData.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="px-6 space-y-8 mt-4">
                        {/* Identificação Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identificação Básica</h4>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-1.5">
                                    <Select
                                        label="Tipo de Ativo"
                                        required
                                        value={formData.typeId}
                                        onChange={e => handleTypeChange(e.target.value)}
                                        options={assetTypes.map(t => ({ value: t.id, label: t.description }))}
                                        placeholder="Selecione o tipo..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Código"
                                            type="text"
                                            required
                                            value={formData.code || ''}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="Ex: 2847"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Marca"
                                            type="text"
                                            required
                                            value={formData.brand || ''}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            placeholder="Ex: WEG"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Modelo"
                                            type="text"
                                            required
                                            value={formData.model || ''}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            placeholder="Ex: W22 Premium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Nº de Série"
                                            type="text"
                                            required
                                            value={formData.serial || ''}
                                            onChange={e => setFormData({ ...formData, serial: e.target.value })}
                                            placeholder="Ex: 567890-ABC"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <Select
                                            label="Situação"
                                            required
                                            value={formData.statusId}
                                            onChange={e => setFormData({ ...formData, statusId: e.target.value })}
                                            options={statuses.map(s => ({ value: s.id, label: s.description }))}
                                            placeholder="Selecione a situação..."
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Data Situação"
                                            type="date"
                                            required
                                            value={formData.statusAt ? formData.statusAt.split('T')[0] : ''}
                                            onChange={e => setFormData({ ...formData, statusAt: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <Input
                                            label="Aquisição em"
                                            type="date"
                                            required
                                            value={formData.acquisitionAt ? formData.acquisitionAt.split('T')[0] : ''}
                                            onChange={e => setFormData({ ...formData, acquisitionAt: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Localização Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Localização e Hierarquia</h4>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-1.5">
                                    <Select
                                        label="Cliente"
                                        required
                                        value={formData.clientId}
                                        onChange={e => handleClientChange(e.target.value)}
                                        options={clients.map(c => ({ value: c.id, label: c.name }))}
                                        placeholder="Selecione o cliente..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Select
                                        label="Unidade"
                                        required
                                        value={formData.unitId || ''}
                                        disabled={isUnitDisabled}
                                        onChange={e => handleUnitChange(e.target.value)}
                                        options={units.map(u => ({ value: u.id, label: u.descriptionFull || u.description }))}
                                        placeholder={isUnitDisabled ? "Selecione um cliente primeiro" : "Selecione a unidade..."}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Select
                                        label="Setor / Posição"
                                        required
                                        value={formData.unitAssetTagId || ''}
                                        disabled={isTagDisabled}
                                        onChange={e => handleTagChange(e.target.value)}
                                        options={unitTags.map(t => ({ value: t.id, label: t.description }))}
                                        placeholder={isTagDisabled ? "Selecione a unidade primeiro" : "Selecione o setor..."}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Input
                                        label="Localização Específica"
                                        type="text"
                                        value={formData.location || ''}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Ex: Pavimento 2, Sala 104"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Adaptive Technical Data Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dados Técnicos</h4>
                            </div>

                            {renderTechnicalFields()}
                        </section>
                    </div>
                </div>
            </form>

            <ImageUploadSheet
                isOpen={isPhotoSheetOpen}
                onClose={() => setIsPhotoSheetOpen(false)}
                onSelectGallery={() => takePhoto(CameraSource.Photos)}
                onTakeCamera={() => takePhoto(CameraSource.Camera)}
            />

            {isEditing && imagePreview && (
                <ImageEditorModal
                    isOpen={isEditing}
                    imageFile={imagePreview}
                    onClose={() => setIsEditing(false)}
                    onSave={handleSaveEditedImage}
                />
            )}
        </div>
    );
};
