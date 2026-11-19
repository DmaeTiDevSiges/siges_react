jest.mock('../core/supabase', () => ({ supabase: {} }));
jest.mock('../media/imageUtils', () => ({ getPublicImageUrl: () => '' }));
jest.mock('./ordersService', () => ({ ordersService: {} }));
import { dailyScheduleService, DAILY_SCHEDULE_STATUS } from './dailyScheduleService';
import { getBrazilDateInputValue } from '../../utils/formatters';

const order = { id: '1', statusId: DAILY_SCHEDULE_STATUS.EXECUTION, teamId: '9', teamLeaderId: '5' } as any;
const team = { id: 'c1', teamId: '9', code: 'T', name: 'T', leaderId: '5', leaderName: 'L' } as any;

const board = (date: string, readOnly: boolean) => {
    jest.spyOn(dailyScheduleService, 'getTeamsWithLeaders').mockResolvedValue([team]);
    jest.spyOn(dailyScheduleService, 'loadBoardData').mockResolvedValue({
        supported: true, hasSchedule: true, savedItems: [{ order_id: 1, team_id: 9, position: 1 }],
        savedPriorities: [], orders: [{ ...order }],
    } as any);
    return dailyScheduleService.getBoard({ contractId: '1', providerDepartmentId: '1', date, readOnly });
};

describe('OS em execução no quadro', () => {
    it('aparece hoje', async () => {
        const b = await board(getBrazilDateInputValue(), false);
        expect(Object.values(b.columns).flat()).toHaveLength(1);
    });
    it('não aparece em data futura', async () => {
        const b = await board('2026-11-23', false);
        expect(Object.values(b.columns).flat()).toHaveLength(0);
    });
    it('não aparece em data passada', async () => {
        const b = await board('2020-01-01', true);
        expect(Object.values(b.columns).flat()).toHaveLength(0);
    });
});
