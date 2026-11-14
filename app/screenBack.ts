/**
 * Telas SEM seta de voltar no cabeçalho (abas principais, painéis e telas cujo
 * "Voltar" fica no rodapé). Extraído de App.tsx: o mesmo critério decide se o
 * botão voltar do Android usa o `handleBack` do cabeçalho.
 */
const SCREENS_WITHOUT_HEADER_BACK: ReadonlySet<string> = new Set([
    'dashboard',
    'order-visit-asset-activities',
    'order-visit-asset-materials',
    'ss-dashboard',
    'ss-dashboard-period',
    'orders-dashboard',
    'orders-dashboard-period',
    'visits-dashboard',
    'dashboard-units-power-electric',
    'dashboard-units-assets-tags',
    'dashboard-orders-admin-calendar',
    'dashboard-contracts-evaluations',
    'team-shifts',
    'leader-ranking',
    'services-history',
    'companies',
    'units-search',
    'assets-search',
    'technical-manuals',
    'settings',
    'profile-permissions',
    'notifications',
    'tools',
    'materials-search',
    'materials-dashboard',
    'material-form',
    'material-edit',
    'app-notices',
    'extra-workers',
    'rental-apportionment',
    'rental-contracts',
    'rate-contracts',
    'vehicles',
    'grant-dashboard',
    'orders-daily-schedule',
]);

export const hasHeaderBack = (screen: string): boolean => !SCREENS_WITHOUT_HEADER_BACK.has(screen);
