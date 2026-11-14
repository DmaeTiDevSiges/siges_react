import { fromPath, toPath } from './screenRoutes';

describe('toPath', () => {
    it('monta o caminho da visita e do ativo', () => {
        expect(toPath('order-visit-execute', { visitId: '12' })).toBe('/visita/12');
        expect(toPath('order-visit-asset-report', { ovaId: '900' })).toBe('/visita-ativo/900');
        expect(toPath('order-visit-asset-materials', { ovaId: '900' })).toBe('/visita-ativo/900/materiais');
        expect(toPath('order-visit-asset-activities', { ovaId: '900', orderTypeId: '5' })).toBe('/visita-ativo/900/atividades/5');
    });

    it('monta o caminho da aprovação e da avaliação da visita', () => {
        expect(toPath('order-visit-approve', { approvalVisitId: '12' })).toBe('/visita/12/aprovar');
        expect(toPath('order-visit-evaluation', { approvalVisitId: '12' })).toBe('/visita/12/avaliar');
        expect(toPath('order-visit-approve', { visitId: '12' })).toBe('/order-visit-approve');
    });

    it('monta o caminho dos cadastros (só telas de detalhe)', () => {
        expect(toPath('company-details', { companyId: '3' })).toBe('/empresa/3');
        expect(toPath('contract-details', { contractId: '4' })).toBe('/contrato/4');
        expect(toPath('unit-details', { unitId: '5' })).toBe('/unidade/5');
        expect(toPath('material-details', { materialId: '6' })).toBe('/material/6');
        expect(toPath('technical-manual-details', { manualId: '7' })).toBe('/manual/7');
        // formulários não têm rota: recarregar neles não pode perder o que foi digitado
        expect(toPath('company-edit', { companyId: '3' })).toBe('/company-edit');
    });

    it('monta o caminho da OS e da SS', () => {
        expect(toPath('order-detail', { orderId: '77' })).toBe('/os/77');
        expect(toPath('service-request-detail', { orderId: '76' })).toBe('/ss/76');
        expect(toPath('asset-details', { assetId: 'tmp:9' })).toBe('/ativo/tmp:9');
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

    it('lê aprovação e avaliação sem confundir com a visita', () => {
        expect(fromPath('/visita/12/aprovar')).toEqual({ screen: 'order-visit-approve', selection: { approvalVisitId: '12' } });
        expect(fromPath('/visita/12/avaliar')).toEqual({ screen: 'order-visit-evaluation', selection: { approvalVisitId: '12' } });
        expect(fromPath('/visita/12')).toEqual({ screen: 'order-visit-execute', selection: { visitId: '12' } });
    });

    it('lê os cadastros do caminho', () => {
        expect(fromPath('/empresa/3')).toEqual({ screen: 'company-details', selection: { companyId: '3' } });
        expect(fromPath('/contrato/4')).toEqual({ screen: 'contract-details', selection: { contractId: '4' } });
        expect(fromPath('/unidade/5')).toEqual({ screen: 'unit-details', selection: { unitId: '5' } });
        expect(fromPath('/material/6')).toEqual({ screen: 'material-details', selection: { materialId: '6' } });
        expect(fromPath('/manual/7')).toEqual({ screen: 'technical-manual-details', selection: { manualId: '7' } });
    });

    it('lê OS e SS do caminho', () => {
        expect(fromPath('/os/77')).toEqual({ screen: 'order-detail', selection: { orderId: '77' } });
        expect(fromPath('/ss/76')).toEqual({ screen: 'service-request-detail', selection: { orderId: '76' } });
        expect(fromPath('/os')).toBeNull();
        expect(fromPath('/ativo/tmp:9')).toEqual({ screen: 'asset-details', selection: { assetId: 'tmp:9' } });
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
