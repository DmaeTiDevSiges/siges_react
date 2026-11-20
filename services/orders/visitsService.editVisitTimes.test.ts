const mockRpc = jest.fn();
jest.mock('../core/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => mockRpc(...a) } }));

jest.mock('../media/r2Service', () => ({ r2Service: {} }));
jest.mock('../media/imageUtils', () => ({ getPublicImageUrl: jest.fn() }));
jest.mock('./ordersService', () => ({ ordersService: {} }));
jest.mock('./vehicleRentalService', () => ({ vehicleRentalService: {} }));

import { visitsService } from './visitsService';

beforeEach(() => mockRpc.mockReset());

describe('visitsService.editVisitTimes', () => {
    it('chama o RPC com visit_id numérico e datas sem fuso', async () => {
        mockRpc.mockResolvedValue({ data: { success: true, message: 'ok' }, error: null });
        await visitsService.editVisitTimes('7', '2026-11-10T09:00', '2026-11-10T11:30');
        expect(mockRpc).toHaveBeenCalledWith('flow_order_visit_update_times_v1', {
            payload: { visit_id: 7, started_at: '2026-11-10T09:00:00', ended_at: '2026-11-10T11:30:00' },
        });
    });

    it('envia o fim como null quando a visita está aberta', async () => {
        mockRpc.mockResolvedValue({ data: { success: true, message: 'ok' }, error: null });
        await visitsService.editVisitTimes(7, '2026-11-10T09:00', null);
        expect(mockRpc.mock.calls[0][1].payload.ended_at).toBeNull();
    });

    it('success:false vira Error com a mensagem do banco', async () => {
        mockRpc.mockResolvedValue({ data: { success: false, message: 'Há ativos movimentados já aprovados nesta visita.' }, error: null });
        await expect(visitsService.editVisitTimes(7, '2026-11-10T09:00', '2026-11-10T11:00'))
            .rejects.toThrow('Há ativos movimentados já aprovados nesta visita.');
    });

    it('relança o erro do supabase', async () => {
        const err = new Error('rede');
        mockRpc.mockResolvedValue({ data: null, error: err });
        await expect(visitsService.editVisitTimes(7, '2026-11-10T09:00', null)).rejects.toBe(err);
    });
});
