import { sortTeamsByScheduledLoad } from './dailyScheduleTeamOrder';
import type { DailyScheduleTeam } from './dailyScheduleService';

const team = (id: string, leaderName: string, code = 'EQ'): DailyScheduleTeam =>
    ({ id, teamId: id, code, name: code, leaderId: id, leaderName });

describe('sortTeamsByScheduledLoad', () => {
    it('lista primeiro os líderes com OS e depois os sem OS, cada grupo em ordem alfabética', () => {
        const teams = [team('1', 'Jose'), team('2', 'Marlon'), team('3', 'Everton'), team('4', 'Orli'), team('5', 'Genilson')];
        const columns = { '2': [{}], '4': [{}, {}] };
        expect(sortTeamsByScheduledLoad(teams, columns).map(t => t.leaderName))
            .toEqual(['Marlon', 'Orli', 'Everton', 'Genilson', 'Jose']);
    });

    it('ignora acentos e caixa na ordenação e desempata pelo código da equipe', () => {
        const teams = [team('1', 'Álvaro', 'B'), team('2', 'alvaro', 'A'), team('3', 'Beto')];
        expect(sortTeamsByScheduledLoad(teams, {}).map(t => t.id)).toEqual(['2', '1', '3']);
    });

    it('trata coluna ausente ou vazia como sem OS e não altera a lista original', () => {
        const teams = [team('1', 'Zeca'), team('2', 'Ana')];
        const result = sortTeamsByScheduledLoad(teams, { '1': [{}], '2': [] });
        expect(result.map(t => t.id)).toEqual(['1', '2']);
        expect(teams.map(t => t.id)).toEqual(['1', '2']);
    });
});
