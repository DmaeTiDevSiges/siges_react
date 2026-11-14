import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockUi = { isV2: false };
const mockData = { getUsers: jest.fn() };
const mockToast = { error: jest.fn() };
jest.mock('../../contexts/UiVersionContext', () => ({ useUiVersion: () => ({ isV2: mockUi.isV2 }) }));
jest.mock('../../services/dataService', () => ({ dataService: { getUsers: (...a: unknown[]) => mockData.getUsers(...a) } }));
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToast.error(...a) } }));
jest.mock('./OrderVisitProcessingButton', () => ({
    OrderVisitProcessingButton: (p: { processingId?: number }) => <div data-testid="processing" data-id={p.processingId} />,
}));
jest.mock('../ui/UserAvatar', () => ({ UserAvatar: (p: { name: string }) => <div data-testid="avatar">{p.name}</div> }));

import { OrderVisitCardDetail } from './OrderVisitCardDetail';
import { formatDateTime } from '../../utils/formatters';
import type { OrderVisit } from '../../types';

const visit = (over: Record<string, unknown> = {}) => ({
    id: '7', ovMask: '12.03.2026', ovOStatusId: 5, ovOStatusDescription: 'Execução', progress: 40,
    clientName: 'Cliente Beta', unitDescription: 'Loja Centro', assetTagDescription: 'Cozinha', assetTagSubDescription: 'Bancada 2',
    requestedServices: 'Trocar compressor', teamCode: 'EQ-1', contractDescription: 'Contrato Gama', planDescription: 'Preventiva',
    ovStartedAt: '2026-11-10T09:00:00', ovEndedAt: '2026-11-10T11:00:00', ovStatusId: 1, ovProcessingId: 1, isFiled: false,
    ovTeamLeadId: 'lead', providerDepartmentId: 'D1', ...over,
}) as unknown as OrderVisit;

const team = [
    { userId: 'lead', userName: 'Maria Souza', isLeader: true, userIsAvailable: true },
    { userId: 'u2', userName: 'João Lima', isLeader: false, userIsAvailable: true },
] as never;

type Props = Partial<React.ComponentProps<typeof OrderVisitCardDetail>>;
const renderCard = (props: Props = {}) =>
    render(<OrderVisitCardDetail visit={props.visit ?? visit()} team={props.team ?? team} {...props} />);

/** Texto de cada botão SEM o nome do ícone (material-symbols), na ordem da tela. */
const labels = () => screen.queryAllByRole('button').map(b => {
    const clone = b.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.material-symbols-outlined').forEach(n => n.remove());
    return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}).filter(Boolean);

beforeEach(() => {
    mockUi.isV2 = false;
    mockData.getUsers.mockReset().mockResolvedValue([]);
    mockToast.error.mockReset();
});

describe('OrderVisitCardDetail — dados (visual atual, v1)', () => {
    it('cabeçalho: número da OS, status, progresso e selo de processamento', () => {
        renderCard();
        expect(screen.getByText('12.03.2026')).toBeInTheDocument();
        expect(screen.getByText('Execução')).toBeInTheDocument();
        expect(screen.getByText('40%')).toBeInTheDocument();
        expect(screen.getByTestId('processing')).toHaveAttribute('data-id', '1');
    });

    it('sem número usa o espaço reservado; sem progresso mostra 0%', () => {
        renderCard({ visit: visit({ ovMask: undefined, progress: undefined }) });
        expect(screen.getByText('??.??.????')).toBeInTheDocument();
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('o número só é clicável com onViewOrder', () => {
        const onViewOrder = jest.fn();
        const { unmount } = renderCard({ onViewOrder });
        fireEvent.click(screen.getByText('12.03.2026'));
        expect(onViewOrder).toHaveBeenCalledTimes(1);
        unmount();
        renderCard();
        fireEvent.click(screen.getByText('12.03.2026'));
        expect(onViewOrder).toHaveBeenCalledTimes(1);
    });

    it('status da OS escondido no 8; motivo da suspensão só no 6; sem descrição usa o rótulo padrão', () => {
        const a = renderCard({ visit: visit({ ovOStatusId: 8 }) });
        expect(screen.queryByText('Execução')).not.toBeInTheDocument();
        a.unmount();
        const b = renderCard({ visit: visit({ ovOStatusId: 6, ovOStatusDescription: 'Suspensa', ovOSuspendedReasonDescription: 'Falta de peça' }) });
        expect(screen.getByText('Falta de peça')).toBeInTheDocument();
        b.unmount();
        renderCard({ visit: visit({ ovOStatusDescription: undefined, ovOStatusId: 4 }) });
        expect(screen.getByText('Agendadas')).toBeInTheDocument();
    });

    it('esconde o selo de processamento com hideHeaderActions', () => {
        renderCard({ hideHeaderActions: true });
        expect(screen.queryByTestId('processing')).not.toBeInTheDocument();
    });

    it('cliente (ou sistema), unidade, setor/posição e serviços, com os textos reservas', () => {
        const a = renderCard();
        expect(screen.getByText('Cliente Beta')).toBeInTheDocument();
        expect(screen.getByText('Loja Centro')).toBeInTheDocument();
        expect(screen.getByText('Cozinha / Bancada 2')).toBeInTheDocument();
        expect(screen.getByText('Trocar compressor')).toBeInTheDocument();
        a.unmount();
        renderCard({ visit: visit({ clientName: undefined, systemDescription: 'Elétrica', unitDescription: undefined, assetTagDescription: undefined, assetTagSubDescription: undefined, requestedServices: undefined }) });
        expect(screen.getByText('Elétrica')).toBeInTheDocument();
        expect(screen.getByText('Unidade não informada')).toBeInTheDocument();
        expect(screen.getByText('SETOR / POSIÇÃO')).toBeInTheDocument();
        expect(screen.getByText('Nenhum serviço descrito')).toBeInTheDocument();
    });

    it('equipe: código e contrato em maiúsculas, primeiro nome dos membros e o plano', () => {
        renderCard();
        expect(screen.getByText('EQ-1')).toBeInTheDocument();
        expect(screen.getByText('CONTRATO GAMA')).toBeInTheDocument();
        expect(screen.getByText('Maria')).toBeInTheDocument();
        expect(screen.getByText('João')).toBeInTheDocument();
        expect(screen.getByText('PREVENTIVA')).toBeInTheDocument();
    });

    it('sem código de equipe usa EQ.RESPONSAVEL', () => {
        renderCard({ visit: visit({ teamCode: undefined }) });
        expect(screen.getByText('EQ.RESPONSAVEL')).toBeInTheDocument();
    });

    it('horários: início sempre; duração e fim só com a visita encerrada (ovStatusId 2)', () => {
        const a = renderCard();
        expect(screen.getByText(formatDateTime('2026-11-10T09:00:00'))).toBeInTheDocument();
        expect(screen.queryByText(/\(\d+\.\d h\)/)).not.toBeInTheDocument();
        a.unmount();
        renderCard({ visit: visit({ ovStatusId: 2, ovDurationHours: 2.5 }) });
        expect(screen.getByText('(2.5 h)')).toBeInTheDocument();
        expect(screen.getByText(formatDateTime('2026-11-10T11:00:00'))).toBeInTheDocument();
    });
});

describe('OrderVisitCardDetail — remover membro (visual atual, v1)', () => {
    it('botão de remover só em membro que não é líder, com visita não arquivada e com o tratador', () => {
        const onRemoveTeamMember = jest.fn();
        const a = renderCard({ onRemoveTeamMember });
        const remove = screen.getAllByRole('button', { name: 'Remover membro da equipe' });
        expect(remove).toHaveLength(1);
        fireEvent.click(remove[0]);
        expect(onRemoveTeamMember).toHaveBeenCalledWith('u2');
        a.unmount();
        renderCard({ onRemoveTeamMember, visit: visit({ isFiled: true }) });
        expect(screen.queryByRole('button', { name: 'Remover membro da equipe' })).not.toBeInTheDocument();
    });

    it('sem tratador não há botão de remover', () => {
        renderCard();
        expect(screen.queryByRole('button', { name: 'Remover membro da equipe' })).not.toBeInTheDocument();
    });
});

describe('OrderVisitCardDetail — adicionar membro (visual atual, v1)', () => {
    const users = [
        { id: 'a1', statusId: '2', departmentId: 'D1', nameShort: 'Zeca' },
        { id: 'a2', statusId: '2', departmentId: 'D1', nameShort: 'Ana' },
        { id: 'lead', statusId: '2', departmentId: 'D1', nameShort: 'Líder' },
        { id: 'u2', statusId: '2', departmentId: 'D1', nameShort: 'Já na equipe' },
        { id: 'x1', statusId: '3', departmentId: 'D1', nameShort: 'Inativo' },
        { id: 'x2', statusId: '2', departmentId: 'D9', nameShort: 'Outro depto' },
    ];
    const nativeOptions = (c: HTMLElement) => Array.from(c.querySelector('select')!.options).map(o => o.textContent);

    it('só aparece com o tratador, visita não arquivada e processamento de 1 a 4', () => {
        const a = renderCard({ onAddTeamMember: jest.fn() });
        expect(a.container.querySelector('select')).toBeInTheDocument();
        a.unmount();
        const b = renderCard({ onAddTeamMember: jest.fn(), visit: visit({ isFiled: true }) });
        expect(b.container.querySelector('select')).not.toBeInTheDocument();
        b.unmount();
        const c = renderCard({ onAddTeamMember: jest.fn(), visit: visit({ ovProcessingId: 5 }) });
        expect(c.container.querySelector('select')).not.toBeInTheDocument();
        c.unmount();
        const d = renderCard();
        expect(d.container.querySelector('select')).not.toBeInTheDocument();
    });

    it('lista só usuários ativos, do mesmo departamento, que não são o líder nem já estão na equipe, em ordem alfabética', async () => {
        mockData.getUsers.mockResolvedValue(users);
        const { container } = renderCard({ onAddTeamMember: jest.fn() });
        await waitFor(() => expect(nativeOptions(container)).toEqual(['Ana', 'Zeca']));
    });

    it('adicionar chama o tratador com o escolhido e limpa a escolha; o botão fica desabilitado até escolher', async () => {
        mockData.getUsers.mockResolvedValue(users);
        const onAddTeamMember = jest.fn().mockResolvedValue(undefined);
        const { container } = renderCard({ onAddTeamMember });
        await waitFor(() => expect(nativeOptions(container)).toEqual(['Ana', 'Zeca']));
        const add = screen.getByText('add').closest('button')!;
        expect(add).toBeDisabled();
        fireEvent.change(container.querySelector('select')!, { target: { value: 'a2' } });
        expect(add).toBeEnabled();
        await act(async () => { fireEvent.click(add); });
        expect(onAddTeamMember).toHaveBeenCalledWith('a2');
        expect(add).toBeDisabled();
    });

    it('erro ao carregar os usuários não derruba a tela', async () => {
        mockData.getUsers.mockRejectedValue(new Error('x'));
        const { container } = renderCard({ onAddTeamMember: jest.fn() });
        await act(async () => { await Promise.resolve(); });
        expect(container.querySelector('select')).toBeInTheDocument();
    });
});

describe('OrderVisitCardDetail — botões de ação (visual atual, v1)', () => {
    const all = {
        onEndVisit: jest.fn(), onReportVisit: jest.fn(), onMarkAsRevised: jest.fn(), onApproveVisit: jest.fn(), onFileVisit: jest.fn(),
        onDisapproveVisit: jest.fn(), onReverseApproval: jest.fn(), onDeleteVisit: jest.fn(),
    };

    it('visita em rascunho com todos os tratadores (menos o de rejeitar): encerrar, reportar, aprovar, arquivar, estornar e excluir, nesta ordem', () => {
        const { onDisapproveVisit, ...rest } = all;
        renderCard(rest);
        expect(labels()).toEqual(['Encerrar Visita', 'Reportar Visita', 'Aprovar Visita', 'ARQUIVAR VISITA', 'Estornar Aprovação', 'Excluir Visita']);
    });

    it('com onDisapproveVisit (revisão): encerrar, arquivar, rejeitar, estornar e excluir — reportar, revisada e aprovar somem', () => {
        renderCard({ ...all, visit: visit({ ovProcessingId: 2 }) });
        expect(labels()).toEqual(['Encerrar Visita', 'ARQUIVAR VISITA', 'REJEITAR VISITA', 'Estornar Aprovação', 'Excluir Visita']);
    });

    it('revisada só com processamento 2 e sem onDisapproveVisit; reportar só com 1 ou 4', () => {
        const { onDisapproveVisit, ...rest } = all;
        const a = renderCard({ ...rest, visit: visit({ ovProcessingId: 2 }) });
        expect(labels().join('|')).toMatch(/Marcar como REVISADA/);
        expect(labels().join('|')).not.toMatch(/Reportar Visita/);
        a.unmount();
        const b = renderCard({ ...rest, visit: visit({ ovProcessingId: 4 }) });
        expect(labels().join('|')).toMatch(/Reportar Visita/);
        b.unmount();
        renderCard({ ...rest, visit: visit({ ovProcessingId: 3 }) });
        expect(labels().join('|')).not.toMatch(/Reportar Visita|Marcar como REVISADA/);
    });

    it('aprovar aparece com onApproveVisit e sem onDisapproveVisit, em qualquer processamento', () => {
        renderCard({ onApproveVisit: jest.fn(), visit: visit({ ovProcessingId: 3 }) });
        expect(labels().join('|')).toMatch(/Aprovar Visita/);
    });

    it('cada botão chama o seu tratador', () => {
        const fns = { onEndVisit: jest.fn(), onReportVisit: jest.fn(), onFileVisit: jest.fn(), onReverseApproval: jest.fn(), onDeleteVisit: jest.fn() };
        renderCard(fns);
        fireEvent.click(screen.getByText('Encerrar Visita'));
        fireEvent.click(screen.getByText('Reportar Visita'));
        fireEvent.click(screen.getByText('ARQUIVAR VISITA'));
        fireEvent.click(screen.getByText('Estornar Aprovação'));
        fireEvent.click(screen.getByText('Excluir Visita'));
        Object.values(fns).forEach(f => expect(f).toHaveBeenCalledTimes(1));
    });

    it('carregando: troca o texto e desabilita (reportar, aprovar, arquivar, rejeitar, estornar, revisar)', () => {
        renderCard({
            onReportVisit: jest.fn(), isReportLoading: true, onFileVisit: jest.fn(), isFileLoading: true,
            onReverseApproval: jest.fn(), isReverseApprovalLoading: true,
        });
        expect(screen.getByText('ARQUIVANDO...').closest('button')).toBeDisabled();
        expect(screen.getAllByText('CARREGANDO...')).toHaveLength(2);
        screen.getAllByText('CARREGANDO...').forEach(t => expect(t.closest('button')).toBeDisabled());
    });
});

describe('OrderVisitCardDetail — visual novo (v2)', () => {
    beforeEach(() => { mockUi.isV2 = true; });

    it('só tokens do design system: sem caixa alta, sem fonte de 9–11 px e sem cores fixas', () => {
        const { container } = renderCard({ onEndVisit: jest.fn(), onDeleteVisit: jest.fn(), onRemoveTeamMember: jest.fn(), onViewOrder: jest.fn() });
        const html = container.innerHTML;
        expect(html).not.toMatch(/uppercase|tracking-widest|tracking-wide|tracking-tighter/);
        expect(html).not.toMatch(/text-\[(9|10|11)px\]/);
        expect(html).not.toMatch(/\b(bg-white|text-white|text-black)\b/);
        expect(html).not.toMatch(/-(slate|emerald|blue|red|rose|green|indigo|orange|yellow)-\d{2,3}/);
        expect(html).toMatch(/bg-surface/);
    });

    it('mostra os mesmos dados, em caixa normal', () => {
        renderCard();
        expect(screen.getByText('12.03.2026')).toBeInTheDocument();
        expect(screen.getByText('Execução')).toBeInTheDocument();
        expect(screen.getByText('Cliente Beta')).toBeInTheDocument();
        expect(screen.getByText('Loja Centro')).toBeInTheDocument();
        expect(screen.getByText('Cozinha / Bancada 2')).toBeInTheDocument();
        expect(screen.getByText('Trocar compressor')).toBeInTheDocument();
        expect(screen.getByText('EQ-1')).toBeInTheDocument();
        expect(screen.getByText('Contrato Gama')).toBeInTheDocument();
        expect(screen.getByText('Preventiva')).toBeInTheDocument();
        expect(screen.getByText('Maria')).toBeInTheDocument();
        expect(screen.getByText('João')).toBeInTheDocument();
        expect(screen.getByText(formatDateTime('2026-11-10T09:00:00'))).toBeInTheDocument();
        expect(screen.getByTestId('processing')).toHaveAttribute('data-id', '1');
    });

    it('textos reservas em caixa normal', () => {
        renderCard({ visit: visit({ ovMask: undefined, clientName: undefined, systemDescription: undefined, unitDescription: undefined, assetTagDescription: undefined, assetTagSubDescription: undefined, requestedServices: undefined, teamCode: undefined }) });
        expect(screen.getByText('Sem número')).toBeInTheDocument();
        expect(screen.getByText('Cliente')).toBeInTheDocument();
        expect(screen.getByText('Unidade não informada')).toBeInTheDocument();
        expect(screen.getByText('Setor / Posição')).toBeInTheDocument();
        expect(screen.getByText('Nenhum serviço descrito')).toBeInTheDocument();
        expect(screen.getByText('Equipe responsável')).toBeInTheDocument();
    });

    it('esconde o selo de processamento com hideHeaderActions', () => {
        renderCard({ hideHeaderActions: true });
        expect(screen.queryByTestId('processing')).not.toBeInTheDocument();
    });

    it('o número da OS é um botão só quando há onViewOrder', () => {
        const onViewOrder = jest.fn();
        const a = renderCard({ onViewOrder });
        fireEvent.click(screen.getByRole('button', { name: /12\.03\.2026/ }));
        expect(onViewOrder).toHaveBeenCalledTimes(1);
        a.unmount();
        renderCard();
        expect(screen.queryByRole('button', { name: /12\.03\.2026/ })).not.toBeInTheDocument();
    });

    it('status da OS em chip (azul suave; alerta se suspensa; escondido no 8) e rótulo padrão sem descrição', () => {
        const a = renderCard();
        expect(screen.getByText('Execução')).toHaveClass('bg-info-soft', 'text-info');
        a.unmount();
        const b = renderCard({ visit: visit({ ovOStatusId: 6, ovOStatusDescription: 'Suspensa', ovOSuspendedReasonDescription: 'Falta de peça' }) });
        expect(screen.getByText('Suspensa')).toHaveClass('bg-warning-soft', 'text-warning');
        expect(screen.getByText('Falta de peça')).toBeInTheDocument();
        b.unmount();
        const c = renderCard({ visit: visit({ ovOStatusId: 8 }) });
        expect(screen.queryByText('Execução')).not.toBeInTheDocument();
        c.unmount();
        renderCard({ visit: visit({ ovOStatusDescription: undefined, ovOStatusId: 4 }) });
        expect(screen.getByText('Agendadas')).toBeInTheDocument();
    });

    it('progresso: anel acessível com a porcentagem (0% sem progresso)', () => {
        const a = renderCard();
        const ring = screen.getByRole('progressbar', { name: 'Progresso da visita' });
        expect(ring).toHaveAttribute('aria-valuenow', '40');
        expect(screen.getByText('40%')).toBeInTheDocument();
        a.unmount();
        renderCard({ visit: visit({ progress: undefined }) });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('horários: duração e fim só com a visita encerrada', () => {
        const a = renderCard();
        expect(screen.queryByText(/\(\d+\.\d h\)/)).not.toBeInTheDocument();
        a.unmount();
        renderCard({ visit: visit({ ovStatusId: 2, ovDurationHours: 2.5 }) });
        expect(screen.getByText('(2.5 h)')).toBeInTheDocument();
        expect(screen.getByText(formatDateTime('2026-11-10T11:00:00'))).toBeInTheDocument();
    });

    it('remover membro: botão nomeado com o nome da pessoa, só em quem não é líder e com visita não arquivada', () => {
        const onRemoveTeamMember = jest.fn();
        const a = renderCard({ onRemoveTeamMember });
        expect(screen.queryByRole('button', { name: 'Remover Maria da equipe' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Remover João da equipe' }));
        expect(onRemoveTeamMember).toHaveBeenCalledWith('u2');
        a.unmount();
        renderCard({ onRemoveTeamMember, visit: visit({ isFiled: true }) });
        expect(screen.queryByRole('button', { name: /Remover .* da equipe/ })).not.toBeInTheDocument();
    });

    describe('adicionar membro', () => {
        const users = [
            { id: 'a1', statusId: '2', departmentId: 'D1', nameShort: 'Zeca' },
            { id: 'a2', statusId: '2', departmentId: 'D1', nameShort: 'Ana' },
            { id: 'x1', statusId: '3', departmentId: 'D1', nameShort: 'Inativo' },
        ];
        const nativeOptions = (c: HTMLElement) => Array.from(c.querySelector('select')!.options).map(o => o.textContent);

        it('mesmas regras de quando aparece e de quem pode entrar', async () => {
            mockData.getUsers.mockResolvedValue(users);
            const a = renderCard({ onAddTeamMember: jest.fn() });
            await waitFor(() => expect(nativeOptions(a.container)).toEqual(['Ana', 'Zeca']));
            a.unmount();
            const b = renderCard({ onAddTeamMember: jest.fn(), visit: visit({ ovProcessingId: 5 }) });
            expect(b.container.querySelector('select')).not.toBeInTheDocument();
        });

        it('o botão de adicionar tem nome e só habilita com alguém escolhido', async () => {
            mockData.getUsers.mockResolvedValue(users);
            const onAddTeamMember = jest.fn().mockResolvedValue(undefined);
            const { container } = renderCard({ onAddTeamMember });
            await waitFor(() => expect(nativeOptions(container)).toEqual(['Ana', 'Zeca']));
            const add = screen.getByRole('button', { name: 'Adicionar membro' });
            expect(add).toBeDisabled();
            fireEvent.change(container.querySelector('select')!, { target: { value: 'a2' } });
            expect(add).toBeEnabled();
            await act(async () => { fireEvent.click(add); });
            expect(onAddTeamMember).toHaveBeenCalledWith('a2');
            expect(add).toBeDisabled();
        });
    });

    describe('botões de ação', () => {
        const handlers = () => ({
            onEndVisit: jest.fn(), onReportVisit: jest.fn(), onMarkAsRevised: jest.fn(), onApproveVisit: jest.fn(), onFileVisit: jest.fn(),
            onDisapproveVisit: jest.fn(), onReverseApproval: jest.fn(), onDeleteVisit: jest.fn(),
        });
        /** Rótulo sem diferenças de caixa/pontuação entre os dois visuais. */
        const norm = (t: string) => t.toLowerCase().replace(/\s+\./g, '.');

        it('EQUIVALÊNCIA: em todas as combinações, aparecem os mesmos botões, na mesma ordem, que no visual atual', () => {
            let combos = 0;
            for (const processing of [undefined, 1, 2, 3, 4, 5]) {
                for (const withDisapprove of [false, true]) {
                    for (const withAdd of [false, true]) {
                        for (const filed of [false, true]) {
                            const h = handlers();
                            if (!withDisapprove) delete (h as Partial<typeof h>).onDisapproveVisit;
                            const props = { ...h, visit: visit({ ovProcessingId: processing, isFiled: filed }), ...(withAdd ? { onAddTeamMember: jest.fn() } : {}) };
                            mockUi.isV2 = false;
                            const v1 = renderCard(props);
                            const before = labels().filter(l => !/Adicionar membro/.test(l));
                            v1.unmount();
                            mockUi.isV2 = true;
                            const v2 = renderCard(props);
                            const after = labels().filter(l => !/Adicionar membro/.test(l));
                            v2.unmount();
                            expect(after.map(norm)).toEqual(before.map(norm));
                            combos++;
                        }
                    }
                }
            }
            expect(combos).toBe(48);
        });

        it('cada botão chama o seu tratador', () => {
            const fns = { onEndVisit: jest.fn(), onReportVisit: jest.fn(), onFileVisit: jest.fn(), onReverseApproval: jest.fn(), onDeleteVisit: jest.fn() };
            renderCard(fns);
            fireEvent.click(screen.getByRole('button', { name: 'Encerrar visita' }));
            fireEvent.click(screen.getByRole('button', { name: 'Reportar visita' }));
            fireEvent.click(screen.getByRole('button', { name: 'Arquivar visita' }));
            fireEvent.click(screen.getByRole('button', { name: 'Estornar aprovação' }));
            fireEvent.click(screen.getByRole('button', { name: 'Excluir visita' }));
            Object.values(fns).forEach(f => expect(f).toHaveBeenCalledTimes(1));
        });

        it('carregando: troca o texto e desabilita', () => {
            renderCard({
                onReportVisit: jest.fn(), isReportLoading: true, onFileVisit: jest.fn(), isFileLoading: true,
                onReverseApproval: jest.fn(), isReverseApprovalLoading: true,
            });
            // (o <Loading> acrescenta "Loading..." ao nome, igual ao visual atual)
            expect(screen.getByRole('button', { name: /Arquivando\.\.\./ })).toBeDisabled();
            expect(screen.getAllByRole('button', { name: /Carregando\.\.\./ })).toHaveLength(2);
        });

        it('o texto dos botões está em caixa normal (sem MAIÚSCULAS)', () => {
            renderCard({ ...handlers(), visit: visit({ ovProcessingId: 2 }) });
            for (const l of labels()) expect(l).not.toMatch(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4,}/);
        });
    });
});
