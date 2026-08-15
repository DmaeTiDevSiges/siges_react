import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Asset, AssetMaterial, TechnicalManual } from '../../types';
import { dataService } from '../../services/dataService';
import { AssetForm } from './AssetForm';
import { Loading } from '../../components/ui/Loading';

interface AssetCloneWizardProps {
    sourceAsset: Asset;
    onCancel: () => void;
    onComplete: () => void;
}

type Step = 1 | 2 | 3;

export const AssetCloneWizard: React.FC<AssetCloneWizardProps> = ({
    sourceAsset,
    onCancel,
    onComplete
}) => {
    const [currentStep, setCurrentStep] = useState<Step>(1);

    // Step 1: Form data capturado do AssetForm
    const [savedFormData, setSavedFormData] = useState<Partial<Asset> | null>(null);
    const [savedAttributeValues, setSavedAttributeValues] = useState<Record<string, string>>({});
    const [savedFile, setSavedFile] = useState<File | undefined>(undefined);

    // Step 2: Componentes
    const [components, setComponents] = useState<AssetMaterial[]>([]);
    const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(new Set());
    const [isLoadingComponents, setIsLoadingComponents] = useState(false);

    // Step 3: Manuais
    const [manuals, setManuals] = useState<TechnicalManual[]>([]);
    const [selectedManualIds, setSelectedManualIds] = useState<Set<string>>(new Set());
    const [isLoadingManuals, setIsLoadingManuals] = useState(false);

    // Loading geral ao salvar
    const [isSaving, setIsSaving] = useState(false);

    // Carregar componentes quando avançar para Step 2
    useEffect(() => {
        if (currentStep === 2 && components.length === 0) {
            loadComponents();
        }
    }, [currentStep]);

    // Carregar manuais quando avançar para Step 3
    useEffect(() => {
        if (currentStep === 3 && manuals.length === 0) {
            loadManuals();
        }
    }, [currentStep]);

    const loadComponents = async () => {
        setIsLoadingComponents(true);
        try {
            const data = await dataService.getAssetComponents(sourceAsset.id);
            setComponents(data);
            setSelectedComponentIds(new Set(data.map(c => c.id)));
        } catch (error) {
            console.error('Error loading components:', error);
            toast.error('Erro ao carregar componentes.');
        } finally {
            setIsLoadingComponents(false);
        }
    };

    const loadManuals = async () => {
        setIsLoadingManuals(true);
        try {
            const data = await dataService.getTechnicalManualsByAssetId(sourceAsset.id);
            setManuals(data);
            setSelectedManualIds(new Set(data.map(m => m.id)));
        } catch (error) {
            console.error('Error loading manuals:', error);
            toast.error('Erro ao carregar manuais.');
        } finally {
            setIsLoadingManuals(false);
        }
    };

    const toggleComponent = (id: string) => {
        setSelectedComponentIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllComponents = () => {
        if (selectedComponentIds.size === components.length) {
            setSelectedComponentIds(new Set());
        } else {
            setSelectedComponentIds(new Set(components.map(c => c.id)));
        }
    };

    const toggleManual = (id: string) => {
        setSelectedManualIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllManuals = () => {
        if (selectedManualIds.size === manuals.length) {
            setSelectedManualIds(new Set());
        } else {
            setSelectedManualIds(new Set(manuals.map(m => m.id)));
        }
    };

    // Step 1: AssetForm submete → salva dados e avança para Step 2
    const handleFormSubmit = async (
        asset: Partial<Asset>,
        attributeValues: Record<string, string>,
        file?: File
    ) => {
        // Limpar campos de serial que não devem ser copiados
        const { pump_serial, engine_serial, ...cleanAttributeValues } = attributeValues;
        setSavedFormData(asset);
        setSavedAttributeValues(cleanAttributeValues);
        setSavedFile(file);
        setCurrentStep(2);
    };

    // Criar ativo + copiar dados selecionados
    const handleFinalSubmit = async () => {
        if (!savedFormData) return;
        setIsSaving(true);
        try {
            // 1. Criar ativo
            const savedAsset = await dataService.createAsset(savedFormData);

            // 2. Upload da imagem (se houver)
            if (savedFile && savedAsset.id) {
                const { path, filename } = await dataService.uploadAssetImage(savedAsset.id, savedFile);
                await dataService.updateAsset(savedAsset.id, { imgFilePath: path, imgFileName: filename });
            }

            // 3. Salvar atributos dinâmicos
            if (savedAsset.id) {
                await dataService.saveAssetAttributeValues(savedAsset.id, savedAttributeValues);
            }

            // 4. Copiar material relacionado (se existir)
            if (savedAsset.id && sourceAsset.materialId) {
                try {
                    await dataService.addComponentToAsset(
                        savedAsset.id,
                        sourceAsset.materialId,
                        1,
                        '',
                        true,
                        '',
                        ''
                    );
                } catch (e) {
                    console.warn('Erro ao copiar material relacionado:', e);
                }
            }

            // 5. Copiar componentes selecionados
            if (savedAsset.id) {
                for (const comp of components) {
                    if (selectedComponentIds.has(comp.id)) {
                        try {
                            await dataService.addComponentToAsset(
                                savedAsset.id,
                                comp.materialId,
                                comp.amount,
                                comp.brandModel || '',
                                comp.isOriginal,
                                comp.location || '',
                                comp.serial || ''
                            );
                        } catch (e) {
                            console.warn('Erro ao copiar componente:', comp.materialDescription, e);
                        }
                    }
                }
            }

            // 6. Associar manuais selecionados
            if (savedAsset.id) {
                for (const manual of manuals) {
                    if (selectedManualIds.has(manual.id)) {
                        try {
                            await dataService.associateAsset(manual.id, savedAsset.id);
                        } catch (e) {
                            console.warn('Erro ao associar manual:', manual.description, e);
                        }
                    }
                }
            }

            toast.success('Ativo clonado com sucesso!');
            onComplete();
        } catch (error: any) {
            console.error('Error cloning asset:', error);
            toast.error('Erro ao clonar ativo: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // ── Step Indicators ──────────────────────────────────────────
    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-2 py-4">
            {[1, 2, 3].map(step => (
                <React.Fragment key={step}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep === step
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : currentStep > step
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                        {currentStep > step ? '✓' : step}
                    </div>
                    {step < 3 && (
                        <div className={`w-12 h-1 rounded-full transition-all ${
                            currentStep > step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                        }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const stepLabels = ['Dados do Ativo', 'Componentes', 'Manuais'];

    // ── Step 1: Form do Ativo ────────────────────────────────────
    if (currentStep === 1) {
        return (
            <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
                <div className="flex-1 overflow-hidden">
                    <AssetForm
                        initialAsset={sourceAsset}
                        isDuplicate={true}
                        onSave={handleFormSubmit}
                        onCancel={onCancel}
                        headerBottomSlot={
                            <div className="px-4 pb-2">
                                <StepIndicator />
                                <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {stepLabels[currentStep - 1]}
                                </p>
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    // ── Step 2: Componentes ──────────────────────────────────────
    if (currentStep === 2) {
        return (
            <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
                <div className="px-4 pt-2">
                    <StepIndicator />
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {stepLabels[currentStep - 1]}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl p-5 mt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                Componentes do Ativo Original
                            </h3>
                            {components.length > 0 && (
                                <button
                                    onClick={toggleAllComponents}
                                    className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    {selectedComponentIds.size === components.length ? 'Desmarcar todos' : 'Marcar todos'}
                                </button>
                            )}
                        </div>

                        {isLoadingComponents ? (
                            <Loading size="md" text="Carregando componentes..." />
                        ) : components.length === 0 ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">inventory_2</span>
                                <p className="text-sm text-slate-400">Nenhum componente associado a este ativo.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {components.map(comp => (
                                    <label
                                        key={comp.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            selectedComponentIds.has(comp.id)
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedComponentIds.has(comp.id)}
                                            onChange={() => toggleComponent(comp.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {comp.materialDescription}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {comp.materialCode} — {comp.amount} {comp.materialUnit || 'un.'}
                                                {comp.brandModel ? ` — ${comp.brandModel}` : ''}
                                                {comp.isOriginal ? ' — Original' : ' — Genérico'}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            ← Anterior
                        </button>
                        <button
                            onClick={() => setCurrentStep(3)}
                            className="flex-1 py-3 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            Próximo →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Step 3: Manuais ──────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <div className="px-4 pt-2">
                <StepIndicator />
                <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {stepLabels[currentStep - 1]}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl p-5 mt-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            Manuais Técnicos do Ativo Original
                        </h3>
                        {manuals.length > 0 && (
                            <button
                                onClick={toggleAllManuals}
                                className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                            >
                                {selectedManualIds.size === manuals.length ? 'Desmarcar todos' : 'Marcar todos'}
                            </button>
                        )}
                    </div>

                    {isLoadingManuals ? (
                        <Loading size="md" text="Carregando manuais..." />
                    ) : manuals.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">menu_book</span>
                            <p className="text-sm text-slate-400">Nenhum manual técnico associado a este ativo.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {manuals.map(manual => (
                                <label
                                    key={manual.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        selectedManualIds.has(manual.id)
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedManualIds.has(manual.id)}
                                        onChange={() => toggleManual(manual.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {manual.description}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {manual.code}
                                            {manual.assetTypeDescription ? ` — ${manual.assetTypeDescription}` : ''}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex gap-3">
                    <button
                        onClick={() => setCurrentStep(2)}
                        disabled={isSaving}
                        className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        ← Anterior
                    </button>
                    <button
                        onClick={handleFinalSubmit}
                        disabled={isSaving}
                        className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                Criando...
                            </span>
                        ) : (
                            'Criar Ativo ✓'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
