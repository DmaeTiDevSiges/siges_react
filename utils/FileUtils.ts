
import { Capacitor } from '@capacitor/core';
import { saveAs } from 'file-saver';

// NOTE: Para que o download funcione no Android (Capacitor), os plugins @capacitor/filesystem e @capacitor/browser (ou @capacitor/share) 
// são necessários. Como eles não estão no package.json, eu preparei esta lógica para ser facilmente estendida.

/**
 * Utilitário para lidar com downloads de arquivos (PDF, Excel, etc.) 
 * funcionando tanto na Web quanto no APK (Android/iOS).
 */
export const FileUtils = {
    /**
     * Faz o download de um Blob (arquivo gerado localmente)
     * 
     * @param blob O Blob do arquivo
     * @param fileName Nome do arquivo com extensão
     */
    downloadFile: async (blob: Blob, fileName: string) => {
        // 1. Caso seja Web (ou não nativo), use o método convencional
        if (!Capacitor.isNativePlatform()) {
            saveAs(blob, fileName);
            return;
        }

        // 2. Caso seja APK/Nativo, precisamos salvar no sistema de arquivos local
        try {
            console.log(`[FileUtils] Iniciando processo nativo para: ${fileName} (${blob.size} bytes)`);
            
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            
            // Converter Blob para Base64 (necessário para o Filesystem.writeFile)
            const base64Data = await FileUtils.blobToBase64(blob);
            console.log(`[FileUtils] Base64 gerado: ${base64Data.length} chars`);

            // Tentar salvar no diretório de Documentos ou Cache
            // Cache é muitas vezes mais "garantido" para arquivos temporários que serão compartilhados
            let targetDirectory = Directory.Documents;
            
            try {
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: targetDirectory,
                    recursive: true
                });
                console.log('[FileUtils] Arquivo salvo com sucesso em Documents:', savedFile.uri);
                await FileUtils.shareFile(savedFile.uri, fileName);
            } catch (docError) {
                console.warn('[FileUtils] Falha ao salvar em Documents, tentando Cache...', docError);
                targetDirectory = Directory.Cache;
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: targetDirectory,
                    recursive: true
                });
                console.log('[FileUtils] Arquivo salvo com sucesso em Cache:', savedFile.uri);
                await FileUtils.shareFile(savedFile.uri, fileName);
            }
        } catch (error) {
            console.error('[FileUtils] Erro fatal ao baixar arquivo no APK:', error);
            throw error;
        }
    },

    /**
     * Tenta compartilhar o arquivo salvo para que o usuário possa abrir ou salvar
     */
    shareFile: async (uri: string, fileName: string) => {
        try {
            const { Share } = await import('@capacitor/share');
            const isSupported = await Share.canShare();
            
            if (isSupported) {
                await Share.share({
                    title: fileName,
                    text: 'PDF gerado pelo Siges',
                    url: uri,
                    dialogTitle: 'Abrir PDF'
                });
            } else {
                console.warn('[FileUtils] Share não suportado nesta plataforma/contexto.');
            }
        } catch (shareError) {
            console.error('[FileUtils] Erro ao compartilhar arquivo:', shareError);
            // Em alguns Androids, o browser.open pode funcionar se tivermos o FileProvider configurado, 
            // mas o Share é mais robusto.
        }
    },

    /**
     * Auxiliar para converter Blob em Base64
     */
    blobToBase64: (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(blob);
        });
    }
};
