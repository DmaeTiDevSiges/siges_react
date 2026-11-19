import { sortColumnsByLeaderName } from './dailyScheduleSort';

const col = (leaderName: string, teamId = '1') => ({ id: `${teamId}:${leaderName}`, teamId, leaderName });

describe('sortColumnsByLeaderName', () => {
    it('ordena todos os líderes por nome, independente da equipe', () => {
        const sorted = sortColumnsByLeaderName([
            col('Orli', '1'),
            col('Jose', '2'),
            col('Darlan', '2'),
            col('Genilson', '2'),
            col('Dirceu', '2'),
        ]);
        expect(sorted.map(c => c.leaderName)).toEqual(['Darlan', 'Dirceu', 'Genilson', 'Jose', 'Orli']);
    });

    it('ignora maiúsculas e acentos (José entre Jorge e Jota, não no fim)', () => {
        const sorted = sortColumnsByLeaderName([col('Jota'), col('José'), col('jorge'), col('Álvaro')]);
        expect(sorted.map(c => c.leaderName)).toEqual(['Álvaro', 'jorge', 'José', 'Jota']);
    });

    it('nomes iguais mantêm a ordem original (estável)', () => {
        const sorted = sortColumnsByLeaderName([col('Ana', '3'), col('Ana', '1'), col('Ana', '2')]);
        expect(sorted.map(c => c.teamId)).toEqual(['3', '1', '2']);
    });

    it('não altera o array recebido', () => {
        const input = [col('Zé'), col('Ana')];
        sortColumnsByLeaderName(input);
        expect(input.map(c => c.leaderName)).toEqual(['Zé', 'Ana']);
    });
});
