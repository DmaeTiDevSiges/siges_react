import { fromLocation, fromPath, showIdsInUrl, toPath, toUrl } from './screenRoutes';

describe('toPath', () => {
    it('monta o caminho da visita e do ativo', () => {
        expect(toPath('order-visit-execute', { visitId: '12' })).toBe('/visit/12');
        expect(toPath('order-visit-asset-report', { ovaId: '900' })).toBe('/visit-asset/900');
        expect(toPath('order-visit-asset-materials', { ovaId: '900' })).toBe('/visit-asset/900/materials');
        expect(toPath('order-visit-asset-activities', { ovaId: '900', orderTypeId: '5' })).toBe('/visit-asset/900/activities/5');
    });

    it('monta o caminho da aprovação e da avaliação da visita', () => {
        expect(toPath('order-visit-approve', { approvalVisitId: '12' })).toBe('/visit/12/approve');
        expect(toPath('order-visit-evaluation', { approvalVisitId: '12' })).toBe('/visit/12/evaluate');
        expect(toPath('order-visit-approve', { visitId: '12' })).toBe('/order-visit-approve');
    });

    it('monta o caminho dos cadastros (só telas de detalhe)', () => {
        expect(toPath('company-details', { companyId: '3' })).toBe('/company/3');
        expect(toPath('contract-details', { contractId: '4' })).toBe('/contract/4');
        expect(toPath('unit-details', { unitId: '5' })).toBe('/unit/5');
        expect(toPath('material-details', { materialId: '6' })).toBe('/material/6');
        expect(toPath('technical-manual-details', { manualId: '7' })).toBe('/manual/7');
        // formulários não têm rota: recarregar neles não pode perder o que foi digitado
        expect(toPath('company-edit', { companyId: '3' })).toBe('/company-edit');
    });

    it('monta o caminho da OS e da SS', () => {
        expect(toPath('order-detail', { orderId: '77' })).toBe('/order/77');
        expect(toPath('service-request-detail', { orderId: '76' })).toBe('/service-request/76');
        expect(toPath('asset-details', { assetId: 'tmp:9' })).toBe('/asset/tmp:9');
        // o id de OS de outra tela não vaza para a visita
        expect(toPath('order-visit-execute', { visitId: '12', orderId: '77' })).toBe('/visit/12');
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
        expect(fromPath('/visit/12')).toEqual({ screen: 'order-visit-execute', selection: { visitId: '12' } });
        expect(fromPath('/visit-asset/900')).toEqual({ screen: 'order-visit-asset-report', selection: { ovaId: '900' } });
        expect(fromPath('/visit-asset/900/materials')).toEqual({ screen: 'order-visit-asset-materials', selection: { ovaId: '900' } });
        expect(fromPath('/visit-asset/900/activities/5')).toEqual({
            screen: 'order-visit-asset-activities', selection: { ovaId: '900', orderTypeId: '5' },
        });
    });

    it('lê aprovação e avaliação sem confundir com a visita', () => {
        expect(fromPath('/visit/12/approve')).toEqual({ screen: 'order-visit-approve', selection: { approvalVisitId: '12' } });
        expect(fromPath('/visit/12/evaluate')).toEqual({ screen: 'order-visit-evaluation', selection: { approvalVisitId: '12' } });
        expect(fromPath('/visit/12')).toEqual({ screen: 'order-visit-execute', selection: { visitId: '12' } });
    });

    it('lê os cadastros do caminho', () => {
        expect(fromPath('/company/3')).toEqual({ screen: 'company-details', selection: { companyId: '3' } });
        expect(fromPath('/contract/4')).toEqual({ screen: 'contract-details', selection: { contractId: '4' } });
        expect(fromPath('/unit/5')).toEqual({ screen: 'unit-details', selection: { unitId: '5' } });
        expect(fromPath('/material/6')).toEqual({ screen: 'material-details', selection: { materialId: '6' } });
        expect(fromPath('/manual/7')).toEqual({ screen: 'technical-manual-details', selection: { manualId: '7' } });
    });

    it('lê OS e SS do caminho', () => {
        expect(fromPath('/order/77')).toEqual({ screen: 'order-detail', selection: { orderId: '77' } });
        expect(fromPath('/service-request/76')).toEqual({ screen: 'service-request-detail', selection: { orderId: '76' } });
        expect(fromPath('/order')).toBeNull();
        expect(fromPath('/asset/tmp:9')).toEqual({ screen: 'asset-details', selection: { assetId: 'tmp:9' } });
    });

    it('não confunde caminhos parecidos nem rotas antigas', () => {
        expect(fromPath('/visit')).toBeNull();
        expect(fromPath('/visit/12/outra')).toBeNull();
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

describe('cadastros do grupo B (cliente, departamento, equipe)', () => {
    it.each([
        ['client-details', { clientId: '7' }, '/client/7'],
        ['department-details', { departmentId: '12' }, '/department/12'],
        ['team-details', { teamId: '5' }, '/team/5'],
    ])('%s: ida e volta', (screen, selection, path) => {
        expect(toPath(screen, selection)).toBe(path);
        expect(fromPath(path)).toEqual({ screen, selection });
    });

    it('sem o id cai em /<tela>', () => {
        expect(toPath('client-details', {})).toBe('/client-details');
    });
});

describe('caminhos antigos', () => {
    it('caminhos antigos em português não são mais rotas', () => {
        expect(fromPath('/visita/12')).toBeNull();
        expect(fromPath('/visita-ativo/900')).toBeNull();
        expect(fromPath('/os/77')).toBeNull();
    });
});

describe('toUrl', () => {
    it('com ids visíveis é igual a toPath', () => {
        expect(toUrl('order-visit-asset-activities', { ovaId: '900', orderTypeId: '5' }, true)).toBe('/visit-asset/900/activities/5');
    });
    it('oculto: caminho sem ids', () => {
        expect(toUrl('order-visit-asset-report', { ovaId: '900' }, false)).toBe('/visit-asset');
        expect(toUrl('order-visit-asset-materials', { ovaId: '900' }, false)).toBe('/visit-asset/materials');
        expect(toUrl('order-visit-asset-activities', { ovaId: '900', orderTypeId: '5' }, false)).toBe('/visit-asset/activities');
        expect(toUrl('order-visit-approve', { approvalVisitId: '12' }, false)).toBe('/visit/approve');
        expect(toUrl('order-visit-evaluation', { approvalVisitId: '12' }, false)).toBe('/visit/evaluate');
        expect(toUrl('order-visit-execute', { visitId: '12' }, false)).toBe('/visit');
        expect(toUrl('service-request-detail', { orderId: '76' }, false)).toBe('/service-request');
        expect(toUrl('asset-details', { assetId: 'tmp:9' }, false)).toBe('/asset');
    });
    it('oculto, sem os ids ou sem rota: /<tela>', () => {
        expect(toUrl('order-visit-execute', {}, false)).toBe('/order-visit-execute');
        expect(toUrl('dashboard', {}, false)).toBe('/dashboard');
    });
});

describe('fromLocation', () => {
    it('com ids visíveis lê do caminho e ignora o estado', () => {
        expect(fromLocation('/visit-asset/900', { screen: 'order-visit-asset-report', selection: { ovaId: '1' } }, true))
            .toEqual({ screen: 'order-visit-asset-report', selection: { ovaId: '900' } });
    });
    it('oculto: lê do estado e devolve só os ids da rota', () => {
        expect(fromLocation('/visit-asset', { screen: 'order-visit-asset-report', selection: { ovaId: '900', orderId: '77' } }, false))
            .toEqual({ screen: 'order-visit-asset-report', selection: { ovaId: '900' } });
    });
    it('oculto: caminho com id (digitado) não abre nada', () => {
        expect(fromLocation('/visit-asset/4364', null, false)).toBeNull();
        expect(fromLocation('/visit-asset/4364', { screen: 'order-visit-asset-report', selection: { ovaId: '900' } }, false)).toBeNull();
    });
    it('oculto: caminho sem estado (link colado) não abre nada', () => {
        expect(fromLocation('/visit-asset', null, false)).toBeNull();
        expect(fromLocation('/visit-asset', { screen: 'order-visit-asset-report' }, false)).toBeNull();
    });
    it('oculto: estado de outra tela não abre a tela errada', () => {
        expect(fromLocation('/visit', { screen: 'asset-details', selection: { assetId: '9' } }, false)).toBeNull();
    });
});

describe('showIdsInUrl', () => {
    it('só no localhost do navegador', () => {
        expect(showIdsInUrl('localhost', false)).toBe(true);
        expect(showIdsInUrl('127.0.0.1', false)).toBe(true);
        expect(showIdsInUrl('localhost', true)).toBe(false); // Android: https://localhost
        expect(showIdsInUrl('siges.exemplo.com.br', false)).toBe(false);
        expect(showIdsInUrl('', false)).toBe(false); // Electron empacotado (file://)
    });
});
