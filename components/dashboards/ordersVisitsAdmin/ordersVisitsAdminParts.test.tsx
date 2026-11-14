import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('../../reports/BatchVisitReportPDFButton', () => ({ BatchVisitReportPDFButton: () => <span>pdf-lote</span> }));

import { mapVisitRow } from './mapVisitRow';
import { InsightsBar, InsightsDoughnut } from './InsightsCharts';
import { StatCard } from './StatCard';
import { VisitsDashboardSkeleton } from './VisitsDashboardSkeleton';

describe('mapVisitRow', () => {
    const row = {
        id: 12, o_id: 7, ov_mask: 'V-1', ov_o_progress: '0.5', ov_duration_hours: '2.5',
        ov_services_value: '100', ov_materials_value: null, ov_total_value: '100',
        o_system_id: 3, o_parent_id: '9', o_plan_description: 'Plano A', o_system_description: 'Elétrica',
        client_name: 'Cliente X', o_client_name: 'Outro',
    };

    it('converte ids em texto e números de texto em número', () => {
        const v = mapVisitRow(row);
        expect(v.id).toBe('12');
        expect(v.oId).toBe('7');
        expect(v.systemId).toBe('3');
        expect(v.parentId).toBe(9);
        expect(v.ovDurationHours).toBe(2.5);
        expect(v.servicesValue).toBe(100);
        expect(v.materialsValue).toBe(0);
    });

    it('progresso vira percentual inteiro; sem valor, 0', () => {
        expect(mapVisitRow(row).progress).toBe(50);
        expect(mapVisitRow({ ...row, ov_o_progress: null }).progress).toBe(0);
    });

    it('prefere client_name e cai para o_client_name; setor cai para o sistema', () => {
        expect(mapVisitRow(row).clientName).toBe('Cliente X');
        expect(mapVisitRow({ ...row, client_name: undefined }).clientName).toBe('Outro');
        expect(mapVisitRow(row).sectorDescription).toBe('Elétrica');
        expect(mapVisitRow({ ...row, o_parent_id: null }).parentId).toBeNull();
    });
});

describe('gráficos de insights', () => {
    it('InsightsBar lista cada item com o valor em moeda', () => {
        render(<InsightsBar data={[{ label: 'Mão de obra', value: 1500 }, { label: 'Materiais', value: 500 }]} />);
        expect(screen.getByText('Mão de obra')).toBeInTheDocument();
        expect(screen.getByText('Materiais')).toBeInTheDocument();
        expect(screen.getAllByText(/R\$/).length).toBeGreaterThanOrEqual(2);
    });

    it('InsightsDoughnut desenha uma fatia por valor e mostra o total; sem total não desenha fatias', () => {
        const { container, rerender } = render(<InsightsDoughnut data={[{ label: 'A', value: 30, color: '#f00' }, { label: 'B', value: 70, color: '#0f0' }]} />);
        expect(container.querySelectorAll('path').length).toBe(2);
        expect(screen.getByText('Total')).toBeInTheDocument();
        rerender(<InsightsDoughnut data={[{ label: 'A', value: 0, color: '#f00' }]} />);
        expect(container.querySelectorAll('path').length).toBe(0);
    });
});

describe('StatCard', () => {
    it('mostra rótulo e contagem e chama onClick', () => {
        const onClick = jest.fn();
        render(<StatCard icon="check" label="Autorizadas" count={4} color="text-blue-500" onClick={onClick} />);
        expect(screen.getByText('Autorizadas')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Autorizadas'));
        expect(onClick).toHaveBeenCalled();
    });
});

describe('VisitsDashboardSkeleton', () => {
    it('renderiza sem dados', () => {
        const { container } = render(<VisitsDashboardSkeleton />);
        expect(container.firstChild).not.toBeNull();
    });
});
