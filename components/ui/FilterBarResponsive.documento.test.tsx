import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBarResponsive } from './FilterBarResponsive';

jest.mock('../../hooks/useMediaQuery', () => ({ useMediaQuery: () => true }));

const options = { systems: [], unitTypes: [], units: [], sectors: [], orderObjects: [], orderTypes: [], contracts: [], teams: [], causeReasons: [], plans: [], subSystems: [], maintenancePlans: [] };
const baseProps = {
    advancedFilters: {} as Record<string, any>,
    setAdvancedFilters: jest.fn(),
    filterSelectOptions: options,
    handleSystemChange: jest.fn(),
    handleParentUnitTypeChange: jest.fn(),
    handleOrderTypeChange: jest.fn(),
    handleSectorChange: jest.fn(),
    unitSubTypes: [],
    assetTagSubOptions: [],
    orderSubTypes: [],
};

describe('FilterBarResponsive — filtro Documento', () => {
    it('não exibe o filtro por padrão', () => {
        render(<FilterBarResponsive {...baseProps} />);
        expect(screen.queryByText('DOCUMENTO')).toBeNull();
    });

    it('mostra "Todos" quando vazio e o valor quando preenchido', () => {
        const { rerender } = render(<FilterBarResponsive {...baseProps} showDocumentFilter />);
        expect(screen.getByText('DOCUMENTO')).toBeTruthy();
        rerender(<FilterBarResponsive {...baseProps} showDocumentFilter advancedFilters={{ requestedServicesDoc: '123/2026' }} />);
        expect(screen.getByText('123/2026')).toBeTruthy();
    });

    it('abre o modal padrão com input e confirma o texto digitado', () => {
        const setAdvancedFilters = jest.fn();
        render(<FilterBarResponsive {...baseProps} setAdvancedFilters={setAdvancedFilters} showDocumentFilter />);
        fireEvent.click(screen.getByText('DOCUMENTO'));
        fireEvent.change(screen.getByLabelText('Documento'), { target: { value: '  123/2026 ' } });
        fireEvent.click(screen.getByText('Confirmar'));
        const updater = setAdvancedFilters.mock.calls[0][0];
        expect(updater({ unitId: ['1'] })).toEqual({ unitId: ['1'], requestedServicesDoc: '123/2026' });
    });
});
