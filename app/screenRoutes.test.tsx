import { fromPath, toPath } from './screenRoutes';

describe('screenRoutes — cadastros do grupo B', () => {
    it.each([
        ['client-details', { clientId: '7' }, '/cliente/7'],
        ['department-details', { departmentId: '12' }, '/departamento/12'],
        ['team-details', { teamId: '5' }, '/equipe/5'],
    ])('%s ida e volta', (screen, selection, path) => {
        expect(toPath(screen, selection)).toBe(path);
        expect(fromPath(path)).toEqual({ screen, selection });
    });

    it('sem id cai em /<tela>', () => {
        expect(toPath('client-details', {})).toBe('/client-details');
    });
});
