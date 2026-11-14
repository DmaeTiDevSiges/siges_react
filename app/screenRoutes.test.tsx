import { fromPath, toPath } from './screenRoutes';

describe('toPath', () => {
    it('monta o caminho da visita e do ativo', () => {
        expect(toPath('order-visit-execute', { visitId: '12' })).toBe('/visita/12');
        expect(toPath('order-visit-asset-report', { ovaId: '900' })).toBe('/visita-ativo/900');
        expect(toPath('order-visit-asset-materials', { ovaId: '900' })).toBe('/visita-ativo/900/materiais');
        expect(toPath('order-visit-asset-activities', { ovaId: '900', orderTypeId: '5' })).toBe('/visita-ativo/900/atividades/5');
    });

    it('tela sem rota própria, ou sem os ids dela, cai em /<tela>', () => {
        expect(toPath('order-detail', { visitId: '12' })).toBe('/order-detail');
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
