import * as XLSX from 'xlsx';
import { FileUtils } from './FileUtils';

/**
 * Utilitário para exportação de dados para Excel/CSV
 * Atualizado para suportar APK via FileUtils
 */
export const ExcelExportUtils = {
    /**
     * Exporta um array de objetos para um arquivo Excel (.xlsx)
     * 
     * @param data Array de objetos com os dados
     * @param filename Nome do arquivo (sem extensão)
     * @param sheetName Nome da aba na planilha
     */
    exportToExcel: async (data: any[], filename: string = 'export', sheetName: string = 'Dados') => {
        try {
            // Cria um workbook
            const workbook = XLSX.utils.book_new();

            // Converte JSON para Worksheet
            const worksheet = XLSX.utils.json_to_sheet(data);

            // Adiciona a worksheet ao workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            // Gera o buffer do arquivo
            // Usamos 'array' para gerar um buffer que pode ser convertido em Blob
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Usa o FileUtils para baixar/salvar
            await FileUtils.downloadFile(blob, `${filename}.xlsx`);
        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
        }
    },

    /**
     * Converte dados JSON para um formato mais amigável antes de exportar
     * Ex: { asset_id: 1, name: 'Ar' } -> { 'ID Ativo': 1, 'Nome': 'Ar' }
     */
    formatDataForExport: (data: any[], mapping: Record<string, string>) => {
        return data.map(item => {
            const newItem: Record<string, any> = {};
            Object.keys(mapping).forEach(key => {
                if (item.hasOwnProperty(key)) {
                    newItem[mapping[key]] = item[key];
                }
            });
            return newItem;
        });
    }
};
