import { createOutbox, type OutboxOp, type OutboxStorage } from './outbox';

describe('outbox — gravação falhou', () => {
    it('não guarda a operação na memória se o armazenamento recusar (ex.: cheio)', async () => {
        let saved: OutboxOp[] = [];
        let fail = false;
        const storage: OutboxStorage = {
            async load() { return saved; },
            async save(ops) {
                if (fail) throw new Error("Setting the value of 'siges_offline_outbox_v1' exceeded the quota.");
                saved = JSON.parse(JSON.stringify(ops));
            },
        };
        const outbox = createOutbox(storage);

        await outbox.enqueue({ method: 'updateVehicleKm', args: ['1', 10], userUuid: null });
        fail = true;
        await expect(outbox.enqueue({ method: 'addVehicleToOrderVisit', args: ['70', '9', '1'], userUuid: null })).rejects.toThrow(/quota/);

        const ops = await outbox.list();
        expect(ops.map(o => o.method)).toEqual(['updateVehicleKm']);

        // Volta a gravar normalmente depois
        fail = false;
        await outbox.enqueue({ method: 'addVehicleToOrderVisit', args: ['70', '9', '1'], userUuid: null });
        expect((await outbox.list()).map(o => o.method)).toEqual(['updateVehicleKm', 'addVehicleToOrderVisit']);
    });
});
