import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Vehicle, VehicleCostType, User } from '../../types';
import { dataService } from '../../services/dataService';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { AccessDenied } from '../../components/permissions/AccessDenied';
import { Input } from '../../components/ui/Input';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { ImageUploadSheet } from '../../components/ui/ImageUploadSheet';
import { ImageEditorModal } from '../../components/ui/ImageEditorModal';
import { Loading } from '../../components/ui/Loading';
import { isVehicleRentalEnabled } from '../../features';
import { toast } from 'sonner';

interface FuelExpenseScreenProps {
    onNavigate?: (screen: string) => void;
    /** Chamado após salvar com sucesso (usado quando o form é aberto inline na aba Abastecimentos). */
    onSaved?: () => void;
    companyId?: string;
    currentUser?: User | null;
}

type ImageSlot = 'plate' | 'odometer' | 'invoice';

const SLOT_META: { key: ImageSlot; label: string; icon: string }[] = [
    { key: 'plate', label: 'Placa', icon: 'pin' },
    { key: 'odometer', label: 'Odômetro', icon: 'speed' },
    { key: 'invoice', label: 'Nota Fiscal', icon: 'receipt_long' }
];

/** '1.234,56' | '1234.56' => número (mesma regra do modal de despesas) */
const parseBRNumber = (raw: string): number => {
    const value = String(raw || '').trim();
    if (!value) return NaN;
    const normalized = value.includes(',')
        ? value.replace(/\./g, '').replace(',', '.')
        : value;
    return Number(normalized);
};

/**
 * Máscara de moeda BR (mesmo padrão das telas de materiais):
 * dígitos => '1.234,56' enquanto digita. Uso nos campos
 * Qtd. Combustível e Valor Total.
 */
const applyCurrencyMask = (raw: string, maxDigits = 10): string => {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, maxDigits);
    if (!digits) return '';
    return (Number(digits) / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const normalizeCode = (code: string): string =>
    String(code || '').replace(/[^A-Za-z]/g, '').toUpperCase();

const FUEL_CODES = ['FUEL', 'COMBUSTIVEL', 'COMBUSTVEL'];

export const FuelExpenseScreen: React.FC<FuelExpenseScreenProps> = ({
    onNavigate,
    onSaved,
    companyId: propCompanyId,
    currentUser: propCurrentUser
}) => {
    const { canView, loading: permissionsLoading } = usePermissions();
    const { currentUser: authUser } = useAuth();
    const currentUser = propCurrentUser || authUser;
    const effectiveCompanyId = propCompanyId || currentUser?.companyId;

    // Veículo (placa) — busca com debounce, padrão RentalContractForm
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Vehicle[]>([]);
    const [searching, setSearching] = useState(false);

    // Tipo de despesa combustível (code FUEL) — undefined = carregando, null = não cadastrado
    const [fuelCostType, setFuelCostType] = useState<VehicleCostType | null | undefined>(undefined);

    // Base do odômetro: maior recorder_end das visitas do veículo
    // undefined = carregando, null = sem registro
    const [odometerBase, setOdometerBase] = useState<number | null | undefined>(undefined);

    const [form, setForm] = useState({ odometer: '', fuelQuantity: '', totalValue: '' });
    const [images, setImages] = useState<Record<ImageSlot, File | null>>({
        plate: null,
        odometer: null,
        invoice: null
    });
    const [previews, setPreviews] = useState<Record<ImageSlot, string | null>>({
        plate: null,
        odometer: null,
        invoice: null
    });
    const previewsRef = useRef<Record<ImageSlot, string | null>>({
        plate: null,
        odometer: null,
        invoice: null
    });

    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetSlot, setSheetSlot] = useState<ImageSlot | null>(null);
    // Fluxo dos relatórios de ativos: captura => editor => confirma
    const [editingImage, setEditingImage] = useState<{ slot: ImageSlot; src: File | string } | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const now = new Date();
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // ── Tipo de despesa combustível ──────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        dataService.getVehicleCostTypes()
            .then(types => {
                if (cancelled) return;
                setFuelCostType(
                    types.find(t => FUEL_CODES.includes(normalizeCode(t.code))) ?? null
                );
            })
            .catch(error => {
                console.error('Error loading cost types', error);
                if (!cancelled) setFuelCostType(null);
            });
        return () => { cancelled = true; };
    }, []);

    // ── Busca / listagem de veículos filtrados pela empresa do usuário ──
    const loadVehicles = useCallback(async (query: string) => {
        setSearching(true);
        try {
            const found = await dataService.searchVehicles(query, effectiveCompanyId, 50);
            setResults(found);
        } catch (error) {
            console.error('Error searching vehicles', error);
        } finally {
            setSearching(false);
        }
    }, [effectiveCompanyId]);

    useEffect(() => {
        if (search.trim().length > 0) {
            const timer = setTimeout(() => {
                loadVehicles(search.trim());
            }, 300);
            return () => clearTimeout(timer);
        } else {
            loadVehicles('');
        }
    }, [search, loadVehicles]);

    // ── Base do odômetro do veículo selecionado ──────────────────────
    useEffect(() => {
        let cancelled = false;
        setOdometerBase(undefined);
        if (!vehicle) return;
        dataService.getMaxVehicleOdometer(vehicle.id)
            .then(base => { if (!cancelled) setOdometerBase(base); })
            .catch(error => {
                console.error('Error fetching odometer base', error);
                if (!cancelled) setOdometerBase(null);
            });
        return () => { cancelled = true; };
    }, [vehicle?.id]);

    // ── Object URLs (preview) — revoga no unmount ────────────────────
    useEffect(() => {
        return () => {
            Object.values(previewsRef.current).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, []);

    const setImage = (slot: ImageSlot, file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.warning('Selecione um arquivo de imagem (JPG, PNG ou WEBP).');
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            toast.warning('Imagem muito grande. O limite é 15 MB.');
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviews(prev => {
            if (prev[slot]) URL.revokeObjectURL(prev[slot]);
            const next = { ...prev, [slot]: url };
            previewsRef.current = next;
            return next;
        });
        setImages(prev => ({ ...prev, [slot]: file }));
    };

    const clearImage = (slot: ImageSlot) => {
        setPreviews(prev => {
            if (prev[slot]) URL.revokeObjectURL(prev[slot]);
            const next = { ...prev, [slot]: null };
            previewsRef.current = next;
            return next;
        });
        setImages(prev => ({ ...prev, [slot]: null }));
    };

    // Seleção de imagem — mesmo padrão dos relatórios de ativos
    // (OrderVisitAssetReport): captura => ImageEditorModal => confirma
    const pickFromGallery = async () => {
        const slot = sheetSlot;
        setSheetSlot(null);
        if (!slot) return;
        try {
            const result = await Camera.pickImages({ quality: 80, limit: 1 });
            if (result.photos.length > 0) {
                const photo = result.photos[0];
                let blob: Blob;
                try {
                    const response = await fetch(photo.webPath!);
                    blob = await response.blob();
                } catch (fetchError) {
                    if (photo.path) {
                        const { Filesystem } = await import('@capacitor/filesystem');
                        const fileData = await Filesystem.readFile({ path: photo.path });
                        const responseB64 = await fetch(`data:image/${photo.format};base64,${fileData.data}`);
                        blob = await responseB64.blob();
                    } else { throw fetchError; }
                }
                const file = new File([blob], `fuel_${slot}_${Date.now()}.${photo.format}`, { type: blob.type });
                setEditingImage({ slot, src: file });
            }
        } catch (error) {
            console.error('Error picking image', error);
            toast.error('Não foi possível selecionar a foto.');
        }
    };

    const takePhoto = async () => {
        const slot = sheetSlot;
        setSheetSlot(null);
        if (!slot) return;
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
                const file = new File([blob], `fuel_${slot}_${Date.now()}.${image.format}`, { type: blob.type });
                setEditingImage({ slot, src: file });
            }
        } catch (error) {
            console.error('Error taking photo', error);
            toast.error('Não foi possível capturar a foto.');
        }
    };

    const handleSaveEditedImage = (editedFile: File) => {
        if (!editingImage) return;
        setImage(editingImage.slot, editedFile);
        setEditingImage(null);
    };

    const resetForm = () => {
        setVehicle(null);
        setSearch('');
        setResults([]);
        setForm({ odometer: '', fuelQuantity: '', totalValue: '' });
        (Object.keys(images) as ImageSlot[]).forEach(slot => {
            if (previewsRef.current[slot]) {
                URL.revokeObjectURL(previewsRef.current[slot]!);
            }
        });
        const cleared = { plate: null, odometer: null, invoice: null };
        previewsRef.current = { ...cleared };
        setPreviews({ ...cleared });
        setImages({ ...cleared });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        if (!vehicle) {
            toast.warning('Selecione o veículo (placa) do abastecimento.');
            return;
        }
        if (!fuelCostType) {
            toast.warning('Cadastre o tipo de despesa de combustível (code FUEL) em Configurações › Tipos de Custo Veicular.');
            return;
        }

        const odometer = Number(String(form.odometer).replace(/\D/g, ''));
        const fuelQuantity = parseBRNumber(form.fuelQuantity);
        const totalValue = parseBRNumber(form.totalValue);

        if (!Number.isFinite(odometer) || odometer <= 0) {
            toast.warning('Informe a leitura do odômetro em Km.');
            return;
        }
        if (!Number.isFinite(fuelQuantity) || fuelQuantity <= 0) {
            toast.warning('Informe a quantidade de combustível em litros.');
            return;
        }
        if (!Number.isFinite(totalValue) || totalValue <= 0) {
            toast.warning('Informe o valor total do abastecimento.');
            return;
        }
        if (!images.plate || !images.odometer || !images.invoice) {
            toast.warning('Adicione as 3 fotos obrigatórias: placa, odômetro e nota fiscal.');
            return;
        }

        try {
            setIsSaving(true);
            setUploadProgress(0);

            // Competência travada (alocada/fechada) — pré-checagem amigável
            const periods = await dataService.getRentalPeriods(referenceMonth);
            const locked = periods.find(
                p => p.vehicleId === vehicle.id && (p.status === 'ALLOCATED' || p.status === 'CLOSED')
            );
            if (locked) {
                toast.warning('A competência deste veículo está alocada/fechada — despesas somente leitura. Faça o estorno na Apuração antes de lançar.');
                return;
            }

            // Progressão do odômetro (base: maior odômetro final de visitas)
            const base = await dataService.getMaxVehicleOdometer(vehicle.id);
            if (base != null && odometer <= base) {
                toast.warning(`Odômetro inválido: o último registro do veículo é ${base.toLocaleString('pt-BR')} Km. Informe um valor maior.`);
                return;
            }

            // 1) Upload das 3 imagens obrigatórias (falha ⇒ aborta)
            const refs = await dataService.uploadFuelExpenseImages(
                vehicle.id,
                vehicle.companyId,
                { plate: images.plate, odometer: images.odometer, invoice: images.invoice },
                setUploadProgress
            );

            // 2) Grava a despesa variável do mês atual
            await dataService.saveRentalExpense({
                vehicleId: vehicle.id,
                referenceMonth,
                costTypeId: fuelCostType.id,
                value: totalValue,
                description: `Abastecimento ${vehicle.plates || ''} — ${fuelQuantity.toLocaleString('pt-BR')} L`.trim(),
                odometer,
                fuelQuantity,
                ...refs,
                userId: currentUser?.id
            });

            toast.success('Abastecimento registrado!');
            resetForm();
            onSaved?.();
        } catch (error: any) {
            console.error('Error saving fuel expense', error);
            const message = String(error?.message || '');
            if (message.includes('bloqueadas')) {
                toast.warning('A competência deste veículo está alocada/fechada — despesas somente leitura. Faça o estorno na Apuração antes de lançar.');
            } else if (message.includes('imagens')) {
                toast.error(message);
            } else {
                toast.error('Erro ao registrar o abastecimento. Tente novamente.');
            }
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    if (!isVehicleRentalEnabled()) {
        return (
            <div className="p-8 text-center text-slate-400">
                Recurso de rateio de aluguel veicular desativado.
            </div>
        );
    }

    if (permissionsLoading) {
        return <div className="p-8"><Loading /></div>;
    }

    if (!canView('transport_fuel_expenses')) {
        return (
            <AccessDenied
                onBack={() => onNavigate?.('dashboard')}
                message="Você não tem permissão para lançar despesas de combustível."
            />
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col pb-24">
                {isSaving && (
                    <div className="h-1 overflow-hidden bg-primary/20">
                        <div
                            className="h-full bg-primary animate-loading-bar transition-all"
                            style={{ width: `${Math.max(10, uploadProgress)}%` }}
                        />
                    </div>
                )}

                <div className="px-4 pt-4 pb-32 space-y-5 overflow-y-auto">
                    {/* Contexto do lançamento */}
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            Despesa variável · Competência
                        </p>
                        <p className="font-black text-slate-900 dark:text-white first-letter:uppercase">
                            {monthLabel}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                            Lançamento automático no mês atual — compõe o rateio de despesas da Apuração.
                        </p>
                    </div>

                    {fuelCostType === undefined && (
                        <p className="text-xs text-slate-400 px-1">Carregando tipo de despesa...</p>
                    )}
                    {fuelCostType === null && (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 p-3">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                Nenhum tipo de despesa de combustível cadastrado. Crie em Configurações › Tipos de Custo Veicular com código FUEL antes de lançar.
                            </p>
                        </div>
                    )}

                    {/* Veículo (placa) */}
                    {vehicle ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-primary">local_shipping</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {vehicle.description}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                    {vehicle.plates || '---'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setVehicle(null); setSearch(''); setResults([]); }}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Trocar veículo"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Input
                                label="Veículo (Placa)"
                                placeholder="Buscar por placa ou descrição..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                required
                            />
                            {searching && (
                                <p className="text-xs text-slate-400 px-1">Buscando veículos...</p>
                            )}
                            {results.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                                    {results.map(v => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => { setVehicle(v); setSearch(''); }}
                                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                                        >
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {v.description}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                {v.plates || '---'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!searching && results.length === 0 && (
                                <p className="text-xs text-slate-400 px-1">
                                    {search.trim().length > 0
                                        ? 'Nenhum veículo encontrado com esse termo.'
                                        : 'Nenhum veículo disponível cadastrado para a sua empresa.'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Odômetro + Quantidade + Valor */}
                    <div className="space-y-2">
                        <Input
                            label="Odômetro (Km)"
                            type="text"
                            inputMode="numeric"
                            placeholder="Ex: 125480"
                            value={form.odometer}
                            onChange={(e) => setForm({ ...form, odometer: e.target.value.replace(/\D/g, '') })}
                            required
                        />
                        {vehicle && odometerBase !== undefined && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-1 ml-1">
                                {odometerBase != null
                                    ? `Último odômetro registrado: ${odometerBase.toLocaleString('pt-BR')} Km — informe um valor maior.`
                                    : 'Sem registro anterior de odômetro — qualquer valor válido.'}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Qtd. Combustível (L)"
                            type="text"
                            inputMode="numeric"
                            placeholder="Ex: 42,50"
                            value={form.fuelQuantity}
                            onChange={(e) => setForm({ ...form, fuelQuantity: applyCurrencyMask(e.target.value, 8) })}
                            required
                        />
                        <Input
                            label="Valor Total (R$)"
                            type="text"
                            inputMode="numeric"
                            placeholder="Ex: 250,00"
                            value={form.totalValue}
                            onChange={(e) => setForm({ ...form, totalValue: applyCurrencyMask(e.target.value) })}
                            required
                        />
                    </div>

                    {/* Fotos obrigatórias */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            Fotos obrigatórias <span className="text-red-500">*</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {SLOT_META.map(slot => (
                                <div
                                    key={slot.key}
                                    className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                >
                                    <div className="px-2 py-1.5 flex items-center justify-between gap-1 bg-slate-50 dark:bg-slate-800/60">
                                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                                            <span className="material-symbols-outlined text-[13px]">{slot.icon}</span>
                                            <span className="truncate">{slot.label}</span>
                                        </span>
                                        {images[slot.key] && (
                                            <button
                                                type="button"
                                                onClick={() => clearImage(slot.key)}
                                                className="text-slate-400 hover:text-red-500 shrink-0"
                                                title="Remover foto"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">close</span>
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setSheetSlot(slot.key); setSheetOpen(true); }}
                                        className="block w-full aspect-[4/3] relative group"
                                        title={images[slot.key] ? 'Trocar foto' : 'Adicionar foto'}
                                    >
                                        {previews[slot.key] ? (
                                            <img
                                                src={previews[slot.key]!}
                                                alt={slot.label}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400 group-hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-xl">add_a_photo</span>
                                                <span className="text-[10px] font-bold">Adicionar</span>
                                            </span>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">
                            Placa, odômetro e nota fiscal são obrigatórios para registrar o abastecimento.
                        </p>
                    </div>
                </div>

                <ButtonSave
                    onSave={handleSubmit}
                    onCancel={() => onNavigate?.('dashboard')}
                    isSaving={isSaving}
                    saveLabel={isSaving && uploadProgress > 0 ? `Enviando ${uploadProgress}%` : 'Salvar'}
                />
            </form>

            <ImageUploadSheet
                isOpen={sheetOpen}
                onClose={() => setSheetOpen(false)}
                onSelectGallery={pickFromGallery}
                onTakeCamera={takePhoto}
            />

            {editingImage && (
                <ImageEditorModal
                    isOpen={!!editingImage}
                    imageFile={editingImage.src}
                    onClose={() => setEditingImage(null)}
                    onSave={handleSaveEditedImage}
                />
            )}
        </div>
    );
};
