import { act, renderHook } from '@testing-library/react';

const mockCamera = { getPhoto: jest.fn(), pickImages: jest.fn() };
const mockData = { updateAssetPhotoFromReport: jest.fn() };
const mockToast = { error: jest.fn(), info: jest.fn(), success: jest.fn() };
jest.mock('@capacitor/camera', () => ({
    Camera: { getPhoto: (...a: unknown[]) => mockCamera.getPhoto(...a), pickImages: (...a: unknown[]) => mockCamera.pickImages(...a) },
    CameraResultType: { Uri: 'uri' }, CameraSource: { Camera: 'CAMERA' },
}));
jest.mock('@capacitor/filesystem', () => ({ Filesystem: { readFile: jest.fn() } }));
jest.mock('../services/dataService', () => ({
    dataService: { updateAssetPhotoFromReport: (...a: unknown[]) => mockData.updateAssetPhotoFromReport(...a) },
}));
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToast.error(...a), info: (...a: unknown[]) => mockToast.info(...a), success: (...a: unknown[]) => mockToast.success(...a) } }));

import { useReportPhotoActions } from './useReportPhotoActions';

const photos = (initial: { url: string; pending?: boolean }[] = [], final: { url: string; pending?: boolean }[] = []) => ({
    initialPhotos: initial, finalPhotos: final, savePhoto: jest.fn(),
}) as never;
const asset = { assetId: '55', oCompanyId: 'CO' } as never;

beforeEach(() => {
    mockCamera.getPhoto.mockReset().mockResolvedValue({ webPath: 'blob:x', format: 'jpeg' });
    mockCamera.pickImages.mockReset();
    mockData.updateAssetPhotoFromReport.mockReset().mockResolvedValue(undefined);
    Object.values(mockToast).forEach(m => m.mockReset());
    (global as any).fetch = jest.fn().mockResolvedValue({ blob: async () => new Blob(['i'], { type: 'image/jpeg' }) });
});

describe('useReportPhotoActions', () => {
    it('limite por lado: com 3 fotos avisa e não chama a câmera; o outro lado segue livre', async () => {
        const three = [{ url: 'a' }, { url: 'b' }, { url: 'c' }];
        const { result } = renderHook(() => useReportPhotoActions(photos(three, [{ url: 'd' }]), asset));
        await act(async () => { await result.current.takeCameraPhoto('initial'); });
        expect(mockToast.error).toHaveBeenCalledWith('Máximo de 3 fotos permitido');
        expect(mockCamera.getPhoto).not.toHaveBeenCalled();
        await act(async () => { await result.current.takeCameraPhoto('final'); });
        expect(result.current.editingImage).toMatchObject({ type: 'final', index: null });
    });

    it('arquivo arrastado vai direto ao editor como foto nova', () => {
        const { result } = renderHook(() => useReportPhotoActions(photos(), asset));
        const file = new File(['x'], 'a.png');
        act(() => result.current.handleFileDrop('initial', file));
        expect(result.current.editingImage).toEqual({ type: 'initial', index: null, src: file });
    });

    it('editar: abre com a URL; ainda subindo pede para aguardar; posição inexistente é ignorada', () => {
        const { result } = renderHook(() => useReportPhotoActions(photos([{ url: 'u.jpg' }, { url: 'p.jpg', pending: true }]), asset));
        act(() => result.current.handleEditImage('initial', 0));
        expect(result.current.editingImage).toEqual({ type: 'initial', index: 0, src: 'u.jpg' });
        act(() => result.current.setEditingImage(null));
        act(() => result.current.handleEditImage('initial', 1));
        expect(mockToast.info).toHaveBeenCalledWith('Aguarde o envio desta foto terminar');
        expect(result.current.editingImage).toBeNull();
        act(() => result.current.handleEditImage('initial', 7));
        expect(result.current.editingImage).toBeNull();
    });

    it('salvar a edição fecha o editor e entrega lado/posição ao hook de fotos', () => {
        const p = photos([{ url: 'u.jpg' }]);
        const { result } = renderHook(() => useReportPhotoActions(p, asset));
        const edited = new File(['e'], 'e.jpg');
        act(() => result.current.handleEditImage('initial', 0));
        act(() => result.current.handleSaveEditedImage(edited));
        expect((p as any).savePhoto).toHaveBeenCalledWith('initial', 0, edited);
        expect(result.current.editingImage).toBeNull();
        // sem edição em andamento, nada acontece
        act(() => result.current.handleSaveEditedImage(edited));
        expect((p as any).savePhoto).toHaveBeenCalledTimes(1);
    });

    it('capa: separa nome do arquivo (sem query) e pasta a partir de "companies/"', async () => {
        const { result } = renderHook(() => useReportPhotoActions(photos(), asset));
        act(() => result.current.handleUseAsCover('https://h.test/storage/v1/object/public/b/companies/CO/assets/55/foto.jpg?t=99'));
        expect(result.current.showCoverConfirmModal).toBe(true);
        await act(async () => { await result.current.handleConfirmCoverPhoto(); });
        expect(mockData.updateAssetPhotoFromReport).toHaveBeenCalledWith('55', 'CO', 'foto.jpg', 'companies/CO/assets/55');
        expect(mockToast.success).toHaveBeenCalledWith('Foto do ativo atualizada com sucesso!');
        expect(result.current.showCoverConfirmModal).toBe(false);
        expect(result.current.selectedCoverUrl).toBeNull();
        expect(result.current.isUpdatingCover).toBe(false);
    });

    it('capa com falha: avisa, mantém a janela e libera o "atualizando"', async () => {
        mockData.updateAssetPhotoFromReport.mockRejectedValue(new Error('x'));
        const { result } = renderHook(() => useReportPhotoActions(photos(), asset));
        act(() => result.current.handleUseAsCover('https://h.test/companies/CO/assets/55/foto.jpg'));
        await act(async () => { await result.current.handleConfirmCoverPhoto(); });
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao atualizar foto do ativo');
        expect(result.current.showCoverConfirmModal).toBe(true);
        expect(result.current.isUpdatingCover).toBe(false);
    });

    it('capa sem URL escolhida, sem ativo ou sem empresa: não grava', async () => {
        const none = renderHook(() => useReportPhotoActions(photos(), asset));
        await act(async () => { await none.result.current.handleConfirmCoverPhoto(); });
        const noCompany = renderHook(() => useReportPhotoActions(photos(), { assetId: '55' } as never));
        act(() => noCompany.result.current.handleUseAsCover('https://h.test/companies/CO/x.jpg'));
        await act(async () => { await noCompany.result.current.handleConfirmCoverPhoto(); });
        const noAsset = renderHook(() => useReportPhotoActions(photos(), null));
        act(() => noAsset.result.current.handleUseAsCover('https://h.test/companies/CO/x.jpg'));
        await act(async () => { await noAsset.result.current.handleConfirmCoverPhoto(); });
        expect(mockData.updateAssetPhotoFromReport).not.toHaveBeenCalled();
    });
});
