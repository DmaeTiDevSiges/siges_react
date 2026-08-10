import React, { useState, useEffect, useRef } from 'react';
import { Tool, Material } from '../../types';
import { toolsService } from '../../services/toolsService';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';
import { Select } from '../ui/Select';
import { ButtonSave } from '../ui/ButtonSave';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

interface ToolFormProps {
    tool?: Tool;
    onSave: () => void;
    onCancel: () => void;
    onDelete?: () => void;
}

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

export const ToolForm: React.FC<ToolFormProps> = ({ tool, onSave, onCancel, onDelete }) => {
    const { currentUser } = useAuth();
    const [code, setCode] = useState(tool?.code || '');
    const [brand, setBrand] = useState(tool?.brand || '');
    const [model, setModel] = useState(tool?.model || '');
    const [serialNumber, setSerialNumber] = useState(tool?.serial_number || '');
    const [status, setStatus] = useState(tool?.status || 'DISPONIVEL');
    const [materialId, setMaterialId] = useState(tool?.material_id?.toString() || '');
    const [isSaving, setIsSaving] = useState(false);

    // Material search
    const [materialSearch, setMaterialSearch] = useState('');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [materialLoading, setMaterialLoading] = useState(false);
    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const materialRef = useRef<HTMLDivElement>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [hasMovements, setHasMovements] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [confirmModal, setConfirmModal] = useState(false);

    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
    }>({ isOpen: false, title: '', message: '', type: 'info' });

    // Se editando, carregar material inicial pelo id
    useEffect(() => {
        if (tool?.material_id) {
            if (tool.material_code && tool.material_description) {
                setSelectedMaterial({
                    id: tool.material_id.toString(),
                    code: tool.material_code,
                    description: tool.material_description,
                    unit: tool.material_unit || '',
                    priceUnit: 0,
                    isAvailable: true,
                });
                setMaterialSearch(`${tool.material_code} - ${tool.material_description}`);
            } else if (currentUser?.companyId) {
                dataService.getAvailableMaterials('', 0, 200, currentUser.companyId).then(all => {
                    const found = all.find(m => m.id.toString() === tool.material_id!.toString());
                    if (found) {
                        setSelectedMaterial(found);
                        setMaterialSearch(`${found.code} - ${found.description}`);
                    }
                });
            }
        }
    }, [tool?.material_id, tool?.material_code, tool?.material_description, currentUser?.companyId]);

    // Check if tool has movements
    useEffect(() => {
        if (tool?.id) {
            toolsService.hasToolMovements(tool.id).then(setHasMovements);
        }
    }, [tool?.id]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (materialRef.current && !materialRef.current.contains(e.target as Node)) {
                setShowMaterialDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMaterialSearchChange = (val: string) => {
        setMaterialSearch(val);
        setSelectedMaterial(null);
        setMaterialId('');
        setShowMaterialDropdown(true);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!val.trim()) {
            setMaterials([]);
            setMaterialLoading(false);
            return;
        }
        setMaterialLoading(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const results = await dataService.getAvailableMaterials(val, 0, 20, currentUser?.companyId);
                setMaterials(results);
            } catch {
                setMaterials([]);
            } finally {
                setMaterialLoading(false);
            }
        }, 350);
    };

    const handleSelectMaterial = (mat: Material) => {
        setSelectedMaterial(mat);
        setMaterialId(mat.id.toString());
        setMaterialSearch(`${mat.code} - ${mat.description}`);
        setShowMaterialDropdown(false);
        setMaterials([]);
    };

    const handleClearMaterial = () => {
        setSelectedMaterial(null);
        setMaterialId('');
        setMaterialSearch('');
        setMaterials([]);
    };

    const handleDelete = async () => {
        if (!tool?.id) return;
        setIsDeleting(true);
        try {
            await toolsService.deleteTool(tool.id, currentUser ? Number(currentUser.id) : undefined);
            toast.success('Ferramenta excluída com sucesso!');
            setDeleteModal(false);
            onDelete?.();
        } catch (error: any) {
            setModal({ isOpen: true, title: 'Erro', message: error?.message || 'Erro ao excluir ferramenta.', type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    const executeSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                code: code.trim(),
                brand: brand.trim(),
                model: model.trim(),
                serial_number: serialNumber.trim(),
                status: status as Tool['status'],
                material_id: Number(materialId),
            };
            if (tool?.id) {
                await toolsService.updateTool(tool.id, payload, currentUser ? Number(currentUser.id) : undefined);
            } else {
                await toolsService.createTool({
                    ...payload,
                    created_user_id: currentUser ? Number(currentUser.id) : undefined,
                });
            }
            onSave();
        } catch (error: any) {
            console.error('Error saving tool:', error);
            setModal({ isOpen: true, title: 'Erro', message: error?.message || 'Erro ao salvar a ferramenta.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        if (!code.trim() || !brand.trim() || !model.trim() || !serialNumber.trim()) {
            setModal({ isOpen: true, title: 'Atenção', message: 'Preencha todos os campos obrigatórios: Código, Marca, Modelo e Nr Série.', type: 'warning' });
            return;
        }
        if (!materialId) {
            setModal({ isOpen: true, title: 'Atenção', message: 'Selecione um material relacionado.', type: 'warning' });
            return;
        }

        const trimmedCode = code.trim();
        const codeExists = await toolsService.checkCodeExists(trimmedCode, tool?.id);
        if (codeExists) {
            setModal({ isOpen: true, title: 'Código Duplicado', message: 'Já existe uma ferramenta com este código. Informe um código diferente.', type: 'warning' });
            return;
        }

        const trimmedSerial = serialNumber.trim();
        const serialExists = await toolsService.checkSerialNumberExists(trimmedSerial, tool?.id);
        if (serialExists) {
            setConfirmModal(true);
            return;
        }

        await executeSave();
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-background-dark overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
                <div className="max-w-2xl mx-auto space-y-6">

                    {/* Linha 1: Código */}
                    <div>
                        <label className={labelClass}>Código *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className={inputClass}
                            placeholder="Ex: FERR-001"
                        />
                    </div>

                    {/* Linha 2: Marca + Modelo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Marca *</label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className={inputClass}
                                placeholder="Ex: Makita"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Modelo *</label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className={inputClass}
                                placeholder="Ex: Furadeira 12V"
                            />
                        </div>
                    </div>

                    {/* Linha 3: Serial + Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Nr Série *</label>
                            <input
                                type="text"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                className={inputClass}
                                placeholder="Ex: MK-123456"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Situação</label>
                            <Select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                options={[
                                    { value: 'DISPONIVEL', label: 'Disponível' },
                                    { value: 'EM_USO', label: 'Em Uso' },
                                    { value: 'MANUTENCAO', label: 'Em Manutenção' },
                                    { value: 'BAIXADA', label: 'Baixada / Inativa' }
                                ]}
                            />
                        </div>
                    </div>

                    {/* Material Relacionado - busca async */}
                    <div ref={materialRef} className="relative">
                        <label className={labelClass}>Material Relacionado *</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">search</span>
                            <input
                                type="text"
                                value={materialSearch}
                                onChange={(e) => handleMaterialSearchChange(e.target.value)}
                                onFocus={() => {
                                    if (materialSearch && !selectedMaterial) setShowMaterialDropdown(true);
                                }}
                                className={`${inputClass} pl-10 pr-10`}
                                placeholder="Buscar material por descrição ou código..."
                            />
                            {materialSearch && (
                                <button
                                    type="button"
                                    onClick={handleClearMaterial}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            )}
                        </div>

                        {selectedMaterial && (
                            <p className="mt-1.5 text-xs text-primary font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                {selectedMaterial.code} — {selectedMaterial.description}
                            </p>
                        )}
                        {!materialId && materialSearch === '' && (
                            <p className="mt-1.5 text-xs text-slate-400">Digite para buscar um material do catálogo.</p>
                        )}

                        {showMaterialDropdown && (
                            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                                {materialLoading ? (
                                    <div className="p-4 text-sm text-slate-500 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                        Buscando...
                                    </div>
                                ) : materials.length > 0 ? (
                                    <ul className="max-h-56 overflow-y-auto py-1">
                                        {materials.map(mat => (
                                            <li
                                                key={mat.id}
                                                onClick={() => handleSelectMaterial(mat)}
                                                className="px-4 py-2.5 text-sm cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between"
                                            >
                                                <span className="font-medium">{mat.code}</span>
                                                <span className="text-slate-500 dark:text-slate-400 truncate ml-2">{mat.description}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : materialSearch.trim() ? (
                                    <div className="p-4 text-sm text-slate-500">Nenhum material encontrado para "{materialSearch}".</div>
                                ) : null}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
                {tool?.id && !hasMovements && (
                    <button
                        onClick={() => setDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors mb-3 w-full justify-center"
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Excluir Ferramenta
                    </button>
                )}
                <ButtonSave
                    onSave={handleSave}
                    onCancel={onCancel}
                    isSaving={isSaving}
                    saveLabel="Salvar Ferramenta"
                />
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            <Modal
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                title="Excluir Ferramenta"
                message={`Deseja excluir a ferramenta "${tool?.brand} ${tool?.model} (${tool?.serial_number})"? Esta ação não pode ser desfeita.`}
                type="warning"
                confirmLabel="Excluir"
                onConfirm={handleDelete}
            />

            <Modal
                isOpen={confirmModal}
                onClose={() => setConfirmModal(false)}
                title="Serial Duplicado"
                message="Já existe uma ferramenta com este número de série. Deseja incluir mesmo assim?"
                type="warning"
                confirmLabel="Sim, Incluir"
                onConfirm={() => { setConfirmModal(false); executeSave(); }}
                confirmLoading={isSaving}
                confirmLoadingLabel="Salvando..."
            />
        </div>
    );
};
