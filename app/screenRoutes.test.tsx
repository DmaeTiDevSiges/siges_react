import { fromPath, toPath } from './screenRoutes';

describe('toPath', () => {
    it('monta o caminho da visita e do ativo', () => {
        expect(toPath('order-visit-execute', { visitId: '12' })).toBe('/visita/12');
        expect(toPath('order-visit-asset-report', { ovaId: '900' })).toBe('/visita-ativo/900');
        expect(toPath('order-visit-asset-materials', { ovaId: '900' })).toBe('/visita-ativo/900/materiais');
        expect(toPath('order-visit-asset-activities', { ovaId: '900', orderTypeId: '5' })).toBe('/visita-ativo/900/atividades/5');
    });

    it('monta o caminho da OS e da SS', () => {
        expect(toPath('order-detail', { orderId: '77' })).toBe('/os/77');
        expect(toPath('service-request-detail', { orderId: '76' })).toBe('/ss/76');
        // o id de OS de outra tela não vaza para a visita
        expect(toPath('order-visit-execute', { visitId: '12', orderId: '77' })).toBe('/visita/12');
    });

    it('tela sem rota própria, ou sem os ids dela, cai em /<tela>', () => {
        expect(toPath('order-detail', { visitId: '12' })).toBe('/order-detail');
        expect(toPath('service-request-detail', {})).toBe('/service-request-detail');
        expect(toPath('order-visit-execute', {})).toBe('/order-visit-execute');
        expect(toPath('order-visit-asset-activities', { ovaId: '900' })).toBe('/order-visit-asset-activities');
    });
});

describe('fromPath', () => {
    it('lê tela e ids do caminho', () => {
        expect(fromPath('/visita/12')).toEqual({ screen: 'order-visit-execute', selection: { visitId: '12' } });
        expect(fromPath('/visita-ativo/900')).toEqual({ screen: 'order-visit-asset-report', selection: { ovaId: '900' } });
        expect(fromPath('/visita-ativo/900/materiais')).toEqual({ screen: 'order-visit-asset-materials', selection: { ovaId: '900' } });
        expect(fromPath('/visita-ativo/900/atividades/5')).toEqual({
            screen: 'order-visit-asset-activities', selection: { ovaId: '900', orderTypeId: '5' },
        });
    });

    it('lê OS e SS do caminho', () => {
        expect(fromPath('/os/77')).toEqual({ screen: 'order-detail', selection: { orderId: '77' } });
        expect(fromPath('/ss/76')).toEqual({ screen: 'service-request-detail', selection: { orderId: '76' } });
        expect(fromPath('/os')).toBeNull();
    });

    it('não confunde caminhos parecidos nem rotas antigas', () => {
        expect(fromPath('/visita')).toBeNull();
        expect(fromPath('/visita/12/outra')).toBeNull();
        expect(fromPath('/order-visit-execute')).toBeNull();
        expect(fromPath('/')).toBeNull();
        expect(fromPath('access_token=abc&type=recovery')).toBeNull();
    });

    it('ida e volta preserva ids com ":" (ativo criado offline) e caracteres especiais', () => {
        for (const id of ['tmp:3f2a-11', 'a b', 'x/y', '100%']) {
            const path = toPath('order-visit-asset-report', { ovaId: id });
            expect(fromPath(path)?.selection.ovaId).toBe(id);
        }
    });
});
