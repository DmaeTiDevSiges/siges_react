import { FileUtils } from './FileUtils';

/**
 * Converte dataUrl (data:image/...;base64,...) em Blob.
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
    const [head, base64] = dataUrl.split(',');
    const mime = head.match(/data:(.*?);/)?.[1] || 'image/png';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
};

/**
 * Copia uma imagem (dataUrl) para a área de transferência.
 * Tenta recuperar o foco da janela e repete uma vez em caso de
 * NotAllowedError ("Document is not focused" — DevTools/outra janela
 * com foco no momento da cópia). Lança erro se persistir.
 */
export const copyImageToClipboard = async (dataUrl: string): Promise<void> => {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('Cópia de imagem indisponível neste navegador');
    }
    const blob = dataUrlToBlob(dataUrl);
    const type = blob.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';

    const focusWindow = () => {
        try { window.focus(); } catch { /* ignore */ }
    };

    focusWindow();

    try {
        await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
    } catch (firstError: any) {
        if (firstError?.name !== 'NotAllowedError') throw firstError;

        // Nova tentativa após devolver o foco à janela
        await new Promise((resolve) => setTimeout(resolve, 150));
        focusWindow();
        await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
    }
};

/**
 * Tenta copiar a imagem; se falhar (permissão, ativação do usuário
 * expirada, navegador sem suporte), baixa o arquivo como fallback.
 *
 * @returns 'copied' | 'downloaded'
 */
export const copyImageWithFallback = async (
    dataUrl: string,
    fileName: string
): Promise<'copied' | 'downloaded'> => {
    try {
        await copyImageToClipboard(dataUrl);
        return 'copied';
    } catch {
        await FileUtils.downloadFile(dataUrlToBlob(dataUrl), fileName);
        return 'downloaded';
    }
};
