import React, { useState, useEffect } from 'react';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { AlertModal } from '../../components/ui/AlertModal';
import { dataService } from '../../services/dataService';
import { toast } from 'sonner';

interface SectorData {
    id: number;
    asset_tag_id: number;
    asset_tag_sub_id: number | null;
    asset_tag_tag_sub_description: string | null;
    operation_unit: string | null;
    asset_available_rate: number | null;
    flow_rate_is_visible: boolean;
    flow_rate_unit: string | null;
    flow_rate_min: number | null;
    flow_rate_max: number | null;
    power_is_visible: boolean;
    power_unit: string | null;
    power_min: number | null;
    power_max: number | null;
    pressure_is_visible: boolean;
    pressure_unit: string | null;
    pressure_min: number | null;
    pressure_max: number | null;
    is_active: boolean;
}

interface UnitAssetTagFormProps {
    isOpen: boolean;
    onClose: () => void;
    unitId: string;
    unitDescription?: string;
    onCreated?: () => void;
    sectorData?: SectorData | null;
}

interface AssetTagOption {
    id: string;
    code: string;
    description: string;
}

interface AssetTagSubOption {
    id: string;
    parentId: string;
    code: string;
    description: string;
}

interface MeasurementRow {
    visible: boolean;
    name: string;
    min: string;
    max: string;
}

const formatDecimal = (val: string): string => {
    const digits = val.replace(/[^\d]/g, '').replace(/^0+/, '');
    if (!digits) return '0,00';
    const padded = digits.padStart(3, '0');
    return `${padded.slice(0, -2)},${padded.slice(-2)}`;
};

const MeasurementRowComponent: React.FC<{
    label: string;
    row: MeasurementRow;
    onChange: (updated: MeasurementRow) => void;
}> = ({ label, row, onChange }) => (
    <div className="flex items-center gap-2">
        <button
            type="button"
            onClick={() => onChange({ ...row, visible: !row.visible })}
            className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-5 ${
                row.visible ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    row.visible ? 'translate-x-5' : ''
                }`}
            />
        </button>
        <div className="flex-1">
            <Input
                label={label}
                value={row.name}
                onChange={(e) => onChange({ ...row, name: e.target.value })}
                placeholder="Un."
            />
        </div>
        <div className="flex-1">
            <Input
                label="Mín"
                value={row.min}
                onChange={(e) => onChange({ ...row, min: formatDecimal(e.target.value) })}
                placeholder="0,00"
            />
        </div>
        <div className="flex-1">
            <Input
                label="Máx"
                value={row.max}
                onChange={(e) => onChange({ ...row, max: formatDecimal(e.target.value) })}
                placeholder="0,00"
            />
        </div>
    </div>
);

export const UnitAssetTagForm: React.FC<UnitAssetTagFormProps> = ({
    isOpen,
    onClose,
    unitId,
    unitDescription,
    onCreated,
    sectorData
}) => {
    const [assetTags, setAssetTags] = useState<AssetTagOption[]>([]);
    const [assetTagSubs, setAssetTagSubs] = useState<AssetTagSubOption[]>([]);
    const [selectedTagId, setSelectedTagId] = useState('');
    const [selectedSubId, setSelectedSubId] = useState('');
    const [operationUnit, setOperationUnit] = useState('');
    const [availabilityRate, setAvailabilityRate] = useState('0,00000');
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingTags, setLoadingTags] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [flowRate, setFlowRate] = useState<MeasurementRow>({ visible: false, name: '', min: '0,00', max: '0,00' });
    const [power, setPower] = useState<MeasurementRow>({ visible: false, name: '', min: '0,00', max: '0,00' });
    const [pressure, setPressure] = useState<MeasurementRow>({ visible: false, name: '', min: '0,00', max: '0,00' });
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const isEditMode = !!sectorData;

    useEffect(() => {
        if (isOpen) {
            loadCurrentUser();
            loadAssetTags();
            loadAssetTagSubs();
            if (isEditMode && sectorData) {
                loadSectorData(sectorData);
            } else {
                resetForm();
            }
        }
    }, [isOpen, sectorData]);

    const loadCurrentUser = async () => {
        try {
            const user = await dataService.getCurrentUser();
            setCurrentUserId(user?.id ? parseInt(user.id) : null);
        } catch (error) {
            console.error('Failed to load current user', error);
        }
    };

    const loadSectorData = (data: SectorData) => {
        setSelectedTagId(String(data.asset_tag_id || ''));
        setSelectedSubId(String(data.asset_tag_sub_id || ''));
        setOperationUnit(data.operation_unit || '');
        setAvailabilityRate(data.asset_available_rate != null ? Number(data.asset_available_rate).toFixed(5).replace('.', ',') : '0,00000');
        setIsActive(data.is_active);
        setFlowRate({
            visible: data.flow_rate_is_visible,
            name: data.flow_rate_unit || '',
            min: data.flow_rate_min != null ? Number(data.flow_rate_min).toFixed(2).replace('.', ',') : '0,00',
            max: data.flow_rate_max != null ? Number(data.flow_rate_max).toFixed(2).replace('.', ',') : '0,00'
        });
        setPower({
            visible: data.power_is_visible,
            name: data.power_unit || '',
            min: data.power_min != null ? Number(data.power_min).toFixed(2).replace('.', ',') : '0,00',
            max: data.power_max != null ? Number(data.power_max).toFixed(2).replace('.', ',') : '0,00'
        });
        setPressure({
            visible: data.pressure_is_visible,
            name: data.pressure_unit || '',
            min: data.pressure_min != null ? Number(data.pressure_min).toFixed(2).replace('.', ',') : '0,00',
            max: data.pressure_max != null ? Number(data.pressure_max).toFixed(2).replace('.', ',') : '0,00'
        });
    };

    const resetForm = () => {
        setSelectedTagId('');
        setSelectedSubId('');
        setOperationUnit('');
        setAvailabilityRate('0,00000');
        setIsActive(true);
        setFlowRate({ visible: false, name: '', min: '0,00', max: '0,00' });
        setPower({ visible: false, name: '', min: '0,00', max: '0,00' });
        setPressure({ visible: false, name: '', min: '0,00', max: '0,00' });
    };

    const loadAssetTags = async () => {
        setLoadingTags(true);
        try {
            const tags = await dataService.getAssetTags('active');
            setAssetTags(tags.map(t => ({ id: t.id, code: t.code, description: t.description })));
        } catch (error) {
            console.error('Failed to load asset tags', error);
        } finally {
            setLoadingTags(false);
        }
    };

    const loadAssetTagSubs = async () => {
        try {
            const subs = await dataService.getAssetTagSubs(undefined, 'active');
            setAssetTagSubs(subs.map(s => ({ id: s.id, parentId: s.parentId, code: s.code, description: s.description })));
        } catch (error) {
            console.error('Failed to load asset tag subs', error);
        }
    };

    const parseNumericValue = (val: string): number => {
        const parsed = parseFloat(val.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTagId) {
            toast.error('Selecione um Setor');
            return;
        }

        if (!selectedSubId) {
            toast.error('Selecione uma Posição');
            return;
        }

        if (!availabilityRate || availabilityRate === '0,00000') {
            toast.error('Informe o Rateio da Disponibilidade');
            return;
        }

        if (flowRate.visible && (!flowRate.min || !flowRate.max)) {
            toast.error('Preencha os valores de Vazão (Mín e Máx)');
            return;
        }

        if (power.visible && (!power.min || !power.max)) {
            toast.error('Preencha os valores de Potência (Mín e Máx)');
            return;
        }

        if (pressure.visible && (!pressure.min || !pressure.max)) {
            toast.error('Preencha os valores de Pressão (Mín e Máx)');
            return;
        }

        setLoading(true);
        try {
            const tag = assetTags.find(t => t.id === selectedTagId);
            const sub = assetTagSubs.find(s => s.id === selectedSubId);
            const combinedDescription = [tag?.description, sub?.description].filter(Boolean).join(' - ');

            const payload = {
                unitId: parseInt(unitId),
                assetTagId: parseInt(selectedTagId),
                assetTagSubId: selectedSubId ? parseInt(selectedSubId) : null,
                assetTagTagSubDescription: combinedDescription,
                operationUnit: operationUnit || null,
                assetAvailableRate: parseNumericValue(availabilityRate),
                flowRateIsVisible: flowRate.visible,
                flowRateUnit: flowRate.name || null,
                flowRateMin: parseNumericValue(flowRate.min),
                flowRateMax: parseNumericValue(flowRate.max),
                powerIsVisible: power.visible,
                powerUnit: power.name || null,
                powerMin: parseNumericValue(power.min),
                powerMax: parseNumericValue(power.max),
                pressureIsVisible: pressure.visible,
                pressureUnit: pressure.name || null,
                pressureMin: parseNumericValue(pressure.min),
                pressureMax: parseNumericValue(pressure.max),
            };

            if (isEditMode && sectorData) {
                await dataService.updateUnitAssetTag(sectorData.id, {
                    ...payload,
                    isActive,
                    updatedUserId: currentUserId,
                });
                toast.success('Setor atualizado com sucesso!');
            } else {
                await dataService.createUnitAssetTag({
                    ...payload,
                    createdUserId: currentUserId,
                });
                toast.success('Setor incluído com sucesso!');
            }

            onCreated?.();
            onClose();
        } catch (error: any) {
            console.error('Failed to save unit asset tag', error);
            toast.error(error?.message || 'Erro ao salvar setor');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (!sectorData) return;
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!sectorData) return;

        setLoading(true);
        try {
            await dataService.deleteUnitAssetTag(sectorData.id, currentUserId);
            toast.success('Setor excluído com sucesso!');
            setIsDeleteConfirmOpen(false);
            onCreated?.();
            onClose();
        } catch (error: any) {
            console.error('Failed to delete unit asset tag', error);
            toast.error(error?.message || 'Erro ao excluir setor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex flex-col py-1">
                    <span className="text-[19px] font-black text-slate-900 dark:text-white uppercase leading-none tracking-tight">
                        {isEditMode ? 'Editar Setor' : 'Setorização'}
                    </span>
                </div>
            }
            maxWidth="md"
            noPadding
        >
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <Select
                    label="Setor"
                    value={selectedTagId}
                    onChange={(e) => setSelectedTagId(e.target.value)}
                    options={[
                        { value: '', label: 'Selecione o setor...' },
                        ...assetTags.map(t => ({ value: t.id, label: t.description }))
                    ]}
                    placeholder="Selecione..."
                />

                <Select
                    label="Posição"
                    value={selectedSubId}
                    onChange={(e) => setSelectedSubId(e.target.value)}
                    options={[
                        { value: '', label: 'Selecione a posição...' },
                        ...assetTagSubs.map(s => {
                            const parentTag = assetTags.find(t => t.id === s.parentId);
                            return { value: s.id, label: parentTag ? `${parentTag.description} - ${s.description}` : s.description };
                        })
                    ]}
                    placeholder="Selecione..."
                />

                <Input
                    label="Unidade Operação (km, h e etc)"
                    value={operationUnit}
                    onChange={(e) => setOperationUnit(e.target.value)}
                    placeholder="Ex: km, h, m³"
                />

                {isEditMode && (
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Ativo
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    isActive ? 'translate-x-6' : ''
                                }`}
                            />
                        </button>
                    </div>
                )}

                <div className="space-y-2">
                    <MeasurementRowComponent label="Vazão" row={flowRate} onChange={setFlowRate} />
                    <MeasurementRowComponent label="Potência" row={power} onChange={setPower} />
                    <MeasurementRowComponent label="Pressão" row={pressure} onChange={setPressure} />
                </div>

                <Input
                    label="Rateio disponibilidade (0 a 1)"
                    value={availabilityRate}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^\d,]/g, '');
                        const parts = val.split(',');
                        if (parts.length > 2) return;
                        if (parts[1] && parts[1].length > 5) return;
                        setAvailabilityRate(val);
                    }}
                    onBlur={() => {
                        const num = parseFloat(availabilityRate.replace(',', '.'));
                        if (isNaN(num)) {
                            setAvailabilityRate('0,00000');
                        } else {
                            const clamped = Math.max(0, Math.min(1, num));
                            setAvailabilityRate(clamped.toFixed(5).replace('.', ','));
                        }
                    }}
                    placeholder="0,00000"
                />

                <div className="pt-2 space-y-2">
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={loading}
                    >
                        {isEditMode ? 'CONFIRMAR EDIÇÃO' : 'INCLUIR'}
                    </Button>

                    {isEditMode && (
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            loading={loading}
                            onClick={handleDelete}
                            className="!bg-red-500 hover:!bg-red-600 !text-white !shadow-lg !shadow-red-500/25"
                        >
                            EXCLUIR
                        </Button>
                    )}
                </div>
            </form>
        </Modal>

        <AlertModal
            isOpen={isDeleteConfirmOpen}
            onClose={() => setIsDeleteConfirmOpen(false)}
            title="Excluir Setor"
            description="Tem certeza que deseja excluir este setor? Esta ação não poderá ser desfeita."
            icon="delete"
            primaryAction={{
                label: 'EXCLUIR',
                icon: 'delete',
                onClick: confirmDelete,
                variant: 'danger',
                loading: loading
            }}
            secondaryAction={{
                label: 'CANCELAR',
                onClick: () => setIsDeleteConfirmOpen(false),
                variant: 'secondary'
            }}
            isLoading={loading}
        />
    </>
    );
};
