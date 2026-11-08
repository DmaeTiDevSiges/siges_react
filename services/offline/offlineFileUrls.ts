/**
 * Fotos/assinaturas feitas offline (F3): nome do arquivo → URL local.
 *
 * Módulo sem dependências de propósito: getPublicImageUrl (imageUtils) consulta
 * este mapa de forma síncrona. Enquanto a foto não sobe, qualquer tela que
 * monte a URL pelo nome do arquivo (checklist, assinatura, relatório) mostra a
 * cópia do aparelho. O mapa é preenchido por offlineFiles (ao salvar e ao
 * abrir o app).
 */
const localUrls = new Map<string, string>();

export const setLocalOfflineFileUrl = (fileName: string, url: string): void => {
    localUrls.set(fileName, url);
};

export const removeLocalOfflineFileUrl = (fileName: string): void => {
    localUrls.delete(fileName);
};

export const getLocalOfflineFileUrl = (fileName?: string | null): string | undefined =>
    fileName ? localUrls.get(fileName.replace(/^.*\//, '')) : undefined;

/** URL que aponta para o próprio aparelho (não passar por variantes/imgproxy). */
export const isLocalImageUrl = (url?: string | null): boolean =>
    !!url && (url.startsWith('blob:') || url.startsWith('data:') || url.includes('/_capacitor_file_/') || url.startsWith('capacitor://'));
