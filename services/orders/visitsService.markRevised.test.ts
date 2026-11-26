const mockWrites: { table: string; payload: any }[] = [];
let mockOrderStatus = 8;
let mockOrderError: unknown = null;

jest.mock('../core/supabase', () => ({
    supabase: {
        from: (table: string) => {
            let payload: any;
            const result = () => {
                if (table === 'v_orders_visits') return { data: { id: 7, o_id: 40, ov_processing_id: 2, ov_ended_at: '2026-11-20T17:00:00', ov_team_leader_id: null }, error: null };
                if (table === 'v_orders_visits_assets') return { data: [{ processing_id: 3 }], error: null };
                if (table === 'orders') {
                    if (payload && mockOrderError) return { data: null, error: mockOrderError };
                    return { data: { status_id: mockOrderStatus, parent_id: 99 }, error: null };
                }
                return { data: null, error: null };
            };
            const q: any = {
                select: () => q, eq: () => q, single: () => q,
                update: (p: any) => { payload = p; mockWrites.push({ table, payload: p }); return q; },
                then: (ok: any, fail: any) => Promise.resolve(result()).then(ok, fail),
            };
            return q;
        },
    },
}));
const mockSsUpdate = jest.fn();
jest.mock('../media/r2Service', () => ({ r2Service: {} }));
jest.mock('../media/imageUtils', () => ({ getPublicImageUrl: jest.fn() }));
jest.mock('./ordersService', () => ({ ordersService: { updateServiceRequestStatus: (...a: unknown[]) => mockSsUpdate(...a) } }));
jest.mock('./vehicleRentalService', () => ({ vehicleRentalService: {} }));

import { visitsService } from './visitsService';

const suspensa = { statusId: 6, suspendedReasonId: 3, causeReasonId: 11, progress: 40 };
const written = (table: string) => mockWrites.find(w => w.table === table)?.payload;

beforeEach(() => { mockWrites.length = 0; mockOrderStatus = 8; mockOrderError = null; mockSsUpdate.mockReset(); });

describe('visitsService.markOrderVisitAsRevised', () => {
    it('grava a situação na OS, na SS pai e na visita revisada', async () => {
        await visitsService.markOrderVisitAsRevised('7', '2', suspensa);

        expect(written('orders')).toMatchObject({ status_id: 6, progress: 0.4, cause_reason_id: 11, status_at: '2026-11-20T17:00:00', updated_user_id: 2 });
        expect(mockSsUpdate).toHaveBeenCalledWith('99');
        expect(written('orders_visits')).toMatchObject({ ov_processing_id: 3, ov_revised_user_id: 2, ov_o_status_id: 6, ov_o_progress: 0.4, ov_o_suspended_reason_id: 3 });
    });

    it('concluída grava 100% e limpa o motivo de suspensão', async () => {
        await visitsService.markOrderVisitAsRevised('7', '2', { statusId: 8, causeReasonId: 11, progress: 100 });

        expect(written('orders_visits')).toMatchObject({ ov_o_status_id: 8, ov_o_progress: 1, ov_o_suspended_reason_id: null });
    });

    it('OS na situação 5 não é alterada (mesma regra da aprovação)', async () => {
        mockOrderStatus = 5;
        await visitsService.markOrderVisitAsRevised('7', '2', suspensa);

        expect(written('orders')).toBeUndefined();
        expect(written('orders_visits')).toMatchObject({ ov_processing_id: 3 });
    });

    it('falha ao gravar a OS não marca a visita como revisada', async () => {
        mockOrderError = { message: 'sem conexão' };
        jest.spyOn(console, 'error').mockImplementation(() => undefined);

        await expect(visitsService.markOrderVisitAsRevised('7', '2', suspensa)).rejects.toThrow('Erro ao atualizar a OS');
        expect(written('orders_visits')).toBeUndefined();
    });
});
