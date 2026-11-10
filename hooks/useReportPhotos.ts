/**
 * useReportPhotos — fotos "antes"/"depois" do relatório do ativo.
 *
 * Cada foto guarda a URL exibida junto com o nome do arquivo no servidor, para
 * que remover/editar sempre aja sobre o arquivo certo. Envio e remoção passam por
 * uma fila (uma operação por vez): o servidor lê a lista de arquivos e grava a
 * lista nova, então duas operações simultâneas podiam perder um nome.
 * Enquanto a foto sobe ela fica `pending`; falha desfaz a mudança na tela.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import { MAX_REPORT_PHOTOS, ReportPhoto, ReportPhotoSide, toReportPhotos } from '../components/ordersVisits/ordersVisitsAssets/assetReport/assetReportShared';

interface PhotoSource {
    initialPhotoUrls?: (string | undefined)[];
    finalPhotoUrls?: (string | undefined)[];
    beforeImgFilesNames?: string[];
    afterImgFilesNames?: string[];
}

const serverSide = (side: ReportPhotoSide) => (side === 'initial' ? 'before' : 'after');

export const useReportPhotos = (ovaId: string, source?: PhotoSource) => {
    const [initialPhotos, setInitialPhotos] = useState<ReportPhoto[]>(() => toReportPhotos(source?.initialPhotoUrls, source?.beforeImgFilesNames));
    const [finalPhotos, setFinalPhotos] = useState<ReportPhoto[]>(() => toReportPhotos(source?.finalPhotoUrls, source?.afterImgFilesNames));

    const queueRef = useRef<Promise<unknown>>(Promise.resolve());
    const enqueue = <T,>(task: () => Promise<T>): Promise<T> => {
        const run = queueRef.current.then(task, task);
        queueRef.current = run.catch(() => undefined);
        return run;
    };

    const objectUrlsRef = useRef<string[]>([]);
    useEffect(() => () => {
        objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    }, []);

    const setSide = (side: ReportPhotoSide, updater: (prev: ReportPhoto[]) => ReportPhoto[]) => {
        if (side === 'initial') setInitialPhotos(updater);
        else setFinalPhotos(updater);
    };
    const listOf = (side: ReportPhotoSide) => (side === 'initial' ? initialPhotos : finalPhotos);

    /** Recarrega a partir do servidor (ex.: após trocar o ativo). */
    const reset = useCallback((data: PhotoSource) => {
        setInitialPhotos(toReportPhotos(data.initialPhotoUrls, data.beforeImgFilesNames));
        setFinalPhotos(toReportPhotos(data.finalPhotoUrls, data.afterImgFilesNames));
    }, []);

    const removePhoto = async (side: ReportPhotoSide, index: number) => {
        const list = listOf(side);
        const photo = list[index];
        if (!photo) return;
        if (photo.pending) {
            toast.info('Aguarde o envio desta foto terminar');
            return;
        }
        if (list.length <= 1) {
            toast.error('É necessário manter pelo menos 1 foto');
            return;
        }
        if (!photo.filename) {
            setSide(side, prev => prev.filter(p => p.key !== photo.key));
            return;
        }

        const fileName = photo.filename;
        setSide(side, prev => prev.map(p => (p.key === photo.key ? { ...p, pending: true } : p)));
        const promise = enqueue(() => dataService.removeOrderVisitAssetPhoto(ovaId, serverSide(side), fileName));
        toast.promise(promise, { loading: 'Removendo foto...', success: 'Foto removida!', error: 'Erro ao remover foto' });

        try {
            await promise;
            setSide(side, prev => prev.filter(p => p.key !== photo.key));
        } catch (error) {
            console.error('Error removing report photo:', error);
            setSide(side, prev => prev.map(p => (p.key === photo.key ? { ...p, pending: false } : p)));
        }
    };

    /** Adiciona (index null) ou substitui (index) uma foto e envia em segundo plano. */
    const savePhoto = async (side: ReportPhotoSide, index: number | null, file: File) => {
        const list = listOf(side);
        const replaced = index !== null ? list[index] : undefined;
        if (replaced?.pending) {
            toast.info('Aguarde o envio desta foto terminar');
            return;
        }
        if (!replaced && list.length >= MAX_REPORT_PHOTOS) {
            toast.error(`Máximo de ${MAX_REPORT_PHOTOS} fotos permitido`);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        objectUrlsRef.current.push(objectUrl);
        const key = `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newPhoto: ReportPhoto = { key, url: objectUrl, pending: true };
        setSide(side, prev => (replaced ? prev.map(p => (p.key === replaced.key ? newPhoto : p)) : [...prev, newPhoto]));

        const promise = enqueue(async () => {
            const result = await dataService.uploadOrderVisitAssetPhoto(ovaId, file, serverSide(side));
            if (replaced?.filename) {
                try {
                    await dataService.removeOrderVisitAssetPhoto(ovaId, serverSide(side), replaced.filename);
                } catch (e) { console.warn('Could not remove old image:', e); }
            }
            return result;
        });
        toast.promise(promise, {
            loading: 'Salvando no servidor...',
            success: 'Imagem sincronizada!',
            error: 'Erro ao enviar a foto. Tente adicioná-la novamente.',
        });

        try {
            const result = await promise;
            setSide(side, prev => prev.map(p => (p.key === key ? { ...p, filename: result.filename, pending: false } : p)));
        } catch (error) {
            console.error('Error uploading report photo:', error);
            setSide(side, prev => (replaced ? prev.map(p => (p.key === key ? replaced : p)) : prev.filter(p => p.key !== key)));
        }
    };

    const pendingCount = initialPhotos.filter(p => p.pending).length + finalPhotos.filter(p => p.pending).length;

    return { initialPhotos, finalPhotos, pendingCount, reset, removePhoto, savePhoto };
};
