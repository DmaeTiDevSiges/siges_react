import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TechnicalManual, TechnicalManualCategory, AssetType } from '../../../../types';
import { dataService } from '../../../../services/dataService';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Textarea } from '../../../../components/ui/Textarea';
import { Button } from '../../../../components/ui/Button';
import { Loading } from '../../../../components/ui/Loading';

interface TechnicalManualFormProps {
    initialManual?: Partial<TechnicalManual>;
    onSave: (manual: Partial<TechnicalManual>) => Promise<void> | void;
    onCancel: () => void;
}

export const TechnicalManualForm: React.FC<TechnicalManualFormProps> = ({
    initialManual,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);

    const [form, setForm] = useState({
        code: initialManual?.code || '',
        description: initialManual?.description || '',
        assetTypeId: initialManual?.assetTypeId || ''
    });

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autoResizeTextarea = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => autoResizeTextarea(), 50);
        return () => clearTimeout(timer);
    }, [form.description, autoResizeTextarea]);

    useEffect(() => {
        const loadDropdowns = async () => {
            try {
                const aTypes = await dataService.getAssetTypes('active');
                setAssetTypes(aTypes);
            } catch (error) {
                console.error('Error loading dropdown data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDropdowns();
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;
        if (!form.code || !form.description || !form.assetTypeId) return;

        try {
            setIsSaving(true);
            await onSave({ ...form, id: initialManual?.id } as Partial<TechnicalManual>);
        } catch (error) {
            console.error("Error saving technical manual", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loading size="md" text="Carregando..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto">
                <Input
                    label="Código"
                    placeholder="Ex: DT-001"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                />

                <Textarea
                    ref={textareaRef}
                    label="Título"
                    placeholder="Ex: Manual do Motor Elétrico"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    onInput={autoResizeTextarea}
                    required
                    rows={1}
                />

                <Select
                    label="Tipo de Ativo"
                    value={form.assetTypeId}
                    onChange={(e) => setForm({ ...form, assetTypeId: e.target.value })}
                    required
                >
                    <option value="">Selecione...</option>
                    {assetTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.description}</option>
                    ))}
                </Select>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-tight">
                        <strong>Dica:</strong> O tipo de ativo define quais ativos poderão ser vinculados a este documento técnico.
                        Após salvar, você poderá associar arquivos (imagens, PDFs, Word, Excel) e vincular ativos específicos.
                    </p>
                </div>

                <div className="flex gap-3 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <Button variant="ghost" type="button" fullWidth onClick={onCancel} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        fullWidth
                        loading={isSaving}
                        disabled={!form.code || !form.description || !form.assetTypeId}
                    >
                        Salvar
                    </Button>
                </div>
            </form>
        </div>
    );
};
