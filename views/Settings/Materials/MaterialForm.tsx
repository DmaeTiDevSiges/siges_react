import React, { useState, useEffect } from 'react';
import { Material } from '../../../types';
import { dataService } from '../../../services/dataService';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { ButtonSave } from '../../../components/ui/ButtonSave';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';
import { Modal } from '../../../components/ui/Modal';
import { usePermissions } from '../../../contexts/PermissionsContext';

interface MaterialFormProps {
    initialMaterial?: Partial<Material>;
    onSave: (material: Partial<Material>) => Promise<void> | void;
    onCancel: () => void;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({
    initialMaterial,
    onSave,
    onCancel
}) => {
    const { canEdit } = usePermissions();
    const canSave = canEdit('materials_create_edit_delete');
    const isCreating = !initialMaterial?.id;
    const [isSaving, setIsSaving] = useState(false);
    const [warehouses, setWarehouses] = useState<{ id: string; code: string; description: string }[]>([]);
    const [form, setForm] = useState({
        description: initialMaterial?.description || '',
        code: initialMaterial?.code || '',
        unit: initialMaterial?.unit || '',
        statusId: initialMaterial?.statusId ?? 1,
        warehouseId: initialMaterial?.warehouseId || '',
        initialQuantity: initialMaterial?.initialQuantity || 0,
        minStock: initialMaterial?.minStock || 0,
        priceAvg: initialMaterial?.priceUnit || 0
    });

    const [duplicateModal, setDuplicateModal] = useState(false);
    const [statuses, setStatuses] = useState<{ id: number; code: string; description: string }[]>([]);

    useEffect(() => {
        if (isCreating) {
            dataService.getWarehouses().then(setWarehouses).catch(() => setWarehouses([]));
        }
        dataService.getMaterialsStatuses().then(setStatuses).catch((err) => { console.error('Error loading statuses:', err); setStatuses([]); });
    }, [isCreating]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsSaving(true);

            const exists = await dataService.checkMaterialCodeExists(form.code, initialMaterial?.id);
            if (exists) {
                setDuplicateModal(true);
                setIsSaving(false);
                return;
            }

            await onSave({ ...form, priceUnit: form.priceAvg, id: initialMaterial?.id } as Partial<Material>);
        } catch (error) {
            console.error("Error saving material", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
            {isSaving && (
                <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-primary/20">
                    <div className="h-full bg-primary animate-loading-bar w-[40%]" />
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto pb-10">
                <Input
                    label="Descrição"
                    placeholder="Ex: Parafuso M8"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    disabled={!canSave}
                />

                <Input
                    label="Código"
                    placeholder="Ex: MAT-001"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                    disabled={!canSave}
                />

                <Input
                    label="Unidade"
                    placeholder="Ex: UNID, KG, M2, LITRO"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    required
                    disabled={!canSave}
                />

                <Select
                    label="Situação"
                    value={form.statusId.toString()}
                    onChange={(e) => setForm({ ...form, statusId: parseInt(e.target.value) })}
                    disabled={!canSave}
                >
                    {statuses.length === 0 ? (
                        <option value="1">Ativo</option>
                    ) : (
                        statuses.map(s => (
                            <option key={s.id} value={s.id}>{s.description}</option>
                        ))
                    )}
                </Select>

                <CurrencyInput
                    label="Preço Médio"
                    value={form.priceAvg}
                    onChange={(value) => setForm({ ...form, priceAvg: value })}
                    disabled={!canSave}
                />

                {isCreating && (
                    <>
                        <Select
                            label="Almoxarifado"
                            value={form.warehouseId}
                            onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                            disabled={!canSave}
                            required
                        >
                            <option value="">
                                {warehouses.length === 0 ? 'Nenhum almoxarifado disponível' : 'Selecione o almoxarifado'}
                            </option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.code} - {w.description}</option>
                            ))}
                        </Select>

                        <Input
                            label="Quantidade Inicial"
                            type="number"
                            placeholder="0"
                            value={form.initialQuantity.toString()}
                            onChange={(e) => setForm({ ...form, initialQuantity: parseInt(e.target.value) || 0 })}
                            disabled={!canSave}
                        />

                        <Input
                            label="Estoque Mínimo"
                            type="number"
                            placeholder="0"
                            value={form.minStock.toString()}
                            onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })}
                            disabled={!canSave}
                        />
                    </>
                )}
            </form>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
                disabled={!canSave}
            />

            <Modal
                isOpen={duplicateModal}
                onClose={() => setDuplicateModal(false)}
                title="Código duplicado"
                type="warning"
                hideHeader={true}
                maxWidth="sm"
            >
                <div className="flex flex-col items-center text-center pt-2">
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-amber-50/50 dark:ring-amber-900/10">
                        <span className="material-symbols-outlined text-4xl text-amber-500">warning</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                        Código duplicado
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-[85%]">
                        Já existe um material cadastrado com o código <strong>{form.code}</strong>. Utilize um código diferente.
                    </p>
                    <button
                        onClick={() => setDuplicateModal(false)}
                        className="w-full py-3.5 rounded-2xl text-white font-bold text-sm uppercase tracking-wider bg-primary hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
                    >
                        ENTENDIDO
                    </button>
                </div>
            </Modal>
        </div>
    );
};
