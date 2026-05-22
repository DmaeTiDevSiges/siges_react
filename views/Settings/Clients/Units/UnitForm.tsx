import React, { useState, useEffect, useRef } from 'react';
import { Unit, UnitType, System, Client } from '../../../../types';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';
import { ButtonSave } from '../../../../components/ui/ButtonSave';
import { dataService } from '../../../../services/dataService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { OptimizedImage } from '../../../../components/ui/OptimizedImage';
import { usePermissions } from '../../../../contexts/PermissionsContext';
import { ImageUploadSheet } from '../../../../components/ui/ImageUploadSheet';
import { ImageEditorModal } from '../../../../components/ui/ImageEditorModal';

// Fix for default marker icon in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface UnitFormProps {
    clientId: string;
    initialUnit?: Partial<Unit>;
    onSave: (unit: Partial<Unit>, file?: File | null) => Promise<void> | void;
    onCancel: () => void;
}

export const UnitForm: React.FC<UnitFormProps> = ({
    clientId,
    initialUnit,
    onSave,
    onCancel
}) => {
    const { canCreate, canEdit } = usePermissions();
    const isEdit = !!initialUnit?.id;
    const hasPermission = isEdit ? canEdit('units') : canCreate('units');

    const [isSaving, setIsSaving] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
    const [systems, setSystems] = useState<System[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [wasSearched, setWasSearched] = useState(false);
    const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    // Image Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (initialUnit?.imgFilePath && initialUnit?.imgFileName) {
            const url = dataService.getPublicImageUrl(initialUnit.imgFilePath, initialUnit.imgFileName, { width: 400, height: 400, resize: 'contain' });
            setPreviewUrl(url);
        }
    }, [initialUnit]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleTakePhoto = async (source: CameraSource) => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: source
            });

            if (image.webPath) {
                setPreviewUrl(image.webPath);
                const response = await fetch(image.webPath);
                const blob = await response.blob();
                const file = new File([blob], `unit_image_${Date.now()}.${image.format}`, { type: blob.type });
                setSelectedFile(file);
            }
        } catch (error) {
            console.error('Error taking photo', error);
        }
    };

    const handleSaveEditedImage = (editedFile: File) => {
        const newUrl = URL.createObjectURL(editedFile);
        setPreviewUrl(newUrl);
        setSelectedFile(editedFile);
        setIsEditing(false);
    };

    const [form, setForm] = useState({
        description: initialUnit?.description || '',
        code: initialUnit?.code || '',
        installationCodePowerSupply: initialUnit?.installationCodePowerSupply || '',
        addressFull: initialUnit?.addressFull || '',
        latitude: initialUnit?.latitude || -23.5505, // Default to SP
        longitude: initialUnit?.longitude || -46.6333,
        systemParentId: initialUnit?.systemParentId || '',
        systemId: initialUnit?.systemId || '',
        unitTypeParentId: initialUnit?.unitTypeParentId || '',
        unitTypeId: initialUnit?.unitTypeId || '',
        statusId: initialUnit?.statusId || '1', // Default to '1' (Ativo)
        clientId: initialUnit?.clientId || clientId
    });

    useEffect(() => {
        const loadMetaData = async () => {
            try {
                const [clientsData, utData, sysData, statusesData] = await Promise.all([
                    dataService.getClients(),
                    dataService.getUnitTypes(),
                    dataService.getSystems(),
                    dataService.getUnitsStatuses()
                ]);
                setClients(clientsData.filter(c => c.status === 'active'));
                setUnitTypes(utData);
                setSystems(sysData);
                setStatuses(statusesData || []);
            } catch (error) {
                console.error('Failed to load metadata', error);
            }
        };
        loadMetaData();
    }, []);

    // Initialize Map
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const initialPos: L.LatLngExpression = [form.latitude, form.longitude];

            const map = L.map(mapContainerRef.current).setView(initialPos, 13);

            const streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            });

            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
            });

            const initialLayer = mapType === 'streets' ? streetsLayer : satelliteLayer;
            initialLayer.addTo(map);
            tileLayerRef.current = initialLayer;

            const marker = L.marker(initialPos, { draggable: true }).addTo(map);

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                setForm(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }));
            });

            mapRef.current = map;
            markerRef.current = marker;
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Toggle Map Type
    useEffect(() => {
        if (mapRef.current) {
            if (tileLayerRef.current) {
                mapRef.current.removeLayer(tileLayerRef.current);
            }

            const newLayer = mapType === 'streets'
                ? L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                })
                : L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                });

            newLayer.addTo(mapRef.current);
            tileLayerRef.current = newLayer;
        }
    }, [mapType]);

    const searchAddress = async () => {
        const query = form.addressFull;
        if (!query) return;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const { lat, lon, address, display_name } = result;

                let road = address.road || address.pedestrian || address.highway || address.path || '';
                let houseNumber = address.house_number || address.building || address.house_name || '';

                // Tenta extrair o número do que o usuário digitou caso a API não tenha retornado
                // O usuário costuma digitar "Rua Nome, 123" ou "Rua Nome 123"
                if (!houseNumber) {
                    // Tenta padrão "Rua, 123"
                    const commaParts = query.split(',');
                    if (commaParts.length > 1) {
                        const match = commaParts[1].trim().match(/^\d+/);
                        if (match) houseNumber = match[0];
                    }
                    // Tenta padrão "Rua 123" ao final da string
                    if (!houseNumber) {
                        const lastPartMatch = query.trim().match(/\s+(\d+)$/);
                        if (lastPartMatch) houseNumber = lastPartMatch[1];
                    }
                }

                if (!road && display_name) {
                    road = display_name.split(',')[0].trim();
                }

                const suburb = address.suburb || address.neighbourhood || address.city_district || address.village || '';
                const city = address.city || address.town || address.municipality || '';
                const state = address.state || '';
                const postcode = address.postcode || '';

                const addrParts = [
                    road + (houseNumber ? `, ${houseNumber}` : ''),
                    suburb,
                    city,
                    state,
                    postcode
                ].filter(Boolean).join(' - ');

                const newPos: L.LatLngExpression = [parseFloat(lat), parseFloat(lon)];

                if (mapRef.current && markerRef.current) {
                    mapRef.current.setView(newPos, 16);
                    markerRef.current.setLatLng(newPos);
                    setForm(prev => ({
                        ...prev,
                        latitude: parseFloat(lat),
                        longitude: parseFloat(lon),
                        addressFull: addrParts
                    }));
                    setWasSearched(true);
                }
            }
        } catch (error) {
            console.error('Error searching address:', error);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocalização não é suportada pelo seu navegador.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPos: L.LatLngExpression = [latitude, longitude];

                if (mapRef.current && markerRef.current) {
                    mapRef.current.setView(newPos, 16);
                    markerRef.current.setLatLng(newPos);
                    setForm(prev => ({
                        ...prev,
                        latitude: latitude,
                        longitude: longitude
                    }));
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                toast.error('Não foi possível obter sua localização. Verifique as permissões do navegador.');
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving || !hasPermission) return;

        console.log('📝 Form submitted:', form);
        console.log('📸 Selected file:', selectedFile);

        try {
            setIsSaving(true);
            // Artificial delay to ensure the premium loading effect is visible
            await new Promise(resolve => setTimeout(resolve, 1000));
            await onSave(form as Partial<Unit>, selectedFile);
        } catch (error) {
            console.error("❌ Error saving unit", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Filter systems
    const mainSystems = systems.filter(s => !s.parentId);
    const subSystems = systems.filter(s => s.parentId === form.systemParentId && form.systemParentId !== '');

    // Filter types
    const mainTypes = unitTypes.filter(ut => !ut.parentId);
    const subTypes = unitTypes.filter(ut => ut.parentId === form.unitTypeParentId && form.unitTypeParentId !== '');

    const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm({ ...form, systemParentId: e.target.value, systemId: '' });
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm({ ...form, unitTypeParentId: e.target.value, unitTypeId: '' });
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
            {isSaving && (
                <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-primary/20">
                    <div className="h-full bg-primary animate-loading-bar w-[40%]" />
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto pb-10">
                {/* Image Upload */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 ml-1">Foto de capa</label>
                    <div
                        onClick={() => setIsUploadSheetOpen(true)}
                        className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-slate-50 dark:bg-slate-900 group relative"
                    >
                        {previewUrl ? (
                            <div className="relative w-full h-full">
                                <OptimizedImage src={previewUrl} alt="Preview" className="w-full h-full object-cover" preset="large" />
                                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsUploadSheetOpen(true);
                                        }}
                                        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditing(true);
                                        }}
                                        className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-3xl">photo_camera</span>
                                <span className="text-xs text-slate-400">Tirar foto ou escolher</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Client Selection - PRIMEIRO CAMPO */}
                <Select
                    label="Cliente"
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    required
                >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                        <option key={client.id} value={client.id}>
                            {client.name}
                        </option>
                    ))}
                </Select>

                <Input
                    label="Nome da Unidade"
                    placeholder="Ex: Unidade Centro"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Código"
                    placeholder="Ex: UC-001"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <Input
                    label="Código UC"
                    placeholder="Ex: 12345678"
                    value={form.installationCodePowerSupply}
                    onChange={(e) => setForm({ ...form, installationCodePowerSupply: e.target.value })}
                    required
                />

                <div className="space-y-2">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Input
                                label="Endereço"
                                placeholder="Rua, Número, Bairro, Cidade..."
                                value={form.addressFull}
                                onChange={(e) => setForm({ ...form, addressFull: e.target.value })}
                                required
                            />
                        </div>
                        <Button
                            type="button"
                            variant="primary"
                            className="h-12 w-12 p-0! shrink-0"
                            onClick={searchAddress}
                        >
                            <span className="material-symbols-outlined">location_on</span>
                        </Button>
                    </div>
                    {wasSearched && form.addressFull && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-300">
                            <p className="text-sm text-slate-600 dark:text-slate-400 wrap-break-word leading-relaxed font-medium">
                                {form.addressFull}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 italic">* Endereço formatado para o sistema</p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 ml-1">Localização no Mapa</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Arraste o marcador para ajustar a posição exata</p>
                    <div className="relative group/map">
                        <div
                            ref={mapContainerRef}
                            className="h-64 md:h-[512px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner z-0 overflow-hidden"
                        />

                        {/* Map Controls */}
                        <div className="absolute top-3 right-3 z-1000 flex flex-col gap-2">
                            <button
                                type="button"
                                title={mapType === 'streets' ? 'Satélite' : 'Mapa'}
                                onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
                                className="h-10 w-10 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group/btn"
                            >
                                <span className="material-symbols-outlined text-[20px] text-primary">
                                    {mapType === 'streets' ? 'satellite' : 'map'}
                                </span>
                            </button>

                            <button
                                type="button"
                                title="Minha Posição"
                                onClick={getCurrentLocation}
                                className="h-10 w-10 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group/btn"
                            >
                                <span className="material-symbols-outlined text-[20px] text-primary">
                                    my_location
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                        <span>LAT: {form.latitude.toFixed(6)}</span>
                        <span>LON: {form.longitude.toFixed(6)}</span>
                    </div>
                </div>

                <Select
                    label="Sistema"
                    value={form.systemParentId}
                    onChange={handleSystemChange}
                    required
                >
                    <option value="">Selecione um sistema</option>
                    {mainSystems.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.description}
                        </option>
                    ))}
                </Select>

                <Select
                    label="Sub-Sistema"
                    value={form.systemId}
                    onChange={(e) => setForm({ ...form, systemId: e.target.value })}
                    disabled={!form.systemParentId || subSystems.length === 0}
                    required={!(!form.systemParentId || subSystems.length === 0)}
                >
                    <option value="">Selecione um sub-sistema</option>
                    {subSystems.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.description}
                        </option>
                    ))}
                </Select>

                <Select
                    label="Tipo de Unidade"
                    value={form.unitTypeParentId}
                    onChange={handleTypeChange}
                    required
                >
                    <option value="">Selecione um tipo</option>
                    {mainTypes.map(ut => (
                        <option key={ut.id} value={ut.id}>
                            {ut.description}
                        </option>
                    ))}
                </Select>

                <Select
                    label="Sub-Tipo de Unidade"
                    value={form.unitTypeId}
                    onChange={(e) => setForm({ ...form, unitTypeId: e.target.value })}
                    disabled={!form.unitTypeParentId || subTypes.length === 0}
                    required={!(!form.unitTypeParentId || subTypes.length === 0)}
                >
                    <option value="">Selecione um sub-tipo</option>
                    {subTypes.map(ut => (
                        <option key={ut.id} value={ut.id}>
                            {ut.description}
                        </option>
                    ))}
                </Select>

                <Select
                    label="Situação"
                    value={form.statusId}
                    onChange={(e) => setForm({ ...form, statusId: e.target.value })}
                >
                    {statuses.map(status => (
                        <option key={status.id} value={status.id}>
                            {status.description}
                        </option>
                    ))}
                </Select>
            </form>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
                disabled={!hasPermission}
            />

            <ImageUploadSheet
                isOpen={isUploadSheetOpen}
                onClose={() => setIsUploadSheetOpen(false)}
                onSelectGallery={() => handleTakePhoto(CameraSource.Photos)}
                onTakeCamera={() => handleTakePhoto(CameraSource.Camera)}
            />

            {isEditing && previewUrl && (
                <ImageEditorModal
                    isOpen={isEditing}
                    imageFile={previewUrl}
                    onClose={() => setIsEditing(false)}
                    onSave={handleSaveEditedImage}
                />
            )}
        </div>
    );
};
