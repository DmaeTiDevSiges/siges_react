import { buildDailyScheduleMessage } from './dailyScheduleMessage';

describe('buildDailyScheduleMessage', () => {
    it('monta equipes, vazias, prioridade sem equipe e total', () => {
        const text = buildDailyScheduleMessage({
            contractLabel: 'Contrato X',
            dateLabel: 'seg., 16/11/2026',
            teams: [
                {
                    code: 'EQ1', name: 'Equipe 1', leaderName: 'João',
                    orders: [
                        { orderMask: '1234', unitDescription: 'Unidade A', assetTag: 'Setor 1 / Pos 2', requestedServices: '  Trocar   bomba ' },
                        { orderMask: '1240' },
                    ],
                },
            ],
            emptyTeams: ['EQ2 (Maria)'],
            priorities: [
                { orderMask: '1250', rank: 1, scheduledTeamCode: 'EQ1' },
                { orderMask: '1260', rank: 2, unitDescription: 'Unidade B' },
            ],
        });
        expect(text).toContain('📋 *PROGRAMAÇÃO DO DIA* — seg., 16/11/2026');
        expect(text).toContain('_Contrato X_');
        expect(text).toContain('👷 *EQ1 - Equipe 1* — Líder: João');
        expect(text).toContain('1. OS 1234 · Unidade A / Setor 1 / Pos 2\n   _Trocar bomba_');
        expect(text).toContain('2. OS 1240');
        expect(text).toContain('*Sem OS programadas:* EQ2 (Maria)');
        expect(text).toContain('2. OS 1260 · Unidade B');
        expect(text).not.toContain('OS 1250');
        expect(text.endsWith('Total: 2 OS programadas em 1 equipe')).toBe(true);
    });

    it('corta serviço longo e omite blocos vazios', () => {
        const text = buildDailyScheduleMessage({
            contractLabel: '', dateLabel: 'hoje', teams: [],
        });
        expect(text).not.toContain('Sem OS');
        expect(text).not.toContain('Prioridade');
        expect(text).toContain('Total: 0 OS programadas em 0 equipes');

        const long = buildDailyScheduleMessage({
            contractLabel: '', dateLabel: 'hoje',
            teams: [{ code: 'A', orders: [{ orderMask: '1', requestedServices: 'x'.repeat(200) }] }],
        });
        expect(long).toContain('…_');
    });
});
