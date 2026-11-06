// Carrega a biblioteca xlsx (~400 KB) só quando uma importação/exportação de
// planilha é usada. Antes ela era importada estaticamente por serviços que
// entram no boot (via dataService) e baixada por todo usuário ao abrir o app.
export type XlsxModule = typeof import('xlsx');

let xlsxPromise: Promise<XlsxModule> | null = null;

export const loadXlsx = (): Promise<XlsxModule> => {
    if (!xlsxPromise) {
        xlsxPromise = import('xlsx').catch((error) => {
            xlsxPromise = null; // permite nova tentativa (ex.: falha de rede no chunk)
            throw error;
        });
    }
    return xlsxPromise;
};
