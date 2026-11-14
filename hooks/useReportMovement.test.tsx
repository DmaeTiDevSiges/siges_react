import { act, renderHook } from '@testing-library/react';

const mockToast = { info: jest.fn() };
jest.mock('sonner', () => ({ toast: { info: (...a: unknown[]) => mockToast.info(...a) } }));

import { useReportMovement } from './useReportMovement';

const origin = {
    clientId: 'C1', beforeUnitId: 'U1', beforeUnitAssetTagId: 'T1', beforePriorityId: 2, beforeStatusId: 'S1', beforeLocation: 'Sala 3',
} as never;

const setup = (asset: unknown = origin, initial?: unknown) => {
    const saveNow = jest.fn().mockResolvedValue(undefined);
    const hook = renderHook(() => useReportMovement(asset as never, initial as never, saveNow));
    return { ...hook, saveNow };
};

beforeEach(() => mockToast.info.mockReset());

describe('useReportMovement', () => {
    it('estado inicial vem do ativo "de arranque" (movido e observação); destino vazio até a carga', () => {
        const { result } = setup(origin, { isMoved: true, movedComments: 'obs' });
        expect(result.current.isMoved).toBe(true);
        expect(result.current.movedComments).toBe('obs');
        expect(result.current.movementDestination).toEqual({
            afterClientId: '', afterUnitId: '', afterUnitAssetTagId: '', afterPriorityId: undefined, afterStatusId: '', afterLocation: '',
        });
        expect(result.current.isMovementComplete).toBe(false);
    });

    it('ligar: preenche só o que falta com a origem e grava exatamente isso', async () => {
        const { result, saveNow } = setup();
        await act(async () => { await result.current.handleToggleMoved(true); });
        expect(result.current.isMoved).toBe(true);
        expect(saveNow).toHaveBeenCalledWith({
            is_moved: true, after_client_id: 'C1', after_unit_id: 'U1', after_unit_asset_tag_id: 'T1',
            after_priority_id: 2, after_status_id: 'S1', after_location: 'Sala 3',
        });
        expect(result.current.isMovementComplete).toBe(true);
    });

    it('ligar sem ativo carregado: só marca "movido"', async () => {
        const { result, saveNow } = setup(null);
        await act(async () => { await result.current.handleToggleMoved(true); });
        expect(saveNow).toHaveBeenCalledWith({ is_moved: true });
    });

    it('ligar não sobrescreve o que o usuário já escolheu', async () => {
        const { result, saveNow } = setup();
        act(() => { result.current.setAfterClientId('C2'); result.current.setAfterLocation('Sala 8'); });
        await act(async () => { await result.current.handleToggleMoved(true); });
        const sent = saveNow.mock.calls[0][0];
        expect(sent).not.toHaveProperty('after_client_id');
        expect(sent).not.toHaveProperty('after_location');
        expect(result.current.afterClientId).toBe('C2');
        expect(result.current.afterLocation).toBe('Sala 8');
    });

    it('desligar pede confirmação: nada é gravado nem zerado antes', async () => {
        const { result, saveNow } = setup();
        act(() => { result.current.setIsMoved(true); result.current.setAfterClientId('C2'); });
        await act(async () => { await result.current.handleToggleMoved(false); });
        expect(result.current.showUnmoveConfirmModal).toBe(true);
        expect(result.current.isMoved).toBe(true);
        expect(result.current.afterClientId).toBe('C2');
        expect(saveNow).not.toHaveBeenCalled();
    });

    it('confirmar o descarte: zera tudo, fecha a janela, grava nulos e avisa (nesta ordem de efeitos visíveis)', async () => {
        const { result, saveNow } = setup();
        act(() => {
            result.current.setIsMoved(true); result.current.setAfterClientId('C2'); result.current.setAfterUnitId('U2');
            result.current.setAfterUnitAssetTagId('T2'); result.current.setAfterStatusId('S2'); result.current.setAfterPriorityId(1);
            result.current.setAfterLocation('X'); result.current.setMovedComments('y'); result.current.setShowUnmoveConfirmModal(true);
        });
        await act(async () => { await result.current.clearMovement(); });
        expect(result.current.showUnmoveConfirmModal).toBe(false);
        expect(result.current.isMoved).toBe(false);
        expect(result.current.movementDestination).toEqual({
            afterClientId: '', afterUnitId: '', afterUnitAssetTagId: '', afterPriorityId: undefined, afterStatusId: '', afterLocation: '',
        });
        expect(result.current.movedComments).toBe('');
        expect(saveNow).toHaveBeenCalledWith({
            is_moved: false, after_client_id: null, after_unit_id: null, after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null,
            after_status_id: null, after_priority_id: null, after_location: null, moved_comments: null,
        });
        expect(mockToast.info).toHaveBeenCalledWith('Movimentação desativada e dados de destino resetados');
    });

    it('trocar cliente zera unidade e setor; trocar unidade zera o setor', () => {
        const { result, saveNow } = setup();
        act(() => { result.current.setAfterClientId('C2'); result.current.setAfterUnitId('U2'); result.current.setAfterUnitAssetTagId('T2'); });
        act(() => result.current.handleAfterUnitChange('U9'));
        expect(result.current.afterUnitId).toBe('U9');
        expect(result.current.afterUnitAssetTagId).toBe('');
        expect(saveNow).toHaveBeenLastCalledWith({ after_unit_id: 'U9', after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null });
        act(() => result.current.handleAfterClientChange('C9'));
        expect(result.current.afterClientId).toBe('C9');
        expect(result.current.afterUnitId).toBe('');
        expect(saveNow).toHaveBeenLastCalledWith({ after_client_id: 'C9', after_unit_id: null, after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null });
    });

    it('setor: grava vínculo e ids de tag/subtag como texto; sem subtag ou nulo grava nulos', () => {
        const { result, saveNow } = setup();
        act(() => result.current.handleUnitAssetTagChange({ id: 'T9', description: 'S', asset_tag_id: 4, asset_tag_sub_id: 8 }));
        expect(result.current.afterUnitAssetTagId).toBe('T9');
        expect(saveNow).toHaveBeenLastCalledWith({ after_unit_asset_tag_id: 'T9', after_tag_id: '4', after_tag_sub_id: '8' });
        act(() => result.current.handleUnitAssetTagChange({ id: 'T8', description: 'S' }));
        expect(saveNow).toHaveBeenLastCalledWith({ after_unit_asset_tag_id: 'T8', after_tag_id: null, after_tag_sub_id: null });
        act(() => result.current.handleUnitAssetTagChange(null));
        expect(result.current.afterUnitAssetTagId).toBe('');
        expect(saveNow).toHaveBeenLastCalledWith({ after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null });
    });

    it('destino completo exige cliente, unidade, setor, prioridade e situação (local é opcional)', () => {
        const { result } = setup();
        act(() => {
            result.current.setAfterClientId('C'); result.current.setAfterUnitId('U'); result.current.setAfterUnitAssetTagId('T');
            result.current.setAfterStatusId('S');
        });
        expect(result.current.isMovementComplete).toBe(false);
        act(() => result.current.setAfterPriorityId(1));
        expect(result.current.isMovementComplete).toBe(true);
    });
});
