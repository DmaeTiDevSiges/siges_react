import { assetTypesToFetch, emptyAutoSyncSaved, planAutoSync, type OpenOrderRef, type RemoteVersions } from './offlineAutoSyncPlan';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 10 * DAY;
const os = (id: string, unitId: string | null, clientId = '1', typeId = '3', updatedAt = 'u1'): OpenOrderRef => ({
    id,
    unitId,
    clientId,
    typeId,
    updatedAt,
});

describe('planAutoSync — download automático offline', () => {
    it('1ª vez: baixa cada unidade uma vez só, mesmo repetida em várias OSs', () => {
        const plan = planAutoSync(emptyAutoSyncSaved('9', '5'), [os('1', '10'), os('2', '10'), os('3', '11', '2', '4')], NOW, DAY);
        expect(plan.unitsToFetch).toEqual(['10', '11']);
        expect(plan.clientsToFetch).toEqual(['1', '2']);
        expect(plan.orderTypesToFetch).toEqual(['3', '4']);
        expect(plan.ordersToFetch).toEqual(['1', '2', '3']);
        expect(plan.unitsToDrop).toEqual([]);
    });

    it('incremental: só unidade nova ou com mais de 1 dia; apaga a que saiu das OSs abertas', () => {
        const saved = {
            ...emptyAutoSyncSaved('9', '5'),
            units: { '10': NOW - DAY / 2, '11': NOW - 2 * DAY, '12': NOW - 1000 },
            orders: { '1': 'u1', '7': 'u1' },
        };
        const plan = planAutoSync(saved, [os('1', '10'), os('2', '11'), os('3', '13')], NOW, DAY);
        expect(plan.unitsToFetch).toEqual(['11', '13']);
        expect(plan.unitsToDrop).toEqual(['12']);
        expect(plan.unitsNeeded).toEqual(['10', '11', '13']);
        expect(plan.ordersToFetch).toEqual(['2', '3']);
        expect(plan.ordersToDrop).toEqual(['7']);
    });

    it('OS alterada (updated_at mudou) é baixada de novo', () => {
        const saved = { ...emptyAutoSyncSaved('9', '5'), orders: { '1': 'u1' } };
        expect(planAutoSync(saved, [os('1', '10', '1', '3', 'u2')], NOW, DAY).ordersToFetch).toEqual(['1']);
    });

    it('ignora unidade/tipo vazios ou "0"', () => {
        const plan = planAutoSync(emptyAutoSyncSaved('9', '5'), [os('1', null, '0', '0'), os('2', '0')], NOW, DAY);
        expect(plan.unitsToFetch).toEqual([]);
        expect(plan.clientsToFetch).toEqual(['1']);
        expect(plan.orderTypesToFetch).toEqual(['3']);
    });

    it('tipos de ativo: distintos e só os vencidos', () => {
        const saved = { ...emptyAutoSyncSaved('9', '5'), assetTypes: { '20': NOW - 1000 } };
        const assets = [{ typeId: '20' }, { typeId: '21' }, { typeId: '21' }, { typeId: null }];
        expect(assetTypesToFetch(saved, assets, NOW, DAY)).toEqual(['21']);
    });

    describe('versões do banco (inclusão, alteração, exclusão)', () => {
        const remote = (patch: Partial<RemoteVersions>): RemoteVersions => ({
            units: {}, assetTypes: {}, orderTypes: {}, materials: null, vehicles: null, users: null, ...patch,
        });
        const fresh = () => ({
            ...emptyAutoSyncSaved('9', '5'),
            units: { '10': NOW - 1000, '11': NOW - 1000 },
            orderTypes: { '3': NOW - 1000 },
            assetTypes: { '20': NOW - 1000 },
            orders: { '1': 'u1', '2': 'u1' },
            versions: {
                units: { '10': '5:a|2:a', '11': '7:b|1:b' },
                orderTypes: { '3': 'md5x' },
                assetTypes: { '20': '1:a|2:a|9:a' },
                materials: '100:a', vehicles: '3:a', users: '40:a',
            },
        });
        const orders = [os('1', '10'), os('2', '11')];

        it('dado recente e versão igual: nada a baixar', () => {
            const plan = planAutoSync(fresh(), orders, NOW, 7 * DAY, remote({
                units: { '10': '5:a|2:a', '11': '7:b|1:b' }, orderTypes: { '3': 'md5x' },
                materials: '100:a', vehicles: '3:a', users: '40:a',
            }));
            expect(plan.unitsToFetch).toEqual([]);
            expect(plan.orderTypesToFetch).toEqual([]);
            expect([plan.materialsChanged, plan.vehiclesChanged, plan.usersChanged]).toEqual([false, false, false]);
        });

        it('ativo incluído/alterado/excluído na unidade → só ela é baixada de novo', () => {
            const plan = planAutoSync(fresh(), orders, NOW, 7 * DAY, remote({
                units: { '10': '6:b|2:a', '11': '7:b|1:b' }, orderTypes: { '3': 'md5x' },
            }));
            expect(plan.unitsToFetch).toEqual(['10']);
        });

        it('atividade do tipo de OS mudou → baixa as atividades do tipo', () => {
            const plan = planAutoSync(fresh(), orders, NOW, 7 * DAY, remote({ orderTypes: { '3': 'md5y' } }));
            expect(plan.orderTypesToFetch).toEqual(['3']);
        });

        it('materiais, veículos e usuários com versão nova', () => {
            const plan = planAutoSync(fresh(), orders, NOW, 7 * DAY, remote({ materials: '101:b', vehicles: '3:a', users: '41:b' }));
            expect([plan.materialsChanged, plan.vehiclesChanged, plan.usersChanged]).toEqual([true, false, true]);
        });

        it('plano de manutenção alterado → baixa o tipo de ativo', () => {
            const saved = fresh();
            expect(assetTypesToFetch(saved, [{ typeId: '20' }], NOW, 7 * DAY, remote({ assetTypes: { '20': '1:b|2:a|9:a' } }))).toEqual(['20']);
            expect(assetTypesToFetch(saved, [{ typeId: '20' }], NOW, 7 * DAY, remote({ assetTypes: { '20': '1:a|2:a|9:a' } }))).toEqual([]);
        });

        it('sem a função no banco (remote null): só o prazo vale', () => {
            expect(planAutoSync(fresh(), orders, NOW, DAY, null).unitsToFetch).toEqual([]);
            expect(planAutoSync(fresh(), orders, NOW + 2 * DAY, DAY, null).unitsToFetch).toEqual(['10', '11']);
        });
    });
});
