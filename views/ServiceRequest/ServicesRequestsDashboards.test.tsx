/**
 * Testes de caracterização dos dashboards admin de SS (etapa 4 do
 * PLANO_MELHORIAS_FRONTEND.md): `ServicesRequestsDashboardAdmin` (Online) e
 * `ServicesRequestsPeriodDashboardAdmin` (Período). As duas telas são quase
 * cópias; estes testes fixam o que é igual e o que difere ANTES de unificá-las.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';

const calls: Record<string, jest.Mock> = {};
// systemParentId/clientId: o Online só mostra SS dentro do escopo (sistema e cliente permitidos).
const order = (id: string) => ({ id, code: `SS-${id}`, statusId: 1, systemParentId: 's1', clientId: '1' });
const defaults: Record<string, () => unknown> = {
    getOrdersFilters: () => Promise.resolve({ data: [order('1')], hasMore: false, total: 1 }),
    getDashboardStats: () => Promise.resolve({ ssCounts: {}, osCounts: {}, ssSectorCounts: [], osSectorCounts: [] }),
    getSystemsParent: () => Promise.resolve([{ id: 's1', description: 'Sistema 1', code: 'S1' }]),
    getUnscheduledSS: () => Promise.resolve([order('1')]),
    getCompletedSS: () => Promise.resolve({ data: [], total: 0 }),
    getCanceledSS: () => Promise.resolve({ data: [], total: 0 }),
    clearMetadataCache: () => undefined,
};
jest.mock('../../services/dataService', () => ({
    dataService: new Proxy({}, {
        get: (_t, name: string) => {
            if (!calls[name]) {
                calls[name] = jest.fn(() => {
                    if (name in defaults) return defaults[name]();
                    if (name.startsWith('subscribeTo')) return { unsubscribe: jest.fn() };
                    return Promise.resolve([]);
                });
            }
            return calls[name];
        },
    }),
}));
// Carimbo de invalidação: valor enorme força a carga inicial do Online (mesmo mecanismo do app).
let refreshRequestedAt = Number.MAX_SAFE_INTEGER;
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn(), info: jest.fn(), warning: jest.fn() } }));
jest.mock('../../services/core/dashboardRefresh', () => ({ getDashboardRefreshRequestedAt: () => refreshRequestedAt }));
jest.mock('../../contexts/PermissionsContext', () => ({ usePermissions: () => ({ canCreate: () => true, canView: () => true, canEdit: () => true, canDelete: () => true }) }));
// Referência estável: o hook real também devolve a mesma lista (senão os efeitos de opções entram em laço).
const SCOPE_WITH_CLIENT = { clientIds: ['1'], scopeReady: true, isAdminSuper: true };
const SCOPE_EMPTY = { clientIds: [] as string[], scopeReady: true, isAdminSuper: true };
let currentScope = SCOPE_WITH_CLIENT;
jest.mock('../../hooks/useClientScope', () => ({ useClientScope: () => currentScope }));
jest.mock('../../hooks/useOrderFollow', () => ({ useOrderFollow: () => ({ followedOrderIds: [], isOrderFollowed: () => false, toggleFollow: jest.fn() }) }));
jest.mock('../../utils/scheduleIdleTask', () => ({ scheduleIdleTask: (fn: () => void) => { fn(); return () => undefined; } }));
// Componentes pesados que não fazem parte do que é caracterizado aqui.
jest.mock('../Dashboards/OrdersVisitsDashboardAdmin', () => ({ OrdersVisitsDashboardAdmin: () => null }));
jest.mock('../../components/reports/OrdersListPDFButton', () => ({ OrdersListPDFButton: () => null }));
jest.mock('../../components/reports/ExcelExportButton', () => ({ ExcelExportButton: () => null }));
jest.mock('../../components/reports/RequestsListPDFButton', () => ({ RequestsListPDFButton: () => null }));
jest.mock('../../components/reports/RequestsExcelExportButton', () => ({ RequestsExcelExportButton: () => null }));
jest.mock('../../components/orderRequests/OrderRequestCardDetail', () => ({ OrderCardDetail: () => null }));
jest.mock('../../components/serviceRequests/ServiceRequestCardListItem', () => ({
    ServiceRequestCardListItem: ({ order: o }: { order: { id: string } }) => <div>cartao-{o.id}</div>,
}));
jest.mock('../../components/dashboards/ordersVisitsAdmin/DashboardOrdersVisitsAdminListItem', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/dashboards/SearchModeToggle', () => ({
    SearchModeToggle: ({ mode, onToggle }: { mode: string; onToggle: () => void }) => (
        <button onClick={onToggle}>toggle-{mode}</button>
    ),
}));

import { ServicesRequestsDashboardAdmin } from './ServicesRequestsDashboardAdmin';
import { ServicesRequestsPeriodDashboardAdmin } from './ServicesRequestsPeriodDashboardAdmin';

const user = { id: 'u1', companyId: '1', departmentId: 'd1' } as never;

const pad = (n: number) => String(n).padStart(2, '0');
const monthStart = () => { const n = new Date(); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-01`; };
const monthEnd = () => { const n = new Date(); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate())}`; };
const sixMonthsAgoStart = () => { const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth() - 6, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`; };

const variants = [
    { name: 'Online', Component: ServicesRequestsDashboardAdmin, keyPrefix: 'ss_dashboard', toggleLabel: 'toggle-online', toggleTarget: 'ss-dashboard-period' },
    { name: 'Período', Component: ServicesRequestsPeriodDashboardAdmin, keyPrefix: 'ss_period_dashboard', toggleLabel: 'toggle-period', toggleTarget: 'ss-dashboard' },
] as const;

const lastCall = (name: string) => calls[name].mock.calls[calls[name].mock.calls.length - 1];

beforeEach(() => {
    mockToastError.mockClear();
    refreshRequestedAt = Number.MAX_SAFE_INTEGER;
    currentScope = SCOPE_WITH_CLIENT;
    window.matchMedia = ((query: string) => ({
        matches: false, media: query, onchange: null,
        addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn(), dispatchEvent: jest.fn(),
    })) as never;
    Object.values(calls).forEach(m => m.mockClear());
    localStorage.clear();
    sessionStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe.each(variants)('Dashboard SS — $name (comportamento comum)', ({ Component, toggleLabel, toggleTarget }) => {
    it('na montagem busca a lista, as estatísticas, as SS sem agenda e as OS abertas', async () => {
        render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
        await waitFor(() => expect(calls.getDashboardStats).toHaveBeenCalled());
        expect(calls.getUnscheduledSS).toHaveBeenCalled();
        expect(calls.getOpenSS).toHaveBeenCalled();
        expect(lastCall('getOrdersFilters')[0]).toMatchObject({ page: 0, pageSize: 50, viewName: 'v_orders_parent' });
    });

    it('mostra os cartões das SS sem agenda devolvidas pela busca', async () => {
        render(<Component currentUser={user} />);
        expect(await screen.findByText('cartao-1')).toBeInTheDocument();
    });

    it('erro na busca principal avisa e não derruba a tela', async () => {
        defaults.getOrdersFilters = () => Promise.reject(new Error('falhou'));
        try {
            render(<Component currentUser={user} />);
            await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Erro ao carregar dados do dashboard'));
        } finally {
            defaults.getOrdersFilters = () => Promise.resolve({ data: [order('1')], hasMore: false, total: 1 });
        }
    });

    it('o evento refresh_dashboard refaz a busca', async () => {
        render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
        const before = calls.getOrdersFilters.mock.calls.length;
        await act(async () => { window.dispatchEvent(new Event('refresh_dashboard')); });
        await waitFor(() => expect(calls.getOrdersFilters.mock.calls.length).toBeGreaterThan(before));
    });

    it('ao sair da tela encerra as assinaturas em tempo real', async () => {
        const { unmount } = render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.subscribeToOrders).toHaveBeenCalled());
        const results = [calls.subscribeToOrders, calls.subscribeToVisits, calls.subscribeToUsersThrottled]
            .map(m => m.mock.results[0].value as { unsubscribe: jest.Mock });
        unmount();
        results.forEach(r => expect(r.unsubscribe).toHaveBeenCalled());
    });

    it('o seletor Online x Período navega para a outra página', async () => {
        const onNavigate = jest.fn();
        render(<Component currentUser={user} onNavigate={onNavigate} onlineScreenKey="ss-dashboard" />);
        fireEvent.click(await screen.findByText(toggleLabel));
        expect(onNavigate).toHaveBeenCalledWith(toggleTarget);
    });

    it('providerCompanyId entra nos filtros da lista principal', async () => {
        render(<Component currentUser={user} providerCompanyId="99" />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
        expect(lastCall('getOrdersFilters')[0]).toMatchObject({ providerCompanyId: '99' });
    });
});

describe('Dashboard SS — Online (o que só ele faz)', () => {
    const Component = ServicesRequestsDashboardAdmin;

    it('período padrão: 6 meses atrás até o fim do mês atual; grava em ss_dashboard_date_*', async () => {
        render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getDashboardStats).toHaveBeenCalled());
        const args = lastCall('getDashboardStats');
        expect(args[4]).toBe(sixMonthsAgoStart());
        expect(args[5]).toBe(monthEnd());
        expect(localStorage.getItem('ss_dashboard_date_start')).toBe(sixMonthsAgoStart());
        expect(localStorage.getItem('ss_dashboard_date_end')).toBe(monthEnd());
        expect(localStorage.getItem('ss_period_dashboard_date_start')).toBeNull();
    });

    it('lista principal NÃO é limitada ao período (sem dateFrom/dateTo)', async () => {
        render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
        const filters = lastCall('getOrdersFilters')[0];
        expect(filters).not.toHaveProperty('dateFrom');
        expect(filters).not.toHaveProperty('dateTo');
    });

    it('grava o cache da lista e da paginação no localStorage', async () => {
        render(<Component currentUser={user} />);
        await screen.findByText('cartao-1');
        await waitFor(() => expect(localStorage.getItem('cachedRecentRequests_v4')).toContain('"id":"1"'));
        expect(localStorage.getItem('cachedTotalOrders_v2')).toBe('1');
        expect(localStorage.getItem('cachedHasMore_v2')).toBe('false');
        expect(localStorage.getItem('cachedCurrentPage_v2')).toBe('0');
        expect(localStorage.getItem('cachedTeams')).not.toBeNull();
    });

    it('com cache salvo mostra as SS sem agenda na hora, sem esperar a busca', async () => {
        localStorage.setItem('ssdash_cachedUnscheduledSS_v2', JSON.stringify([order('77')]));
        defaults.getUnscheduledSS = () => new Promise(() => undefined);
        defaults.getOrdersFilters = () => new Promise(() => undefined);
        try {
            render(<Component currentUser={user} />);
            expect(await screen.findByText('cartao-77')).toBeInTheDocument();
        } finally {
            defaults.getUnscheduledSS = () => Promise.resolve([order('1')]);
            defaults.getOrdersFilters = () => Promise.resolve({ data: [order('1')], hasMore: false, total: 1 });
        }
    });

    it('a carga automática acontece só na 1ª entrada da sessão do app', async () => {
        const first = render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
        first.unmount();
        calls.getOrdersFilters.mockClear();
        // Sem invalidação pendente, voltar à tela usa cache + tempo real (sem nova busca).
        refreshRequestedAt = 0;
        render(<Component currentUser={user} />);
        await act(async () => { await new Promise(r => setTimeout(r, 50)); });
        expect(calls.getOrdersFilters).not.toHaveBeenCalled();
    });

    it('uma invalidação pedida (ex.: cancelamento no detalhe) força nova busca ao voltar', async () => {
        const first = render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
        first.unmount();
        calls.getOrdersFilters.mockClear();
        refreshRequestedAt = Number.MAX_SAFE_INTEGER;
        render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
    });
});

describe('Dashboard SS — filtro de escopo de clientes na lista de SS sem agenda', () => {
    it('Online: escopo vazio (departamento sem clientes) esconde as SS', async () => {
        currentScope = SCOPE_EMPTY;
        render(<ServicesRequestsDashboardAdmin currentUser={user} />);
        await waitFor(() => expect(calls.getUnscheduledSS).toHaveBeenCalled());
        await act(async () => { await new Promise(r => setTimeout(r, 30)); });
        expect(screen.queryByText('cartao-1')).not.toBeInTheDocument();
    });

    it('Período: não aplica o escopo de clientes nesse filtro (mostra as SS)', async () => {
        currentScope = SCOPE_EMPTY;
        render(<ServicesRequestsPeriodDashboardAdmin currentUser={user} />);
        expect(await screen.findByText('cartao-1')).toBeInTheDocument();
    });
});

describe('Dashboard SS — Período (o que só ele faz)', () => {
    const Component = ServicesRequestsPeriodDashboardAdmin;

    it('período padrão: mês atual; grava em ss_period_dashboard_date_*', async () => {
        render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getDashboardStats).toHaveBeenCalled());
        const args = lastCall('getDashboardStats');
        expect(args[4]).toBe(monthStart());
        expect(args[5]).toBe(monthEnd());
        expect(localStorage.getItem('ss_period_dashboard_date_start')).toBe(monthStart());
        expect(localStorage.getItem('ss_period_dashboard_date_end')).toBe(monthEnd());
        expect(localStorage.getItem('ss_dashboard_date_start')).toBeNull();
    });

    it('usa o período salvo da própria página', async () => {
        localStorage.setItem('ss_period_dashboard_date_start', '2026-01-01');
        localStorage.setItem('ss_period_dashboard_date_end', '2026-01-31');
        render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getDashboardStats).toHaveBeenCalled());
        expect(lastCall('getDashboardStats')[4]).toBe('2026-01-01');
        expect(lastCall('getDashboardStats')[5]).toBe('2026-01-31');
    });

    it('lista principal é limitada ao período (dateFrom/dateTo)', async () => {
        render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
        expect(lastCall('getOrdersFilters')[0]).toMatchObject({ dateFrom: monthStart(), dateTo: monthEnd() });
    });

    it('NÃO grava o cache da lista/paginação (exclusivo da página Online)', async () => {
        render(<Component currentUser={user} />);
        await screen.findByText('cartao-1');
        await act(async () => { await new Promise(r => setTimeout(r, 30)); });
        for (const key of ['cachedRecentRequests_v4', 'cachedTotalOrders_v2', 'cachedHasMore_v2', 'cachedCurrentPage_v2', 'ssdash_cachedUnscheduledSS_v2']) {
            expect(localStorage.getItem(key)).toBeNull();
        }
        expect(localStorage.getItem('cachedTeams')).not.toBeNull();
    });

    it('LÊ o cache de SS sem agenda salvo pela página Online ao montar (mas nunca grava)', async () => {
        localStorage.setItem('ssdash_cachedUnscheduledSS_v2', JSON.stringify([order('77')]));
        defaults.getUnscheduledSS = () => new Promise(() => undefined);
        defaults.getOrdersFilters = () => new Promise(() => undefined);
        try {
            render(<Component currentUser={user} />);
            expect(await screen.findByText('cartao-77')).toBeInTheDocument();
        } finally {
            defaults.getUnscheduledSS = () => Promise.resolve([order('1')]);
            defaults.getOrdersFilters = () => Promise.resolve({ data: [order('1')], hasMore: false, total: 1 });
        }
    });

    it('busca em toda montagem (não depende da flag de sessão)', async () => {
        const first = render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
        first.unmount();
        calls.getOrdersFilters.mockClear();
        render(<Component currentUser={user} />);
        await waitFor(() => expect(calls.getOrdersFilters).toHaveBeenCalled());
    });
});
