import { hasActiveChildOrder } from './orderRequestPrefill';

describe('hasActiveChildOrder (Gerar OS a partir da SS)', () => {
    it('SS sem OS → 1ª OS herda os serviços', () => {
        expect(hasActiveChildOrder([])).toBe(false);
    });

    it('só OS canceladas → a nova herda os serviços', () => {
        expect(hasActiveChildOrder([{ statusId: 7 }, { statusId: '7' }])).toBe(false);
    });

    it('já existe OS ativa → campo em branco', () => {
        expect(hasActiveChildOrder([{ statusId: 3 }])).toBe(true);
        expect(hasActiveChildOrder([{ statusId: 7 }, { statusId: '8' }])).toBe(true);
    });
});
