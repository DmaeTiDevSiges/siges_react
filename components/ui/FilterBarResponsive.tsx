import React, { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { FilterSelect } from './FilterSelect';
import { TreeFilterSelect } from './TreeFilterSelect';
import { FilterSelectionContent } from './FilterSelectionContent';
import { Modal } from './Modal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';

export interface FilterBarResponsiveHandle {
    openMobileFilters: () => void;
    totalActiveFilters: number;
}

interface FilterBarResponsiveProps {
    advancedFilters: Record<string, any>;
    setAdvancedFilters: React.Dispatch<React.SetStateAction<any>>;
    filterSelectOptions: Record<string, any>;
    handleSystemChange: (id: string | string[]) => void;
    handleParentUnitTypeChange: (id: string | string[]) => void;
    handleOrderTypeChange: (id: string | string[]) => void;
    handleSectorChange: (id: string | string[]) => void;
    unitSubTypes: any[];
    assetTagSubOptions: any[];
    orderSubTypes: any[];
    onApply?: () => void;
    onActiveFiltersChange?: (count: number) => void;
    children?: React.ReactNode;
}

export const FilterBarResponsive = forwardRef<FilterBarResponsiveHandle, FilterBarResponsiveProps>(({
    advancedFilters,
    setAdvancedFilters,
    filterSelectOptions,
    handleSystemChange,
    handleParentUnitTypeChange,
    handleOrderTypeChange,
    handleSectorChange,
    unitSubTypes,
    assetTagSubOptions,
    orderSubTypes,
    onApply,
    onActiveFiltersChange,
    children,
}, ref) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const filtersScroll = useDraggableScroll();
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    const [selectionModal, setSelectionModal] = useState<{
        isOpen: boolean;
        filterKey: string;
        label: string;
        options: { value: string; label: string }[];
        currentValue: string[];
    }>({
        isOpen: false,
        filterKey: '',
        label: '',
        options: [],
        currentValue: []
    });

    const openSelectionModal = useCallback((key: string, label: string, options: { value: string; label: string }[]) => {
        const value = advancedFilters[key];
        const currentValue = Array.isArray(value)
            ? (value as any[]).map(String)
            : (value !== undefined && value !== null ? [String(value)] : []);

        setSelectionModal({ isOpen: true, filterKey: key, label, options, currentValue });
    }, [advancedFilters]);

    const handleModalConfirm = useCallback((value: string[]) => {
        const key = selectionModal.filterKey;
        if (key === 'systemParentId') {
            handleSystemChange(value);
        } else if (key === 'unitTypeParentId') {
            handleParentUnitTypeChange(value);
        } else if (key === 'orderTypeId') {
            handleOrderTypeChange(value);
        } else {
            setAdvancedFilters((prev: any) => ({ ...prev, [key]: value }));
        }
        setSelectionModal(prev => ({ ...prev, isOpen: false }));
    }, [selectionModal.filterKey, setAdvancedFilters, handleSystemChange, handleParentUnitTypeChange, handleOrderTypeChange]);

    const totalActiveFilters = useMemo(() => {
        const keys = [
            'systemParentId', 'systemId', 'unitTypeParentId', 'unitTypeId',
            'unitId', 'assetTagId', 'assetTagSubId', 'orderObjectId',
            'orderTypeId', 'orderTypeSubId', 'contractId', 'orderPlanId', 'orderTeamId'
        ];
        return keys.reduce((count, key) => {
            const val = advancedFilters[key];
            if (Array.isArray(val)) return count + val.length;
            if (val) return count + 1;
            return count;
        }, 0);
    }, [advancedFilters]);

    const openMobileFilter = useCallback((key: string, label: string, options: { value: string; label: string }[]) => {
        openSelectionModal(key, label, options);
    }, [openSelectionModal]);

    useImperativeHandle(ref, () => ({
        openMobileFilters: () => setIsMobileFiltersOpen(true),
        totalActiveFilters,
    }), [totalActiveFilters]);

    React.useEffect(() => {
        onActiveFiltersChange?.(totalActiveFilters);
    }, [totalActiveFilters, onActiveFiltersChange]);

    // ── DESKTOP: horizontal scrollable bar ──
    if (isDesktop) {
        return (
            <div
                className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0 cursor-grab active:cursor-grabbing touch-auto px-1"
                ref={filtersScroll.ref}
                onMouseDown={filtersScroll.onMouseDown}
                onTouchStart={filtersScroll.onTouchStart}
                onClickCapture={filtersScroll.onClickCapture}
            >
                <FilterSelect label="SISTEMA" value={advancedFilters.systemParentId || []} onClick={() => openSelectionModal('systemParentId', 'SISTEMA', filterSelectOptions.systems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleSystemChange([])} />
                <FilterSelect label="SUB-SISTEMA" value={advancedFilters.systemId || []} onClick={() => openSelectionModal('systemId', 'SUB-SISTEMA', filterSelectOptions.subSystems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, systemId: [] }))} hidden={!advancedFilters.systemParentId || (Array.isArray(advancedFilters.systemParentId) && advancedFilters.systemParentId.length === 0)} />
                <FilterSelect label="TIPO UNIDADE" value={advancedFilters.unitTypeParentId || []} onClick={() => openSelectionModal('unitTypeParentId', 'TIPO UNIDADE', filterSelectOptions.unitTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleParentUnitTypeChange([])} />
                <FilterSelect label="SUB-TIPO UNIDADE" value={advancedFilters.unitTypeId || []} onClick={() => openSelectionModal('unitTypeId', 'SUB-TIPO UNIDADE', unitSubTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, unitTypeId: [] }))} hidden={!advancedFilters.unitTypeParentId || (Array.isArray(advancedFilters.unitTypeParentId) && advancedFilters.unitTypeParentId.length === 0)} />
                <FilterSelect label="UNIDADES" value={advancedFilters.unitId || []} onClick={() => openSelectionModal('unitId', 'UNIDADES', filterSelectOptions.units.map((opt: any) => ({ value: String(opt.id), label: opt.description_full || opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, unitId: [] }))} />
                <FilterSelect label="SETORES" value={advancedFilters.assetTagId || []} onClick={() => openSelectionModal('assetTagId', 'SETORES', filterSelectOptions.sectors.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleSectorChange([])} />
                <FilterSelect label="POSIÇÕES" value={advancedFilters.assetTagSubId || []} onClick={() => openSelectionModal('assetTagSubId', 'POSIÇÕES', assetTagSubOptions.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, assetTagSubId: [] }))} hidden={!advancedFilters.assetTagId || (Array.isArray(advancedFilters.assetTagId) && advancedFilters.assetTagId.length === 0)} />
                <FilterSelect label="FINALIDADE" value={advancedFilters.orderObjectId || []} onClick={() => openSelectionModal('orderObjectId', 'FINALIDADE', filterSelectOptions.orderObjects.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, orderObjectId: [] }))} />
                <FilterSelect label="TIPO OS" value={advancedFilters.orderTypeId || []} onClick={() => openSelectionModal('orderTypeId', 'TIPO OS', filterSelectOptions.orderTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleOrderTypeChange([])} />
                <FilterSelect label="SUB-TIPO OS" value={advancedFilters.orderTypeSubId || []} onClick={() => openSelectionModal('orderTypeSubId', 'SUB-TIPO OS', orderSubTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, orderTypeSubId: [] }))} hidden={!advancedFilters.orderTypeId || (Array.isArray(advancedFilters.orderTypeId) && advancedFilters.orderTypeId.length === 0)} />
                <FilterSelect label="CONTRATO" value={advancedFilters.contractId || []} onClick={() => openSelectionModal('contractId', 'CONTRATO', filterSelectOptions.contracts.map((opt: any) => ({ value: String(opt.id), label: opt.description || opt.code || 'S/N' })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, contractId: [] }))} required />
                <FilterSelect label="PLANO" value={advancedFilters.orderPlanId || []} onClick={() => openSelectionModal('orderPlanId', 'PLANO', filterSelectOptions.plans.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, orderPlanId: [] }))} />
                <TreeFilterSelect label="EQ.RESPONSAVEL" value={advancedFilters.orderTeamId || []} options={filterSelectOptions.teams.map((opt: any) => ({ value: String(opt.id), label: opt.name || opt.description, parentId: opt.parentId }))} onChange={(vals) => setAdvancedFilters((prev: any) => ({ ...prev, orderTeamId: vals }))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, orderTeamId: [] }))} />

                {children}

                <Modal isOpen={selectionModal.isOpen} onClose={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))} title={`Filtrar por ${selectionModal.label}`} maxWidth="md">
                    <FilterSelectionContent label={selectionModal.label} options={selectionModal.options} initialValue={selectionModal.currentValue} onConfirm={handleModalConfirm} />
                </Modal>
            </div>
        );
    }

    // ── MOBILE: no inline trigger — trigger lives in the Header via ref ──
    return (
        <>
            <Modal
                isOpen={isMobileFiltersOpen}
                onClose={() => setIsMobileFiltersOpen(false)}
                title="FILTROS"
                maxWidth="md"
                fullScreenMobile
                draggable
            >
                <div className="flex flex-col gap-3">
                    <FilterSelect variant="vertical" label="SISTEMA" value={advancedFilters.systemParentId || []} onClick={() => openMobileFilter('systemParentId', 'SISTEMA', filterSelectOptions.systems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleSystemChange([])} />
                    <FilterSelect variant="vertical" label="SUB-SISTEMA" value={advancedFilters.systemId || []} onClick={() => openMobileFilter('systemId', 'SUB-SISTEMA', filterSelectOptions.subSystems.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, systemId: [] }))} hidden={!advancedFilters.systemParentId || (Array.isArray(advancedFilters.systemParentId) && advancedFilters.systemParentId.length === 0)} />
                    <FilterSelect variant="vertical" label="TIPO UNIDADE" value={advancedFilters.unitTypeParentId || []} onClick={() => openMobileFilter('unitTypeParentId', 'TIPO UNIDADE', filterSelectOptions.unitTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleParentUnitTypeChange([])} />
                    <FilterSelect variant="vertical" label="SUB-TIPO UNIDADE" value={advancedFilters.unitTypeId || []} onClick={() => openMobileFilter('unitTypeId', 'SUB-TIPO UNIDADE', unitSubTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, unitTypeId: [] }))} hidden={!advancedFilters.unitTypeParentId || (Array.isArray(advancedFilters.unitTypeParentId) && advancedFilters.unitTypeParentId.length === 0)} />
                    <FilterSelect variant="vertical" label="UNIDADES" value={advancedFilters.unitId || []} onClick={() => openMobileFilter('unitId', 'UNIDADES', filterSelectOptions.units.map((opt: any) => ({ value: String(opt.id), label: opt.description_full || opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, unitId: [] }))} />
                    <FilterSelect variant="vertical" label="SETORES" value={advancedFilters.assetTagId || []} onClick={() => openMobileFilter('assetTagId', 'SETORES', filterSelectOptions.sectors.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleSectorChange([])} />
                    <FilterSelect variant="vertical" label="POSIÇÕES" value={advancedFilters.assetTagSubId || []} onClick={() => openMobileFilter('assetTagSubId', 'POSIÇÕES', assetTagSubOptions.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, assetTagSubId: [] }))} hidden={!advancedFilters.assetTagId || (Array.isArray(advancedFilters.assetTagId) && advancedFilters.assetTagId.length === 0)} />
                    <FilterSelect variant="vertical" label="FINALIDADE" value={advancedFilters.orderObjectId || []} onClick={() => openMobileFilter('orderObjectId', 'FINALIDADE', filterSelectOptions.orderObjects.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, orderObjectId: [] }))} />
                    <FilterSelect variant="vertical" label="TIPO OS" value={advancedFilters.orderTypeId || []} onClick={() => openMobileFilter('orderTypeId', 'TIPO OS', filterSelectOptions.orderTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => handleOrderTypeChange([])} />
                    <FilterSelect variant="vertical" label="SUB-TIPO OS" value={advancedFilters.orderTypeSubId || []} onClick={() => openMobileFilter('orderTypeSubId', 'SUB-TIPO OS', orderSubTypes.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, orderTypeSubId: [] }))} hidden={!advancedFilters.orderTypeId || (Array.isArray(advancedFilters.orderTypeId) && advancedFilters.orderTypeId.length === 0)} />
                    <FilterSelect variant="vertical" label="CONTRATO" value={advancedFilters.contractId || []} onClick={() => openMobileFilter('contractId', 'CONTRATO', filterSelectOptions.contracts.map((opt: any) => ({ value: String(opt.id), label: opt.description || opt.code || 'S/N' })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, contractId: [] }))} required />
                    <FilterSelect variant="vertical" label="PLANO" value={advancedFilters.orderPlanId || []} onClick={() => openMobileFilter('orderPlanId', 'PLANO', filterSelectOptions.plans.map((opt: any) => ({ value: String(opt.id), label: opt.description })))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, orderPlanId: [] }))} />
                    <TreeFilterSelect label="EQ.RESPONSAVEL" value={advancedFilters.orderTeamId || []} options={filterSelectOptions.teams.map((opt: any) => ({ value: String(opt.id), label: opt.name || opt.description, parentId: opt.parentId }))} onChange={(vals) => setAdvancedFilters((prev: any) => ({ ...prev, orderTeamId: vals }))} onClear={() => setAdvancedFilters((prev: any) => ({ ...prev, orderTeamId: [] }))} />

                    {onApply && (
                        <button
                            onClick={() => { onApply(); setIsMobileFiltersOpen(false); }}
                            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-primary-dark active:scale-95 transition-all shadow-lg shadow-primary/20 mt-2"
                        >
                            Aplicar Filtros
                        </button>
                    )}
                </div>

                {children}
            </Modal>

            <Modal isOpen={selectionModal.isOpen} onClose={() => setSelectionModal(prev => ({ ...prev, isOpen: false }))} title={`Filtrar por ${selectionModal.label}`} maxWidth="md">
                <FilterSelectionContent label={selectionModal.label} options={selectionModal.options} initialValue={selectionModal.currentValue} onConfirm={handleModalConfirm} />
            </Modal>
        </>
    );
});
