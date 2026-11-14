import { hasHeaderBack } from './screenBack';

describe('hasHeaderBack', () => {
    it('abas principais não têm seta', () => {
        for (const s of ['dashboard', 'orders-dashboard', 'visits-dashboard', 'units-search', 'assets-search', 'settings']) {
            expect(hasHeaderBack(s)).toBe(false);
        }
    });

    it('"Voltar" no rodapé (atividades/materiais do ativo) não usa a seta do cabeçalho', () => {
        expect(hasHeaderBack('order-visit-asset-activities')).toBe(false);
        expect(hasHeaderBack('order-visit-asset-materials')).toBe(false);
    });

    it('telas internas têm seta', () => {
        for (const s of ['order-detail', 'order-visit-execute', 'order-visit-asset-report', 'asset-details', 'company-details']) {
            expect(hasHeaderBack(s)).toBe(true);
        }
    });
});
