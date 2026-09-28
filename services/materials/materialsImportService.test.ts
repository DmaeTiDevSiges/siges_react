import * as XLSX from 'xlsx';
import { supabase } from '../core/supabase';
import { usersService } from '../users/usersService';
import { materialsImportService, MaterialsImportRow } from './materialsImportService';
import { warehouseService } from './warehouseService';
import { MATERIALS_IMPORT_HEADERS, MaterialsImportTemplate } from '../../utils/MaterialsImportTemplate';
import { FileUtils } from '../../utils/FileUtils';

jest.mock('../core/supabase', () => ({
    supabase: { from: jest.fn() }
}));

jest.mock('../users/usersService', () => ({
    usersService: { getCurrentUser: jest.fn() }
}));

jest.mock('./warehouseService', () => ({
    warehouseService: { getWarehouses: jest.fn() }
}));

jest.mock('../../utils/FileUtils', () => ({
    FileUtils: { downloadFile: jest.fn() }
}));

const fromMock = supabase.from as jest.Mock;
const getCurrentUserMock = usersService.getCurrentUser as jest.Mock;

const csvOf = (rows: (string | number)[][]): string =>
    XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(rows));

const fileOf = (content: string): File =>
    ({
        name: 'materiais.csv',
        arrayBuffer: async () => new TextEncoder().encode(content).buffer as ArrayBuffer
    }) as unknown as File;

const validRow = (overrides: Partial<MaterialsImportRow> = {}): MaterialsImportRow => ({
    line: 2,
    code: 'MAT-001',
    description: 'Parafuso M8 x 20',
    unit: 'UN',
    priceUnit: 0.85,
    warehouseCode: 'ALM01',
    initialQuantity: 100,
    ...overrides
});

const warehouseMap = new Map([['ALM01', '10']]);

describe('MaterialsImportTemplate', () => {
    it('expõe exatamente as 6 colunas obrigatórias em português', () => {
        expect(MATERIALS_IMPORT_HEADERS).toEqual([
            'Código',
            'Descrição',
            'Unidade',
            'Preço Unitário',
            'Almoxarifado',
            'Quantidade Inicial'
        ]);
    });

    it('round-trip: template gerado é aceito pelo parser sem erros de cabeçalho', async () => {
        const csv = csvOf(MaterialsImportTemplate.getRows());
        const result = await materialsImportService.parseMaterialsCsv(fileOf(csv));

        expect(result.errors).toEqual([]);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]).toEqual({
            line: 2,
            code: 'MAT-001',
            description: 'Parafuso M8 x 20',
            unit: 'UN',
            priceUnit: 0.85,
            warehouseCode: 'ALM01',
            initialQuantity: 100
        });
    });

    it('modelo planilha (XLSX) baixa arquivo .xlsx que o parser aceita', async () => {
        const downloadFileMock = FileUtils.downloadFile as jest.Mock;
        downloadFileMock.mockClear();

        await MaterialsImportTemplate.downloadXlsx();

        expect(downloadFileMock).toHaveBeenCalledTimes(1);
        const [blob, fileName] = downloadFileMock.mock.calls[0];
        expect(fileName).toBe('modelo_importacao_materiais.xlsx');

        const xlsxFile = {
            name: 'modelo_importacao_materiais.xlsx',
            arrayBuffer: async () => blob.arrayBuffer()
        } as unknown as File;

        const result = await materialsImportService.parseMaterialsCsv(xlsxFile);
        expect(result.errors).toEqual([]);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].priceUnit).toBeCloseTo(0.85);
        expect(result.rows[0].initialQuantity).toBe(100);
    });

    it('modelo padrão gera CSV com separador ","', async () => {
        const downloadFileMock = FileUtils.downloadFile as jest.Mock;
        downloadFileMock.mockClear();

        await MaterialsImportTemplate.downloadCsv();

        const [blob, fileName] = downloadFileMock.mock.calls[0];
        expect(fileName).toBe('modelo_importacao_materiais.csv');
        const csv = await blob.text();
        expect(csv.split('\n')[0]).toContain('Código,Descrição,Unidade,Preço Unitário,Almoxarifado,Quantidade Inicial');
    });
});

describe('materialsImportService.parseMaterialsCsv', () => {
    it('rejeita cabeçalhos em inglês e cita a coluna PT esperada', async () => {
        const csv = csvOf([
            ['code', 'description', 'unit', 'priceUnit', 'warehouseCode', 'initialQuantity'],
            ['MAT-001', 'Parafuso', 'UN', '1.5', 'ALM01', '10']
        ]);

        const result = await materialsImportService.parseMaterialsCsv(fileOf(csv));

        expect(result.rows).toEqual([]);
        expect(result.errors.some(e => e.message.includes('Coluna não reconhecida: "code"'))).toBe(true);
        expect(result.errors.some(e => e.message.includes('Código'))).toBe(true);
    });

    it('aceita variações de caixa e acento nos cabeçalhos PT', async () => {
        const csv = csvOf([
            ['CODIGO', 'Descricao', 'UNIDADE', 'preco unitario', 'ALMOXARIFADO', 'Quantidade Inicial'],
            ['MAT-002', 'Porca M8', 'UN', '0,5', 'ALM01', '25']
        ]);

        const result = await materialsImportService.parseMaterialsCsv(fileOf(csv));

        expect(result.errors).toEqual([]);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].priceUnit).toBeCloseTo(0.5);
        expect(result.rows[0].initialQuantity).toBe(25);
    });

    it('reporta coluna obrigatória ausente', async () => {
        const csv = csvOf([
            ['Código', 'Descrição', 'Unidade', 'Preço Unitário', 'Quantidade Inicial'],
            ['MAT-003', 'Arruela', 'UN', '0.1', '5']
        ]);

        const result = await materialsImportService.parseMaterialsCsv(fileOf(csv));

        expect(result.rows).toEqual([]);
        expect(result.errors.some(e => e.message.includes('Almoxarifado'))).toBe(true);
    });

    it('reporta coluna desconhecida sem dados como erro de cabeçalho', async () => {
        const csv = csvOf([
            ['Código', 'Descrição', 'Unidade', 'Preço Unitário', 'Almoxarifado', 'Quantidade Inicial', 'Observação'],
            ['MAT-004', 'Cabo', 'M', '2.5', 'ALM01', '12']
        ]);

        const result = await materialsImportService.parseMaterialsCsv(fileOf(csv));

        expect(result.rows).toEqual([]);
        expect(result.errors.some(e => e.message.includes('Observação'))).toBe(true);
    });

    it('aceita números em formato pt-BR (vírgula decimal e ponto de milhar)', async () => {
        const csv = csvOf([
            ['Código', 'Descrição', 'Unidade', 'Preço Unitário', 'Almoxarifado', 'Quantidade Inicial'],
            ['MAT-BR1', 'Cimento', 'UN', '1.234,56', 'ALM01', '1.234'],
            ['MAT-BR2', 'Areia', 'M3', '0,85', 'ALM01', '100'],
            ['MAT-BR3', 'Tinta', 'LITRO', 'R$ 12,90', 'ALM01', '2.345.678']
        ]);

        const result = await materialsImportService.parseMaterialsCsv(fileOf(csv));

        expect(result.errors).toEqual([]);
        expect(result.rows).toHaveLength(3);
        expect(result.rows[0].priceUnit).toBe(1234.56);
        expect(result.rows[0].initialQuantity).toBe(1234);
        expect(result.rows[1].priceUnit).toBeCloseTo(0.85);
        expect(result.rows[1].initialQuantity).toBe(100);
        expect(result.rows[2].priceUnit).toBeCloseTo(12.9);
        expect(result.rows[2].initialQuantity).toBe(2345678);
    });

    it('aceita números em formato en-US e decimais com ponto', async () => {
        const csv = csvOf([
            ['Código', 'Descrição', 'Unidade', 'Preço Unitário', 'Almoxarifado', 'Quantidade Inicial'],
            ['MAT-EN1', 'Parafuso', 'UN', '1,234.56', 'ALM01', '10'],
            ['MAT-EN2', 'Porca', 'UN', '0.85', 'ALM01', '1,234,567']
        ]);

        const result = await materialsImportService.parseMaterialsCsv(fileOf(csv));

        expect(result.errors).toEqual([]);
        expect(result.rows[0].priceUnit).toBe(1234.56);
        expect(result.rows[1].priceUnit).toBeCloseTo(0.85);
        expect(result.rows[1].initialQuantity).toBe(1234567);
    });

    it('aceita CSV com separador ";" (padrão de planilhas pt-BR)', async () => {
        const csv = [
            'Código;Descrição;Unidade;Preço Unitário;Almoxarifado;Quantidade Inicial',
            'MAT-SEMI;Escada;UN;1.234,56;ALM01;1.234'
        ].join('\n');

        const result = await materialsImportService.parseMaterialsCsv(fileOf(csv));

        expect(result.errors).toEqual([]);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].priceUnit).toBe(1234.56);
        expect(result.rows[0].initialQuantity).toBe(1234);
    });

    it('rejeita valores numéricos ilegíveis após a conversão', async () => {
        const csv = csvOf([
            ['Código', 'Descrição', 'Unidade', 'Preço Unitário', 'Almoxarifado', 'Quantidade Inicial'],
            ['MAT-RUIM', 'Peça', 'UN', 'abc', 'ALM01', '1.2.3']
        ]);

        const result = await materialsImportService.parseMaterialsCsv(fileOf(csv));

        expect(result.rows[0].priceUnit).toBeNull();
        expect(result.rows[0].initialQuantity).toBeNull();

        const validation = materialsImportService.validateMaterialsRows(result.rows, {
            existingCodes: new Set(),
            warehouseByCode: warehouseMap
        });
        expect(validation.errors.some(e => e.field === 'priceUnit')).toBe(true);
        expect(validation.errors.some(e => e.field === 'initialQuantity')).toBe(true);
    });
});

describe('materialsImportService.getExistingCodes', () => {
    beforeEach(() => {
        fromMock.mockReset();
    });

    const buildChain = (data: { code: string }[]) => {
        const chain: any = {};
        chain.then = (resolve: (value: unknown) => void) =>
            resolve({ data, error: null });
        chain.in = jest.fn(() => chain);
        chain.eq = jest.fn(() => chain);
        return chain;
    };

    it('filtra a duplicidade pelo (company_id, code) informado', async () => {
        const chain = buildChain([{ code: 'MAT-001' }]);
        fromMock.mockReturnValue({ select: jest.fn(() => chain) });

        const result = await materialsImportService.getExistingCodes(['MAT-001', 'MAT-002'], '2');

        expect([...result]).toEqual(['MAT-001']);
        expect(chain.in).toHaveBeenCalledWith('code', ['MAT-001', 'MAT-002']);
        expect(chain.eq).toHaveBeenNthCalledWith(1, 'is_deleted', false);
        expect(chain.eq).toHaveBeenNthCalledWith(2, 'company_id', 2);
    });

    it('sem empresa informada, checa globalmente', async () => {
        const chain = buildChain([]);
        fromMock.mockReturnValue({ select: jest.fn(() => chain) });

        await materialsImportService.getExistingCodes(['MAT-001']);

        expect(chain.eq).toHaveBeenCalledTimes(1);
        expect(chain.eq).toHaveBeenCalledWith('is_deleted', false);
    });

    it('não consulta o banco quando não há códigos', async () => {
        const result = await materialsImportService.getExistingCodes([]);

        expect(result.size).toBe(0);
        expect(fromMock).not.toHaveBeenCalled();
    });
});

describe('materialsImportService.loadWarehouseCodeMap', () => {
    const getWarehousesMock = warehouseService.getWarehouses as jest.Mock;

    beforeEach(() => {
        getWarehousesMock.mockReset();
    });

    it('bloqueia a importação quando o usuário não tem empresa vinculada', async () => {
        await expect(materialsImportService.loadWarehouseCodeMap(undefined)).rejects.toThrow(
            'Usuário logado sem empresa vinculada'
        );
        expect(getWarehousesMock).not.toHaveBeenCalled();
    });

    it('só considera os almoxarifados da empresa do usuário logado', async () => {
        getWarehousesMock.mockResolvedValue([
            { id: '10', code: 'ALM01', description: 'Principal' },
            { id: '11', code: 'ALM02', description: 'Secundário' }
        ]);

        const map = await materialsImportService.loadWarehouseCodeMap('2');

        // filtro por warehouses.company_id = empresa do usuário
        expect(getWarehousesMock).toHaveBeenCalledWith('2');
        expect([...map]).toEqual([
            ['ALM01', '10'],
            ['ALM02', '11']
        ]);
    });

    it('mantém a primeira ocorrência quando há códigos repetidos na mesma empresa', async () => {
        getWarehousesMock.mockResolvedValue([
            { id: '20', code: 'ALM01', description: 'A' },
            { id: '21', code: 'ALM01', description: 'B' }
        ]);

        const map = await materialsImportService.loadWarehouseCodeMap('2');

        expect(map.get('ALM01')).toBe('20');
    });
});

describe('materialsImportService.validateMaterialsRows', () => {
    const ctx = (existing: string[] = []) => ({
        existingCodes: new Set(existing),
        warehouseByCode: warehouseMap
    });

    it('aceita linha válida', () => {
        const result = materialsImportService.validateMaterialsRows([validRow()], ctx());

        expect(result.valid).toHaveLength(1);
        expect(result.errors).toEqual([]);
    });

    it('rejeita código já existente na base', () => {
        const result = materialsImportService.validateMaterialsRows([validRow()], ctx(['MAT-001']));

        expect(result.valid).toHaveLength(0);
        expect(result.errors.some(e => e.message.includes('já existe nesta empresa'))).toBe(true);
    });

    it('rejeita código repetido no arquivo', () => {
        const result = materialsImportService.validateMaterialsRows(
            [validRow({ line: 2 }), validRow({ line: 3 })],
            ctx()
        );

        expect(result.valid).toHaveLength(1);
        expect(result.errors.some(e => e.message.includes('repetido no arquivo'))).toBe(true);
    });

    it('rejeita almoxarifado inexistente para a empresa', () => {
        const result = materialsImportService.validateMaterialsRows(
            [validRow({ warehouseCode: 'OUTRO' })],
            ctx()
        );

        expect(result.valid).toHaveLength(0);
        expect(result.errors.some(e => e.message.includes('"OUTRO" não encontrado'))).toBe(true);
    });

    it('rejeita preço negativo e quantidade não inteira', () => {
        const result = materialsImportService.validateMaterialsRows(
            [validRow({ priceUnit: -1, initialQuantity: 2.5 })],
            ctx()
        );

        expect(result.valid).toHaveLength(0);
        expect(result.errors.some(e => e.field === 'priceUnit')).toBe(true);
        expect(result.errors.some(e => e.field === 'initialQuantity')).toBe(true);
    });

    it('rejeita campos obrigatórios vazios', () => {
        const result = materialsImportService.validateMaterialsRows(
            [validRow({ code: '', description: '', unit: '', warehouseCode: '' })],
            ctx()
        );

        expect(result.valid).toHaveLength(0);
        expect(result.errors.some(e => e.field === 'code')).toBe(true);
        expect(result.errors.some(e => e.field === 'description')).toBe(true);
        expect(result.errors.some(e => e.field === 'unit')).toBe(true);
        expect(result.errors.some(e => e.field === 'warehouseCode')).toBe(true);
    });
});

describe('materialsImportService.importMaterials', () => {
    const buildMaterialsTable = (
        opts: { existing?: { code: string }[]; idOffset?: number; materialPayloads?: any[] } = {}
    ) => {
        const { existing = [], idOffset = 500, materialPayloads = [] } = opts;

        const select = jest.fn((columns: string) => {
            // getExistingCodes → select('code').in().eq().eq()
            const chain: any = {};
            chain.then = (resolve: (value: unknown) => void) => resolve({ data: existing, error: null });
            chain.in = jest.fn(() => chain);
            chain.eq = jest.fn(() => chain);
            return chain;
        });

        const insert = jest.fn((payloads: any[]) => {
            materialPayloads.push(...payloads);
            return {
                select: async () => ({
                    data: payloads.map((p, index) => ({ id: idOffset + index, code: p.code })),
                    error: null
                })
            };
        });

        return { select, insert };
    };

    const buildStockTable = (opts: { error?: string; stockPayloads?: any[] } = {}) => {
        const { error, stockPayloads = [] } = opts;
        return {
            insert: jest.fn(async (payloads: any[]) => {
                stockPayloads.push(...payloads);
                return { error: error ? { message: error } : null };
            })
        };
    };

    beforeEach(() => {
        fromMock.mockReset();
        getCurrentUserMock.mockReset();
        getCurrentUserMock.mockResolvedValue({ id: '7', companyId: '2' });
    });

    it('insere materials sem id (trigger first_free_id) e grava estoque com os ids retornados', async () => {
        const materialPayloads: any[] = [];
        const stockPayloads: any[] = [];
        const materialsTable = buildMaterialsTable({ materialPayloads });
        const stockTable = buildStockTable({ stockPayloads });

        fromMock.mockImplementation((table: string) =>
            table === 'materials' ? materialsTable : stockTable
        );

        const rows = [
            validRow({ code: 'MAT-100' }),
            validRow({ code: 'MAT-101', line: 3, warehouseCode: 'ALM01', initialQuantity: 42 })
        ];

        const result = await materialsImportService.importMaterials(rows, warehouseMap);

        expect(result).toEqual({
            materialsCreated: 2,
            stocksCreated: 2,
            rejected: 0,
            rejectedRows: []
        });

        // materials: sem id, company_id fixo, provider do usuário logado
        expect(materialPayloads).toHaveLength(2);
        expect(materialPayloads[0]).not.toHaveProperty('id');
        expect(materialPayloads[0]).toMatchObject({
            code: 'MAT-100',
            description: 'Parafuso M8 x 20',
            unit: 'UN',
            price_unit: 0.85,
            status_id: 1,
            type_id: 1,
            company_id: 1,
            provider_company_id: 2,
            created_user_id: 7,
            is_deleted: false
        });

        // warehouses_materials: colunas EN com os ids retornados
        expect(stockPayloads).toHaveLength(2);
        expect(stockPayloads[0]).toEqual({
            warehouse_id: 10,
            material_id: 500,
            quantity: 100,
            min_stock: 0,
            cost_avg: 0.85
        });
        expect(stockPayloads[1]).toMatchObject({ material_id: 501, quantity: 42 });

        // rechecagem de duplicidade (company_id, code) consultou o company_id fixo
        expect(materialsTable.select).toHaveBeenCalledWith('code');
        expect(materialsTable.select.mock.results[0].value.eq).toHaveBeenCalledWith('company_id', 1);
    });

    it('indeferi código já existente no par (company_id, code) sem gravar', async () => {
        const materialPayloads: any[] = [];
        const materialsTable = buildMaterialsTable({
            existing: [{ code: 'MAT-001' }],
            materialPayloads
        });
        fromMock.mockImplementation((table: string) =>
            table === 'materials' ? materialsTable : buildStockTable()
        );

        const result = await materialsImportService.importMaterials([validRow()], warehouseMap);

        expect(result.materialsCreated).toBe(0);
        expect(result.rejected).toBe(1);
        expect(result.rejectedRows[0].message).toContain('já existe nesta empresa');
        expect(materialPayloads).toHaveLength(0);
        expect(materialsTable.insert).not.toHaveBeenCalled();
    });

    it('indeferi código repetido no próprio arquivo e importa apenas a 1ª ocorrência', async () => {
        const materialPayloads: any[] = [];
        const materialsTable = buildMaterialsTable({ materialPayloads });
        fromMock.mockImplementation((table: string) =>
            table === 'materials' ? materialsTable : buildStockTable()
        );

        const result = await materialsImportService.importMaterials(
            [validRow({ line: 2 }), validRow({ line: 3 })],
            warehouseMap
        );

        expect(result.materialsCreated).toBe(1);
        expect(result.rejected).toBe(1);
        expect(result.rejectedRows[0]).toMatchObject({
            line: 3,
            message: expect.stringContaining('repetido no arquivo')
        });
        expect(materialPayloads).toHaveLength(1);
    });

    it('erro em um registro não cancela a importação: refaz 1 a 1 e segue com os próximos', async () => {
        const materialPayloads: any[] = [];
        const materialsTable = buildMaterialsTable({ materialPayloads });
        // lote (vários registros) falha; no retry 1 a 1, só o código ruim falha
        materialsTable.insert = jest.fn((payloads: any[]) => {
            materialPayloads.push(...payloads);
            if (payloads.length > 1) {
                return { select: async () => ({ data: null, error: { message: 'lote falhou' } }) };
            }
            if (payloads[0].code === 'MAT-BAD') {
                return { select: async () => ({ data: null, error: { message: 'registro inválido' } }) };
            }
            return {
                select: async () => ({
                    data: [{ id: 900, code: payloads[0].code }],
                    error: null
                })
            };
        });
        fromMock.mockImplementation((table: string) =>
            table === 'materials' ? materialsTable : buildStockTable()
        );

        const result = await materialsImportService.importMaterials(
            [
                validRow({ code: 'MAT-A', line: 2 }),
                validRow({ code: 'MAT-BAD', line: 3 }),
                validRow({ code: 'MAT-B', line: 4 })
            ],
            warehouseMap
        );

        // importação não parou: 2 gravados, 1 indeferido
        expect(result.materialsCreated).toBe(2);
        expect(result.rejected).toBe(1);
        expect(result.rejectedRows[0]).toMatchObject({
            line: 3,
            message: expect.stringContaining('registro inválido')
        });
        expect(result.stocksCreated).toBe(2);
    });

    it('notifica o progresso do início ao fim da importação', async () => {
        fromMock.mockImplementation((table: string) =>
            table === 'materials' ? buildMaterialsTable() : buildStockTable()
        );

        const calls: [number, number][] = [];
        await materialsImportService.importMaterials(
            [validRow({ code: 'MAT-P1' }), validRow({ code: 'MAT-P2', line: 3 })],
            warehouseMap,
            (done, total) => calls.push([done, total])
        );

        expect(calls[0]).toEqual([0, 2]);
        expect(calls[calls.length - 1]).toEqual([2, 2]);
        expect(calls.every(([, total]) => total === 2)).toBe(true);
        expect(calls.map(([done]) => done)).toEqual([...calls.map(([done]) => done)].sort((a, b) => a - b));
    });

    it('retorna stockError quando o insert de estoque falha', async () => {
        const materialsTable = buildMaterialsTable({ idOffset: 600 });
        const stockTable = buildStockTable({ error: 'boom' });
        fromMock.mockImplementation((table: string) =>
            table === 'materials' ? materialsTable : stockTable
        );

        const result = await materialsImportService.importMaterials([validRow()], warehouseMap);

        expect(result.materialsCreated).toBe(1);
        expect(result.stocksCreated).toBe(0);
        expect(result.stockError).toContain('boom');
    });

    it('não faz nenhuma chamada quando não há linhas válidas', async () => {
        const result = await materialsImportService.importMaterials([], warehouseMap);

        expect(result).toEqual({ materialsCreated: 0, stocksCreated: 0, rejected: 0, rejectedRows: [] });
        expect(fromMock).not.toHaveBeenCalled();
    });
});
