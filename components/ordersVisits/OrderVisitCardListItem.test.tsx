import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

const mockUi = { isV2: false };
jest.mock('../../contexts/UiVersionContext', () => ({ useUiVersion: () => ({ isV2: mockUi.isV2 }) }));
jest.mock('../reports/VisitReportPDFButton', () => ({
    VisitReportPDFButton: (p: { visitId: string; visitMask?: string }) => <button data-testid="pdf" data-visit={p.visitId} data-mask={p.visitMask}>PDF</button>,
}));
jest.mock('./OrderVisitProcessingButton', () => ({ OrderVisitProcessingButton: () => null }));

import { OrderVisitCardListItem } from './OrderVisitCardListItem';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import type { OrderVisit } from '../../types';

const visit = (over: Partial<Record<string, unknown>> = {}) => ({
    id: '42', ovMask: 'V-0042', clientName: 'Cliente Beta', unitDescription: 'Loja Centro',
    ovStartedAt: '2026-11-10T09:00:00', ovEndedAt: '2026-11-10T11:30:00',
    teamCode: 'EQ-1', teamLeaderName: 'Maria', planDescription: 'Preventiva mensal',
    processingDescription: 'Reportada', statusDescription: 'Em andamento', ovOStatusId: 5, ovOStatusDescription: 'Execução',
    totalValue: 1234.5, progress: 60, ...over,
}) as unknown as OrderVisit;

/** Compara ignorando o tipo de espaço (o formatCurrency usa espaço "não separável" depois do R$). */
const money = (value: number) => {
    const norm = (t: string) => t.replace(/\s+/g, ' ').trim();
    return (_c: string, el: Element | null) => norm(el?.textContent ?? '') === norm(formatCurrency(value)) && !el?.children.length;
};

const renderCard = (v = visit(), onClick = jest.fn()) => {
    const utils = render(<OrderVisitCardListItem visit={v} onClick={onClick} />);
    return { ...utils, onClick };
};

beforeEach(() => { mockUi.isV2 = false; });

describe('OrderVisitCardListItem — visual atual (v1)', () => {
    it('mostra número, cliente, unidade, datas e equipe com o líder', () => {
        renderCard();
        expect(screen.getByText('V-0042')).toBeInTheDocument();
        expect(screen.getByText('Cliente Beta')).toBeInTheDocument();
        expect(screen.getByText('Loja Centro')).toBeInTheDocument();
        expect(screen.getByText(`${formatDateTime('2026-11-10T09:00:00')} - ${formatDateTime('2026-11-10T11:30:00')}`)).toBeInTheDocument();
        expect(screen.getByText('EQ-1 | Maria')).toBeInTheDocument();
    });

    it('usa o id do item e dispara onClick ao clicar no cartão', () => {
        const { container, onClick } = renderCard();
        expect(container.querySelector('#visit-item-42')).toBeInTheDocument();
        fireEvent.click(screen.getByText('V-0042'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('sem cliente não mostra a linha do cliente; sem unidade mostra N/A; sem líder mostra só a equipe; sem equipe "---"', () => {
        renderCard(visit({ clientName: undefined, unitDescription: undefined, teamLeaderName: undefined }));
        expect(screen.queryByText('Cliente Beta')).not.toBeInTheDocument();
        expect(screen.getByText('N/A')).toBeInTheDocument();
        expect(screen.getByText('EQ-1')).toBeInTheDocument();
        renderCard(visit({ teamCode: undefined, teamLeaderName: undefined }));
        expect(screen.getByText('---')).toBeInTheDocument();
    });

    it('descrição do plano em maiúsculas, só quando existe', () => {
        const { unmount } = renderCard();
        expect(screen.getByText('PREVENTIVA MENSAL')).toBeInTheDocument();
        unmount();
        renderCard(visit({ planDescription: undefined }));
        expect(screen.queryByText(/PREVENTIVA/)).not.toBeInTheDocument();
    });

    it('status de processamento da visita, com o status geral como reserva', () => {
        const { unmount } = renderCard();
        expect(screen.getByText('Reportada')).toBeInTheDocument();
        unmount();
        renderCard(visit({ processingDescription: undefined }));
        expect(screen.getByText('Em andamento')).toBeInTheDocument();
    });

    it('status da OS: escondido quando é 8; usa a descrição ou o rótulo padrão do status', () => {
        const a = renderCard(visit({ ovOStatusId: 8 }));
        expect(screen.queryByText('Execução')).not.toBeInTheDocument();
        a.unmount();
        const b = renderCard(visit({ ovOStatusDescription: undefined, ovOStatusId: 4 }));
        expect(screen.getByText('Agendadas')).toBeInTheDocument();
        b.unmount();
        renderCard(visit({ ovOStatusDescription: 'Em execução' }));
        expect(screen.getByText('Em execução')).toBeInTheDocument();
    });

    it('motivo da suspensão só quando a OS está suspensa (6)', () => {
        const a = renderCard(visit({ ovOStatusId: 6, ovOStatusDescription: 'Suspensa', ovOSuspendedReasonDescription: 'Falta de peça' }));
        expect(screen.getByText('Falta de peça')).toBeInTheDocument();
        a.unmount();
        renderCard(visit({ ovOStatusId: 5, ovOSuspendedReasonDescription: 'Falta de peça' }));
        expect(screen.queryByText('Falta de peça')).not.toBeInTheDocument();
    });

    it('botão de PDF recebe a visita e o número; clicar nele NÃO abre a visita', () => {
        const { onClick } = renderCard();
        const pdf = screen.getByTestId('pdf');
        expect(pdf).toHaveAttribute('data-visit', '42');
        expect(pdf).toHaveAttribute('data-mask', 'V-0042');
        fireEvent.click(pdf);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('valor só aparece quando maior que zero, formatado em reais', () => {
        const { unmount } = renderCard();
        expect(screen.getByText(money(1234.5))).toBeInTheDocument();
        unmount();
        renderCard(visit({ totalValue: 0 }));
        expect(screen.queryByText(money(0))).not.toBeInTheDocument();
    });

    it('progresso: porcentagem e barra com a largura certa; sem progresso, nada', () => {
        const { container, unmount } = renderCard();
        expect(screen.getByText('60%')).toBeInTheDocument();
        expect(container.querySelector('[style*="width: 60%"]')).toBeInTheDocument();
        unmount();
        renderCard(visit({ progress: undefined }));
        expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    });
});

describe('OrderVisitCardListItem — visual novo (v2)', () => {
    beforeEach(() => { mockUi.isV2 = true; });

    it('só usa os tokens do design system: sem caixa alta, sem fonte de 9–11 px e sem cores fixas', () => {
        const { container } = renderCard();
        const html = container.innerHTML;
        expect(html).not.toMatch(/uppercase|tracking-widest|tracking-wider/);
        expect(html).not.toMatch(/text-\[(9|10|11)px\]/);
        expect(html).not.toMatch(/\b(bg-white|text-white|text-black)\b/);
        expect(html).not.toMatch(/-(slate|emerald|blue|red|rose|green|indigo|orange|yellow)-\d{2,3}/);
        expect(html).toMatch(/bg-surface/);
    });

    it('mostra os mesmos dados do atual, mas "Cliente · Unidade" numa linha e o plano em caixa normal', () => {
        renderCard();
        expect(screen.getByText('V-0042')).toBeInTheDocument();
        expect(screen.getByText('Cliente Beta · Loja Centro')).toBeInTheDocument();
        expect(screen.getByText(`${formatDateTime('2026-11-10T09:00:00')} - ${formatDateTime('2026-11-10T11:30:00')}`)).toBeInTheDocument();
        expect(screen.getByText('EQ-1 · Maria')).toBeInTheDocument();
        expect(screen.getByText('Preventiva mensal')).toBeInTheDocument();
        expect(screen.getByText(money(1234.5))).toBeInTheDocument();
    });

    it('sem cliente mostra só a unidade; sem unidade, N/A; sem equipe, "---"', () => {
        renderCard(visit({ clientName: undefined }));
        expect(screen.getByText('Loja Centro')).toBeInTheDocument();
        renderCard(visit({ unitDescription: undefined, clientName: undefined }));
        expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
        renderCard(visit({ teamCode: undefined, teamLeaderName: undefined }));
        expect(screen.getByText('---')).toBeInTheDocument();
    });

    it('é operável por teclado: um botão com o número da visita abre a visita (Enter/Espaço nativos)', () => {
        const { onClick } = renderCard();
        const open = screen.getByRole('button', { name: /V-0042/ });
        open.focus();
        fireEvent.click(open);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('o clique no resto do cartão também abre, uma única vez (sem duplicar com o botão)', () => {
        const { onClick } = renderCard();
        fireEvent.click(screen.getByText('Cliente Beta · Loja Centro'));
        expect(onClick).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: /V-0042/ }));
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('o PDF não fica dentro do botão que abre a visita e não abre a visita ao clicar', () => {
        const { onClick } = renderCard();
        expect(screen.getByRole('button', { name: /V-0042/ })).not.toContainElement(screen.getByTestId('pdf'));
        fireEvent.click(screen.getByTestId('pdf'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('sem onClick o número é só texto (sem botão falso)', () => {
        render(<OrderVisitCardListItem visit={visit()} />);
        expect(screen.queryByRole('button', { name: /V-0042/ })).not.toBeInTheDocument();
        expect(screen.getByText('V-0042')).toBeInTheDocument();
    });

    it('status da visita em chip neutro; status da OS em chip de informação, ou de alerta se suspensa; escondido no 8', () => {
        const a = renderCard();
        expect(screen.getByText('Reportada')).toHaveClass('bg-surface-2');
        expect(screen.getByText('Execução')).toHaveClass('bg-info-soft', 'text-info');
        a.unmount();
        const b = renderCard(visit({ ovOStatusId: 6, ovOStatusDescription: 'Suspensa', ovOSuspendedReasonDescription: 'Falta de peça' }));
        expect(screen.getByText('Suspensa')).toHaveClass('bg-warning-soft', 'text-warning');
        expect(screen.getByText('Falta de peça')).toBeInTheDocument();
        b.unmount();
        renderCard(visit({ ovOStatusId: 8 }));
        expect(screen.queryByText('Execução')).not.toBeInTheDocument();
    });

    it('valor em chip de sucesso, só quando maior que zero', () => {
        const a = renderCard();
        expect(screen.getByText(money(1234.5))).toHaveClass('bg-success-soft', 'text-success');
        a.unmount();
        renderCard(visit({ totalValue: 0 }));
        expect(screen.queryByText(money(0))).not.toBeInTheDocument();
    });

    it('progresso como barra acessível (role=progressbar) com porcentagem escrita', () => {
        renderCard();
        const bar = screen.getByRole('progressbar', { name: 'Progresso da visita' });
        expect(bar).toHaveAttribute('aria-valuenow', '60');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
        expect(within(bar.parentElement as HTMLElement).getByText('60%')).toBeInTheDocument();
    });

    it('sem progresso não mostra a barra', () => {
        renderCard(visit({ progress: undefined }));
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
});
