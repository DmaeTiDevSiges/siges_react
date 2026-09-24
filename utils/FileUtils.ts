
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
    downloadFile: async (blob: Blob, fileName: string, shareText?: string) => {
        // 1. Caso seja Web (ou não nativo), use o método convencional
        if (!Capacitor.isNativePlatform()) {
            saveAs(blob, fileName);
            return;
        }

        // 2. Caso seja APK/Nativo, precisamos salvar no sistema de arquivos local
        try {
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            
            // Converter Blob para Base64 (necessário para o Filesystem.writeFile)
            const base64Data = await FileUtils.blobToBase64(blob);

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
                await FileUtils.shareFile(savedFile.uri, fileName, shareText);
            } catch (docError) {
                console.warn('[FileUtils] Falha ao salvar em Documents, tentando Cache...', docError);
                targetDirectory = Directory.Cache;
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: targetDirectory,
                    recursive: true
                });
                await FileUtils.shareFile(savedFile.uri, fileName, shareText);
            }
        } catch (error) {
            console.error('[FileUtils] Erro fatal ao baixar arquivo no APK:', error);
            throw error;
        }
    },

    /**
     * Tenta compartilhar o arquivo salvo para que o usuário possa abrir ou salvar
     *
     * @param shareText Texto enviado junto com o arquivo (ex: resumo da SS).
     *                  Se omitido, mantém o texto padrão de exportação PDF.
     */
    shareFile: async (uri: string, fileName: string, shareText?: string) => {
        const text = shareText || 'PDF gerado pelo Siges';
        const dialogTitle = shareText ? 'Compartilhar' : 'Abrir PDF';

        // 1. Try native Share first (Capacitor)
        if (Capacitor.isNativePlatform()) {
            try {
                const { Share } = await import('@capacitor/share');
                const isSupported = await Share.canShare();
                
                if (isSupported) {
                    await Share.share({
                        title: fileName,
                        text,
                        url: uri,
                        dialogTitle
                    });
                    return;
                }
            } catch (shareError) {
                console.error('[FileUtils] Erro ao compartilhar arquivo:', shareError);
            }
        }

        // 2. Fallback: Web Share API (browser)
        if (!Capacitor.isNativePlatform() && navigator.share) {
            try {
                const response = await fetch(uri);
                const blob = await response.blob();
                const file = new File([blob], fileName, { type: blob.type });
                
                await navigator.share({
                    title: fileName,
                    text,
                    files: [file]
                });
                return;
            } catch (webShareError) {
                console.warn('[FileUtils] Web Share API falhou, tentando fallback:', webShareError);
            }
        }

        // 3. Final fallback: open in new tab
        if (!Capacitor.isNativePlatform()) {
            window.open(uri, '_blank');
        }
    },

    /**
     * Compartilha uma imagem (dataUrl) — abre o share nativo no APK ou
     * a Web Share API no browser (WhatsApp, etc.). Fallback: download.
     *
     * @param dataUrl Imagem como data:image/png;base64,... (ou jpeg)
     * @param fileName Nome do arquivo com extensão (ex: SS-123.png)
     * @param shareText Texto enviado junto com a imagem (ex: resumo da SS)
     */
    shareImage: async (dataUrl: string, fileName: string, shareText?: string) => {
        const blob = await (await fetch(dataUrl)).blob();

        // 1. Web: Web Share API com arquivo (escolha de app → WhatsApp)
        if (!Capacitor.isNativePlatform() && navigator.share) {
            try {
                const file = new File([blob], fileName, { type: blob.type || 'image/png' });
                if (!navigator.canShare || navigator.canShare({ files: [file] })) {
                    await navigator.share({ title: fileName, text: shareText, files: [file] });
                    return;
                }
            } catch (shareError: any) {
                // Usuário cancelou o share → propaga para o chamador silenciar
                if (shareError?.name === 'AbortError') throw shareError;
                console.warn('[FileUtils] Web Share de imagem falhou, baixando...', shareError);
            }
        }

        // 2. Nativo (Capacitor): salva e abre o share nativo (WhatsApp, etc.)
        //    Web sem suporte a share: apenas baixa o arquivo
        await FileUtils.downloadFile(blob, fileName, shareText);
    },

    /**
     * Auxiliar para converter Blob para Base64
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
