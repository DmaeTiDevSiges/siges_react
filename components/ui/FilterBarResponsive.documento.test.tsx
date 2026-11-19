import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBarResponsive } from './FilterBarResponsive';

jest.mock('../../hooks/useMediaQuery', () => ({ useMediaQuery: () => true }));

const baseProps = {
    advancedFilters: {} as Record<string, any>,
    setAdvancedFilters: jest.fn(),
    filterSelectOptions: {},
    handleSystemChange: jest.fn(),
    handleParentUnitTypeChange: jest.fn(),
    handleOrderTypeChange: jest.fn(),
    handleSectorChange: jest.fn(),
    unitSubTypes: [],
    assetTagSubOptions: [],
    orderSubTypes: [],
};

describe('FilterBarResponsive — filtro Documento', () => {
    it('não exibe o campo por padrão', () => {
        render(<FilterBarResponsive {...baseProps} filterSelectOptions={{ systems: [], unitTypes: [], units: [], sectors: [], orderObjects: [], orderTypes: [], contracts: [], teams: [], causeReasons: [], plans: [], subSystems: [], maintenancePlans: [] }} />);
        expect(screen.queryByLabelText('Filtrar por Documento')).toBeNull();
    });

    it('exibe o campo e propaga o texto digitado para os filtros avançados', () => {
        const setAdvancedFilters = jest.fn();
        render(<FilterBarResponsive {...baseProps} setAdvancedFilters={setAdvancedFilters} showDocumentFilter filterSelectOptions={{ systems: [], unitTypes: [], units: [], sectors: [], orderObjects: [], orderTypes: [], contracts: [], teams: [], causeReasons: [], plans: [], subSystems: [], maintenancePlans: [] }} />);
        fireEvent.change(screen.getByLabelText('Filtrar por Documento'), { target: { value: '123/2026' } });
        const updater = setAdvancedFilters.mock.calls[0][0];
        expect(updater({ unitId: ['1'] })).toEqual({ unitId: ['1'], requestedServicesDoc: '123/2026' });
    });
});
