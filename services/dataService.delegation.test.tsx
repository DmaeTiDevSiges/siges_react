jest.mock('./core/supabase', () => ({ supabase: { from: jest.fn(), channel: jest.fn(), auth: { onAuthStateChange: jest.fn() } } }));

import { dataService } from './dataService';
import { companiesService } from './companies/companiesService';
import { ordersService } from './orders/ordersService';

describe('dataService — delegação aos serviços', () => {
    afterEach(() => jest.restoreAllMocks());

    it('repassa todos os argumentos e devolve o resultado do serviço', async () => {
        const spy = jest.spyOn(companiesService, 'updateCompany').mockResolvedValue({ id: '1' } as never);
        const onProgress = jest.fn();
        const result = await dataService.updateCompany('1', { name: 'X' }, onProgress);
        expect(spy).toHaveBeenCalledWith('1', { name: 'X' }, onProgress);
        expect(result).toEqual({ id: '1' });
    });

    it('procura o serviço na hora da chamada (a camada offline troca métodos depois)', async () => {
        const first = jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({ id: 'a' } as never);
        await dataService.getOrderById('1');
        first.mockRestore();
        const second = jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({ id: 'b' } as never);
        await expect(dataService.getOrderById('2')).resolves.toEqual({ id: 'b' });
        expect(second).toHaveBeenCalledWith('2');
    });

    it('erro do serviço sobe como rejeição', async () => {
        jest.spyOn(companiesService, 'getCompanies').mockRejectedValue(new Error('falhou'));
        await expect(dataService.getCompanies()).rejects.toThrow('falhou');
    });
});
