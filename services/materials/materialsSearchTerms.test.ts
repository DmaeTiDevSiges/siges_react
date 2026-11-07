jest.mock('../core/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../users/usersService', () => ({ usersService: { getCurrentUser: jest.fn() } }));

import { splitMaterialSearchTerms } from './materialsService';

describe('splitMaterialSearchTerms', () => {
    it('separa por espaço; número+letra aceita também a grafia separada', () => {
        expect(splitMaterialSearchTerms('pvc 50mm')).toEqual([['pvc'], ['50mm', '50 mm']]);
        expect(splitMaterialSearchTerms('DN50')).toEqual([['DN50', 'DN 50']]);
    });

    it('mantém termos simples, decimais e acentos', () => {
        expect(splitMaterialSearchTerms('cabo 2,5')).toEqual([['cabo'], ['2,5']]);
        expect(splitMaterialSearchTerms('Reduçao')).toEqual([['Reduçao']]);
    });

    it('remove curingas do LIKE e vazios', () => {
        expect(splitMaterialSearchTerms('  %_*  ')).toEqual([]);
        expect(splitMaterialSearchTerms('')).toEqual([]);
    });
});
