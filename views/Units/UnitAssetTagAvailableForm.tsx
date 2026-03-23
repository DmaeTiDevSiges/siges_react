import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Unit, AssetTag, User } from '../../types';
import { Select } from '../../components/ui/Select';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { toast } from 'sonner';
import { PhotoViewer } from '../../components/ui/PhotoViewer';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface UnitAssetTagAvailableFormProps {
    unitId: string;
    assetTagId: string;
    onBack: () => void;
    onSave?: () => void;
}

export const UnitAssetTagAvailableForm: React.FC<UnitAssetTagAvailableFormProps> = ({ 
    unitId, 
    assetTagId, 
    onBack,
    onSave 
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [assetTag, setAssetTag] = useState<AssetTag | null>(null);
    
    // Form State
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [reasonId, setReasonId] = useState<string>('');
    const [comments, setComments] = useState('');
    const [reasons, setReasons] = useState<{ id: number, description: string }[]>([]);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isImageSourceSheetOpen, setIsImageSourceSheetOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [unit, setUnit] = useState<{ latitude?: number; longitude?: number } | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const [user, reasonsData, itemData, unitData] = await Promise.all([
                    dataService.getCurrentUser(),
                    dataService.getAssetsUnavailableReasons(),
                    dataService.getUnitAssetTagItemById(assetTagId),
                    dataService.getUnitById(unitId)
                ]);

                setCurrentUser(user);
                setReasons(reasonsData);
                if (itemData) setAssetTag(itemData);
                if (unitData) setUnit(unitData);
            } catch (error) {
                console.error('Error loading initial data:', error);
                toast.error('Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [unitId, assetTagId]);

    // Captura GPS do usuário ao montar o componente
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => console.warn('GPS não disponível:', err),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
        setIsImageSourceSheetOpen(false);
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
    };

    const handlePhotoSelection = async (source: CameraSource) => {
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: source
            });

            if (image.webPath) {
                const response = await fetch(image.webPath);
                const blob = await response.blob();
                const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                
                setSelectedImage(file);
                setImagePreview(image.webPath);
            }
            setIsImageSourceSheetOpen(false);
        } catch (error) {
            console.error('Error taking photo:', error);
            // User cancelled usually
        }
    };

    const removeImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleSave = async () => {
        if (isAvailable === null) {
            toast.error('Selecione se o setor está disponível ou não');
            return;
        }

        if (isAvailable === false && !reasonId) {
            toast.error('Selecione o motivo da indisponibilidade');
            return;
        }

        if (!currentUser) {
            toast.error('Usuário não autenticado');
            return;
        }

        try {
            if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Medium });
            setSaving(true);
            
            let dist: number | null = null;

            if (!Capacitor.isNativePlatform()) {
                dist = 0;
            } else {
                const calcDistance = (lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null): number | null => {
                    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
                    const R = 6371000;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
                    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                };
                dist = calcDistance(userLocation?.lat, userLocation?.lon, unit?.latitude, unit?.longitude);
            }

            // 1. Grava no banco e recebe o ID inserido em assets_available
            const newHistoryId = await dataService.updateUnitAssetTagAvailability(assetTagId, {
                isAvailable,
                reasonId: isAvailable === false ? reasonId : undefined,
                comments: comments || undefined,
                reportedById: currentUser.id.toString(),
                images: [],
                unitId: assetTag.unit_id,
                assetTagId: assetTag.asset_tag_id,
                assetTagSubId: assetTag.asset_tag_sub_id,
                reportedLatitude: userLocation?.lat ?? null,
                reportedLongitude: userLocation?.lon ?? null,
                unitLatitude: unit?.latitude ?? null,
                unitLongitude: unit?.longitude ?? null,
                unitReportedDistance: dist,
                providerCompanyId: currentUser.companyId ? parseInt(currentUser.companyId) : undefined,
                isWeb: !Capacitor.isNativePlatform()
            });

            // 2. Upload da imagem com os caminhos amarrados ao novo ID gerado
            if (selectedImage && newHistoryId) {
                const urlData = await dataService.uploadAssetAvailableImageAfterInsert(newHistoryId, assetTag.unit_id, selectedImage);
                if (urlData?.path) {
                    // 3. Atualiza os registros do banco com os caminhos da imagem
                    await dataService.updateUnitAssetTagImageRefs(parseInt(assetTagId), newHistoryId, urlData.path, urlData.filename);
                }
            }

            toast.success('Disponibilidade atualizada com sucesso!');
            if (onSave) onSave();
            onBack();
        } catch (error) {
            console.error('Error saving availability:', error);
            toast.error('Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900 min-h-full h-full overflow-hidden animate-in fade-in duration-300">
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent mb-4"></div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Carregando...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 pb-24">
                        {/* Status Selection Card */}
                        <div className="mb-8 relative group">
                            
                            <div className="flex items-center justify-between relative z-10 w-full">
                                <div className="flex flex-col py-1">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] leading-none mb-1.5 opacity-80">
                                        {assetTag?.client_name || 'CLIENTE NÃO INFORMADO'}
                                    </span>
                                    <span className="text-[18px] font-black text-slate-900 dark:text-white uppercase leading-tight tracking-tight">
                                        {assetTag?.unit_description || 'UNIDADE'}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1.5 opacity-80">
                                        {assetTag?.asset_tag_tag_sub_description || 'SETOR'}
                                    </span>
                                </div>
                                
                                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl gap-1.5 shadow-inner">
                                    <button 
                                        onClick={() => {
                                            setIsAvailable(true);
                                            if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                                        }}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${isAvailable === true ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-md ring-1 ring-emerald-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                    >
                                        <span className={`material-symbols-outlined text-[26px] ${isAvailable === true ? '[font-variation-settings:\'FILL\'_1]' : ''}`}>thumb_up</span>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsAvailable(false);
                                            if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                                        }}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${isAvailable === false ? 'bg-white dark:bg-slate-700 text-red-500 shadow-md ring-1 ring-red-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                    >
                                        <span className={`material-symbols-outlined text-[26px] ${isAvailable === false ? '[font-variation-settings:\'FILL\'_1]' : ''}`}>thumb_down</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {isAvailable === false && (
                                <div className="animate-in slide-in-from-top-4 duration-400 ease-out">
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                        Causa da Indisponibilidade
                                    </h3>
                                    <Select 
                                        value={reasonId}
                                        onChange={(e) => setReasonId(e.target.value)}
                                        placeholder="Selecione o motivo..."
                                        options={reasons.map(r => ({ value: String(r.id), label: r.description }))}
                                        className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl h-14 shadow-sm"
                                    />
                                </div>
                            )}

                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
                                    Observações Técnica
                                </h3>
                                <textarea 
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Descreva detalhes importantes..."
                                    className="w-full h-32 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm placeholder:text-slate-400 font-medium leading-relaxed active:scale-[0.99]"
                                />
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
                                    Evidências Fotográficas
                                </h3>
                                
                                <div className="flex gap-3">
                                    {imagePreview ? (
                                        <div className="relative w-32 h-32 rounded-[20px] overflow-hidden group shadow-sm border border-slate-100 dark:border-slate-800">
                                            <img 
                                                src={imagePreview} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover cursor-zoom-in" 
                                                onClick={() => setIsPreviewOpen(true)}
                                            />
                                            <button 
                                                onClick={removeImage}
                                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-75 transition-transform z-10"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => setIsImageSourceSheetOpen(true)}
                                            className="w-32 h-32 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-[20px] hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer active:scale-95 shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 mb-1 text-[28px] [font-variation-settings:'wght'_300]">add_a_photo</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Adicionar</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image Expansion Modal */}
                            {isPreviewOpen && imagePreview && (
                                <PhotoViewer
                                    src={imagePreview}
                                    onClose={() => setIsPreviewOpen(false)}
                                    alt="Evidência Fotográfica"
                                />
                            )}

                            <div className="pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/25 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:brightness-110 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px] [font-variation-settings:'wght'_600]">assignment_turned_in</span>
                                            <span>Salvar Disponibilidade</span>
                                        </>
                                    )}
                                </button>
                            </div>
                    </div>
                </div>
            )}

            {/* Image Source Selection Sheet */}
            <BottomSheet
                isOpen={isImageSourceSheetOpen}
                onClose={() => setIsImageSourceSheetOpen(false)}
                title="Selecionar Imagem"
                height="auto"
            >
                <div className="px-6 py-8 grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => handlePhotoSelection(CameraSource.Camera)}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Câmera</span>
                    </button>

                    <button 
                        onClick={() => handlePhotoSelection(CameraSource.Photos)}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-500 text-3xl">image</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Galeria</span>
                    </button>
                    
                    {/* Fallback for Web/Test - hidden but useful if needed */}
                    <input 
                        type="file" 
                        id="file-upload-fallback" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                    />
                </div>
            </BottomSheet>
        </div>
    );
};
