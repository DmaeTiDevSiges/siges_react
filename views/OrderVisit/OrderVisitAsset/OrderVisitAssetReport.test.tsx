/**
 * Testes de caracterização do relatório do ativo na visita (OrderVisitAssetReport):
 * registram o que a tela faz HOJE — carga, reportar, revisar/aprovar, rejeitar,
 * reverter, remover, alertas e avanço para o próximo ativo — para a divisão em
 * hooks (etapa 4 do PLANO_MELHORIAS_FRONTEND.md) provar que nada mudou.
 * Seções, modais e hooks de apoio (autosave, trava, fotos) são simulados; as
 * regras de validação têm testes próprios (utils/assetReportRules.test.ts).
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockData = {
    getOrderVisitAssetById: jest.fn(),
    getOrderVisitAssetActivities: jest.fn(),
    getOrderVisitAssetMaterials: jest.fn(),
    getCurrentUser: jest.fn(),
    getActiveOrderVisit: jest.fn(),
    isUserContractManager: jest.fn(),
    getContractManagers: jest.fn(),
    getAssetAlerts: jest.fn(),
    updateAssetAlert: jest.fn(),
    reportedOrderVisitAsset: jest.fn(),
    updateOrderVisitAssetProcessingStatus: jest.fn(),
    disapproveOrderVisitAsset: jest.fn(),
    removeAssetFromOrderVisit: jest.fn(),
    toggleOrderVisitAssetActivity: jest.fn(),
    removeMaterialFromAsset: jest.fn(),
    getOrderVisitAssets: jest.fn(),
};
const mockToast = { info: jest.fn(), error: jest.fn(), success: jest.fn(), warning: jest.fn() };
const mockAutosave = {
    saveState: 'idle', queueSave: jest.fn(), saveNow: jest.fn(), stage: jest.fn(),
    flushSave: jest.fn(), flushQuietly: jest.fn(),
};
const mockLock = { lock: { status: 'mine' } as { status: string; userName?: string }, forceRelease: jest.fn(), releaseMine: jest.fn() };
const mockPhotos = {
    initialPhotos: [{ url: 'antes.jpg' }] as { url: string }[],
    finalPhotos: [{ url: 'depois.jpg' }] as { url: string }[],
    pendingCount: 0,
    reset: jest.fn(), removePhoto: jest.fn(), savePhoto: jest.fn(),
};
const mockPerms = { view: new Set<string>() };
const mockOnline = { value: true };

jest.mock('../../../services/dataService', () => ({
    dataService: new Proxy({}, { get: (_t, name: string) => (...a: unknown[]) => (mockData as Record<string, jest.Mock>)[name](...a) }),
}));
jest.mock('sonner', () => ({ toast: { info: (...a: unknown[]) => mockToast.info(...a), error: (...a: unknown[]) => mockToast.error(...a), success: (...a: unknown[]) => mockToast.success(...a), warning: (...a: unknown[]) => mockToast.warning(...a) } }));
jest.mock('@capacitor/camera', () => ({ Camera: { getPhoto: jest.fn() }, CameraResultType: {}, CameraSource: {} }));
jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
jest.mock('../../../services/offline/offlineConfig', () => ({ isOnline: () => mockOnline.value }));
jest.mock('../../../services/offline/offlineSync', () => ({ subscribeOfflineSync: jest.fn() }));
jest.mock('../../../contexts/PermissionsContext', () => ({
    usePermissions: () => ({ canView: (k: string) => mockPerms.view.has(k), canCreate: () => false }),
}));
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ currentUser: { isAdmin: false, isAdminSuper: false } }) }));
jest.mock('../../../hooks/useAssetLock', () => ({ useAssetLock: () => mockLock }));
jest.mock('../../../hooks/useOfflineSync', () => ({ useOfflineSync: () => ({ unsentOvaIds: [] }) }));
jest.mock('../../../hooks/useReportAutosave', () => ({ useReportAutosave: () => mockAutosave }));
jest.mock('../../../hooks/useReportPhotos', () => ({ useReportPhotos: () => mockPhotos }));

jest.mock('../../../components/ordersVisits/ordersVisitsAssets/OrderVisitAssetCardDetail', () => ({
    OrderVisitAssetCardDetail: () => <div data-testid="card" />,
}));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/MaintenanceChecklistView', () => ({
    MaintenanceChecklistView: (p: { onUpdateProgress: (n: number) => void; onPlanChange: (id: string) => void }) => (
        <div>
            <button onClick={() => { p.onPlanChange('9'); p.onUpdateProgress(40); }}>plano 40%</button>
            <button onClick={() => p.onUpdateProgress(100)}>plano 100%</button>
        </div>
    ),
}));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportConditionSection', () => ({
    AssetReportConditionSection: (p: { side: string; value: string; isReadOnly: boolean }) => (
        <div data-testid={`cond-${p.side}`} data-readonly={String(p.isReadOnly)}>{p.value}</div>
    ),
}));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportActivitiesSection', () => ({
    AssetReportActivitiesSection: (p: { activities: { activityId: string }[]; onRemove: (id: string) => void }) => (
        <div data-testid="activities">
            {p.activities.map(a => <button key={a.activityId} onClick={() => p.onRemove(a.activityId)}>remover atividade {a.activityId}</button>)}
        </div>
    ),
}));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportMaterialsSection', () => ({
    AssetReportMaterialsSection: (p: { materials: { id: string }[]; onRemove: (m: { id: string }) => void }) => (
        <div>{p.materials.map(m => <button key={m.id} onClick={() => p.onRemove(m)}>remover material {m.id}</button>)}</div>
    ),
}));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportMovementSection', () => ({
    AssetReportMovementSection: (p: { isMoved: boolean }) => <div data-testid="movement">{String(p.isMoved)}</div>,
}));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportRecorderSection', () => ({ AssetReportRecorderSection: () => <div /> }));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportAlertsSection', () => ({
    AssetReportAlertsSection: (p: { alerts: { id: string }[]; completedAlertIds: string[]; onToggle: (id: string) => void; disabled: boolean }) => (
        <div data-testid="alerts" data-disabled={String(p.disabled)}>
            {p.alerts.map(a => (
                <button key={a.id} onClick={() => p.onToggle(a.id)}>
                    alerta {a.id} {p.completedAlertIds.includes(a.id) ? 'feito' : 'aberto'}
                </button>
            ))}
        </div>
    ),
}));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportSwapPage', () => ({ AssetReportSwapPage: () => null }));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportCopyFromModal', () => ({ AssetReportCopyFromModal: () => null }));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportProgress', () => ({
    AssetReportProgress: (p: { items: { key: string; done: boolean }[] }) => (
        <div data-testid="progress">{p.items.map(i => `${i.key}:${i.done}`).join(',')}</div>
    ),
    AssetReportSaveStatus: () => null,
}));
jest.mock('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportActions', () => ({
    ...jest.requireActual('../../../components/ordersVisits/ordersVisitsAssets/assetReport/AssetReportActions'),
    AssetReportActions: (p: Record<string, any>) => (
        <div data-testid="actions">
            {p.showReport && <button onClick={p.onReport}>Reportar</button>}
            {p.showRevertDraft && <button onClick={p.onRevertDraft}>Reverter para rascunho</button>}
            {p.showReview && p.canReview && !p.localEditMode && <button onClick={p.onStartReview}>Iniciar revisão</button>}
            {p.showReview && p.canApprove && !p.localEditMode && <button onClick={p.onStartApproval}>Iniciar aprovação</button>}
            {p.localEditMode && <button onClick={p.onConfirmEdit}>Confirmar edição</button>}
            {p.localEditMode && <button onClick={p.onCancelEdit}>Cancelar edição</button>}
            {p.showReview && p.canDisapprove && <button onClick={p.onReject}>Rejeitar</button>}
            {p.showRemove && <button onClick={p.onRemove}>Remover ativo</button>}
        </div>
    ),
}));
jest.mock('../../../components/ui/Modal', () => ({
    Modal: (p: { isOpen: boolean; title: unknown; onConfirm?: () => void; message?: string }) => p.isOpen ? (
        <div role="dialog" aria-label={String(p.title)}>
            <span>{p.message}</span>
            <button onClick={p.onConfirm}>confirmar {String(p.title)}</button>
        </div>
    ) : null,
}));
jest.mock('../../../components/ui/ConfirmDeleteModal', () => ({
    ConfirmDeleteModal: (p: { isOpen: boolean; title: string; onConfirm: () => void }) => p.isOpen ? (
        <div role="dialog" aria-label={p.title}><button onClick={p.onConfirm}>confirmar {p.title}</button></div>
    ) : null,
}));
jest.mock('./OrderVisitAssetManualsSection', () => ({ OrderVisitAssetManualsSection: () => null }));
jest.mock('../../Assets/AssetAlertModal', () => ({ AssetAlertModal: () => null }));
jest.mock('../../../components/ui/PhotoViewer', () => ({ PhotoViewer: () => null }));
jest.mock('../../../components/ui/ImageUploadSheet', () => ({ ImageUploadSheet: () => null }));
jest.mock('../../../components/ui/ImageEditorModal', () => ({ ImageEditorModal: () => null }));

import { OrderVisitAssetReport } from './OrderVisitAssetReport';

const asset = (over: Record<string, unknown> = {}) => ({
    id: '900', assetId: '55', ovId: '33', code: 'AT-1', description: 'Bomba', processingId: 1,
    beforeComments: 'antes ok', afterComments: 'depois ok', maintenancePlanId: '', maintenancePlanProgress: 0,
    oContractId: 'K1', isFiled: false, isMoved: false, orderTypeId: '5', clientId: 'C1',
    hasRecorder: true, ...over,
});
const activity = (id: string, plan?: string) => ({ id: `row-${id}`, activityId: id, maintenancePlanId: plan });

const onBack = jest.fn();
const onApproved = jest.fn();

const setup = async (props: Record<string, unknown> = {}) => {
    const utils = render(<OrderVisitAssetReport assetId="900" onBack={onBack} {...props} />);
    await waitFor(() => expect(screen.queryByTestId('cond-initial')).toBeInTheDocument());
    return utils;
};
const click = async (name: string | RegExp, index = 0) => {
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name })[index]); });
};

beforeEach(() => {
    jest.useRealTimers();
    [...Object.values(mockData), ...Object.values(mockToast), mockAutosave.queueSave, mockAutosave.saveNow, mockAutosave.stage,
        mockAutosave.flushQuietly, mockLock.releaseMine, mockLock.forceRelease, mockPhotos.reset, onBack, onApproved].forEach(m => m.mockReset());
    mockAutosave.flushSave.mockReset().mockResolvedValue(undefined);
    mockLock.releaseMine.mockResolvedValue(undefined);
    mockLock.lock = { status: 'mine' };
    mockPhotos.initialPhotos = [{ url: 'antes.jpg' }];
    mockPhotos.finalPhotos = [{ url: 'depois.jpg' }];
    mockPhotos.pendingCount = 0;
    mockPerms.view = new Set();
    mockOnline.value = true;
    mockData.getOrderVisitAssetById.mockResolvedValue(asset());
    mockData.getOrderVisitAssetActivities.mockResolvedValue([activity('A1')]);
    mockData.getOrderVisitAssetMaterials.mockResolvedValue([]);
    mockData.getCurrentUser.mockResolvedValue({ id: '7' });
    mockData.getActiveOrderVisit.mockResolvedValue({ ovProcessingId: 1, isFiled: false });
    mockData.isUserContractManager.mockResolvedValue(false);
    mockData.getContractManagers.mockResolvedValue([]);
    mockData.getAssetAlerts.mockResolvedValue([]);
    mockData.updateAssetAlert.mockResolvedValue(undefined);
    mockData.reportedOrderVisitAsset.mockResolvedValue(undefined);
    mockData.updateOrderVisitAssetProcessingStatus.mockResolvedValue(undefined);
    mockData.disapproveOrderVisitAsset.mockResolvedValue(undefined);
    mockData.removeAssetFromOrderVisit.mockResolvedValue(undefined);
    mockData.toggleOrderVisitAssetActivity.mockResolvedValue(undefined);
    mockData.removeMaterialFromAsset.mockResolvedValue(undefined);
    mockData.getOrderVisitAssets.mockResolvedValue([]);
});

describe('OrderVisitAssetReport — carga', () => {
    it('busca ativo, atividades, materiais e usuário; mostra condições e atividades', async () => {
        await setup();
        expect(mockData.getOrderVisitAssetById).toHaveBeenCalledWith('900');
        expect(mockData.getOrderVisitAssetActivities).toHaveBeenCalledWith('900');
        expect(mockData.getOrderVisitAssetMaterials).toHaveBeenCalledWith('900');
        expect(mockData.getCurrentUser).toHaveBeenCalled();
        expect(screen.getByTestId('cond-initial')).toHaveTextContent('antes ok');
        expect(screen.getByTestId('cond-final')).toHaveTextContent('depois ok');
        expect(screen.getByRole('button', { name: 'remover atividade A1' })).toBeInTheDocument();
        expect(mockPhotos.reset).toHaveBeenCalledWith(expect.objectContaining({ id: '900' }));
    });

    it('atividades de plano de manutenção ficam de fora da lista (vêm da checklist)', async () => {
        mockData.getOrderVisitAssetActivities.mockResolvedValue([activity('A1'), activity('A2', '12'), activity('A3', '0')]);
        await setup();
        expect(screen.getByRole('button', { name: 'remover atividade A1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'remover atividade A3' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'remover atividade A2' })).not.toBeInTheDocument();
    });

    it('ativo inexistente: avisa e volta', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(null);
        render(<OrderVisitAssetReport assetId="900" onBack={onBack} />);
        await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
        expect(mockToast.error).toHaveBeenCalledWith('Ativo da visita não encontrado');
    });

    it('erro na carga: avisa e não trava no carregando', async () => {
        mockData.getOrderVisitAssetById.mockRejectedValue(new Error('x'));
        const { container } = render(<OrderVisitAssetReport assetId="900" onBack={onBack} />);
        await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Erro ao carregar detalhes do ativo'));
        expect(container).toBeEmptyDOMElement();
    });

    it('somente leitura: não busca o usuário', async () => {
        await setup({ readOnly: true });
        expect(mockData.getCurrentUser).not.toHaveBeenCalled();
        expect(screen.getByTestId('cond-initial')).toHaveAttribute('data-readonly', 'true');
    });

    it('rascunho editável; reservado a outro técnico vira somente leitura', async () => {
        await setup();
        expect(screen.getByTestId('cond-initial')).toHaveAttribute('data-readonly', 'false');
    });

    it('ativo reservado por outro técnico: somente leitura', async () => {
        mockLock.lock = { status: 'other', userName: 'Maria' };
        await setup();
        expect(screen.getByTestId('cond-initial')).toHaveAttribute('data-readonly', 'true');
        expect(screen.getByText(/Em uso por Maria/)).toBeInTheDocument();
    });

    it('status fora de rascunho/rejeitado: somente leitura', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ processingId: 2 }));
        await setup();
        expect(screen.getByTestId('cond-initial')).toHaveAttribute('data-readonly', 'true');
    });
});

describe('OrderVisitAssetReport — progresso', () => {
    it('mostra o que já está pronto', async () => {
        await setup();
        expect(screen.getAllByTestId('progress')[0]).toHaveTextContent('before:true,activities:true,after:true');
    });

    it('sem foto de antes, "antes" não está pronto; com plano entra a checklist com o percentual', async () => {
        mockPhotos.initialPhotos = [];
        await setup();
        expect(screen.getAllByTestId('progress')[0]).toHaveTextContent('before:false');
        await click('plano 40%');
        expect(screen.getAllByTestId('progress')[0]).toHaveTextContent('checklist:false');
        await click('plano 100%');
        expect(screen.getAllByTestId('progress')[0]).toHaveTextContent('checklist:true');
    });
});

describe('OrderVisitAssetReport — reportar', () => {
    it('incompleto: avisa e não abre a confirmação', async () => {
        mockData.getOrderVisitAssetActivities.mockResolvedValue([]);
        await setup();
        await click('Reportar');
        expect(mockToast.error).toHaveBeenCalledWith('É necessário selecionar ao menos uma intervenção realizada');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('completo: confirma → grava pendências, reporta, solta a trava, avisa e volta', async () => {
        await setup();
        await click('Reportar');
        expect(screen.getByRole('dialog', { name: 'Confirmar Reporte' })).toBeInTheDocument();
        await click('confirmar Confirmar Reporte');
        expect(mockAutosave.stage).toHaveBeenCalledWith({ before_comments: 'antes ok', after_comments: 'depois ok' });
        expect(mockAutosave.flushSave).toHaveBeenCalled();
        expect(mockData.reportedOrderVisitAsset).toHaveBeenCalledWith('900', '7');
        expect(mockLock.releaseMine).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith('Relatório reportado com sucesso!');
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('com onApproved, volta por ele (e não por onBack)', async () => {
        await setup({ onApproved });
        await click('Reportar');
        await click('confirmar Confirmar Reporte');
        expect(onApproved).toHaveBeenCalledTimes(1);
        expect(onBack).not.toHaveBeenCalled();
    });

    it('falha ao gravar o pendente: não reporta e continua em rascunho', async () => {
        mockAutosave.flushSave.mockRejectedValue(new Error('sem rede'));
        await setup();
        await click('Reportar');
        await click('confirmar Confirmar Reporte');
        expect(mockData.reportedOrderVisitAsset).not.toHaveBeenCalled();
        expect(onBack).not.toHaveBeenCalled();
    });

    it('falha ao reportar: avisa, não solta a trava nem volta', async () => {
        mockData.reportedOrderVisitAsset.mockRejectedValue(new Error('x'));
        await setup();
        await click('Reportar');
        await click('confirmar Confirmar Reporte');
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao reportar');
        expect(mockLock.releaseMine).not.toHaveBeenCalled();
        expect(onBack).not.toHaveBeenCalled();
    });

    it('plano incompleto: pede confirmação extra antes da de reporte', async () => {
        await setup();
        await click('plano 40%');
        await click('Reportar');
        expect(screen.getByRole('dialog', { name: 'Plano de Manutenção Incompleto' })).toBeInTheDocument();
        expect(screen.queryByRole('dialog', { name: 'Confirmar Reporte' })).not.toBeInTheDocument();
    });

    it('alerta marcado já foi gravado na hora: reportar não grava de novo', async () => {
        mockData.getAssetAlerts.mockResolvedValue([{ id: 'L1', isDeleted: false, isDone: false, ovaId: null }]);
        await setup();
        await waitFor(() => screen.getByRole('button', { name: 'alerta L1 aberto' }));
        await click('alerta L1 aberto');
        expect(mockData.updateAssetAlert).toHaveBeenCalledTimes(1);
        await click('Reportar');
        await click('confirmar Confirmar Reporte');
        expect(mockData.reportedOrderVisitAsset).toHaveBeenCalled();
        expect(mockData.updateAssetAlert).toHaveBeenCalledTimes(1);
    });
});

describe('OrderVisitAssetReport — revisar e aprovar', () => {
    beforeEach(() => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ processingId: 2 }));
    });

    it('revisão: confirma → marca Revisado, avisa e volta', async () => {
        mockPerms.view = new Set(['orders_visits_processing_review']);
        await setup();
        await click('Iniciar revisão');
        await click('Confirmar edição');
        expect(mockData.updateOrderVisitAssetProcessingStatus).toHaveBeenCalledWith('900', 3, '7');
        expect(mockToast.success).toHaveBeenCalledWith('Processamento alterado para Revisado');
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('aprovação (gestor do contrato): marca Aprovado', async () => {
        mockData.isUserContractManager.mockResolvedValue(true);
        await setup();
        await click('Iniciar aprovação');
        await click('Confirmar edição');
        expect(mockData.updateOrderVisitAssetProcessingStatus).toHaveBeenCalledWith('900', 5, '7');
        expect(mockToast.success).toHaveBeenCalledWith('Processamento alterado para Aprovado');
    });

    it('falha ao confirmar: desfaz a mudança otimista e avisa; não volta', async () => {
        mockPerms.view = new Set(['orders_visits_processing_review']);
        mockData.updateOrderVisitAssetProcessingStatus.mockRejectedValue(new Error('x'));
        await setup();
        await click('Iniciar revisão');
        await click('Confirmar edição');
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao confirmar processamento');
        expect(onBack).not.toHaveBeenCalled();
        expect(screen.getAllByRole('button', { name: 'Iniciar revisão' }).length).toBeGreaterThan(0);
    });

    it('aprovar ativo movido pede confirmação antes de gravar', async () => {
        mockData.isUserContractManager.mockResolvedValue(true);
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({
            processingId: 2, isMoved: true, afterClientId: 'C2', afterUnitId: 'U2', afterUnitAssetTagId: 'T2',
            afterStatusId: 'S2', afterPriorityId: 1, beforeUnitId: 'U1',
        }));
        await setup();
        await click('Iniciar aprovação');
        await click('Confirmar edição');
        expect(screen.getByRole('dialog', { name: 'Confirmar Aprovação com Movimentação' })).toBeInTheDocument();
        expect(mockData.updateOrderVisitAssetProcessingStatus).not.toHaveBeenCalled();
        await click('confirmar Confirmar Aprovação com Movimentação');
        expect(mockData.updateOrderVisitAssetProcessingStatus).toHaveBeenCalledWith('900', 5, '7');
    });

    it('cancelar a edição volta ao estado anterior sem gravar', async () => {
        mockPerms.view = new Set(['orders_visits_processing_review']);
        await setup();
        await click('Iniciar revisão');
        await click('Cancelar edição');
        expect(mockData.updateOrderVisitAssetProcessingStatus).not.toHaveBeenCalled();
        expect(screen.getAllByRole('button', { name: 'Iniciar revisão' }).length).toBeGreaterThan(0);
    });
});

describe('OrderVisitAssetReport — rascunho, rejeição e remoção', () => {
    it('reportado com visita em rascunho: reverter para rascunho e voltar', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ processingId: 2 }));
        await setup();
        await click('Reverter para rascunho');
        expect(mockData.updateOrderVisitAssetProcessingStatus).toHaveBeenCalledWith('900', 1, '7');
        expect(mockToast.info).toHaveBeenCalledWith('Relatório do ativo revertido para Rascunho');
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('mesmo se a reversão falhar, avisa e volta', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ processingId: 2 }));
        mockData.updateOrderVisitAssetProcessingStatus.mockRejectedValue(new Error('x'));
        await setup();
        await click('Reverter para rascunho');
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao retornar para rascunho');
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('rejeitar exige motivo; grava e marca como rejeitado', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ processingId: 2 }));
        mockPerms.view = new Set(['orders_visits_processing_disapprove']);
        await setup();
        await click('Rejeitar');
        const confirm = screen.getByRole('button', { name: 'Confirmar Rejeição' });
        expect(confirm).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Motivo da rejeição'), { target: { value: 'foto escura' } });
        expect(confirm).toBeEnabled();
        await act(async () => { fireEvent.click(confirm); });
        expect(mockData.disapproveOrderVisitAsset).toHaveBeenCalledWith('900', '7', 'foto escura');
        expect(mockToast.success).toHaveBeenCalledWith('Relatório Rejeitado');
        expect(screen.queryByLabelText('Motivo da rejeição')).not.toBeInTheDocument();
        expect(screen.getByText('foto escura')).toBeInTheDocument();
    });

    it('remover o ativo da visita: confirma, grava e volta', async () => {
        mockData.getActiveOrderVisit.mockResolvedValue({ ovProcessingId: 1, isFiled: false });
        await setup();
        await click('Remover ativo');
        await click('confirmar Remover Ativo');
        expect(mockData.removeAssetFromOrderVisit).toHaveBeenCalledWith('900');
        expect(mockToast.success).toHaveBeenCalledWith('Ativo removido da visita');
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('falha ao remover o ativo: mostra o motivo e não volta', async () => {
        mockData.removeAssetFromOrderVisit.mockRejectedValue(new Error('tem materiais'));
        await setup();
        await click('Remover ativo');
        await click('confirmar Remover Ativo');
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao remover ativo: tem materiais');
        expect(onBack).not.toHaveBeenCalled();
    });
});

describe('OrderVisitAssetReport — atividades e materiais', () => {
    it('remover atividade: grava com o usuário e some da lista', async () => {
        await setup();
        await click('remover atividade A1');
        expect(mockData.toggleOrderVisitAssetActivity).toHaveBeenCalledWith('900', 'A1', '7', false);
        expect(mockToast.success).toHaveBeenCalledWith('Atividade removida');
        expect(screen.queryByRole('button', { name: 'remover atividade A1' })).not.toBeInTheDocument();
    });

    it('falha ao remover atividade: avisa e a atividade continua', async () => {
        mockData.toggleOrderVisitAssetActivity.mockRejectedValue(new Error('x'));
        await setup();
        await click('remover atividade A1');
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao remover atividade');
        expect(screen.getByRole('button', { name: 'remover atividade A1' })).toBeInTheDocument();
    });

    it('remover material pede confirmação; confirma → grava e some', async () => {
        mockData.getOrderVisitAssetMaterials.mockResolvedValue([{ id: 'M1', materialDescription: 'Parafuso' }]);
        await setup();
        await click('remover material M1');
        expect(mockData.removeMaterialFromAsset).not.toHaveBeenCalled();
        await click('confirmar Remover Material');
        expect(mockData.removeMaterialFromAsset).toHaveBeenCalledWith('M1', '7');
        expect(mockToast.success).toHaveBeenCalledWith('Material removido');
        expect(screen.queryByRole('button', { name: 'remover material M1' })).not.toBeInTheDocument();
    });
});

describe('OrderVisitAssetReport — alertas', () => {
    const alerts = [
        { id: 'L1', isDeleted: false, isDone: false, ovaId: null },
        { id: 'L2', isDeleted: false, isDone: true, ovaId: '900' },
        { id: 'L3', isDeleted: false, isDone: true, ovaId: '777' },
        { id: 'L4', isDeleted: true, isDone: false, ovaId: null },
    ];

    it('mostra os em aberto e os concluídos NESTE ativo; esconde apagados e concluídos em outro', async () => {
        mockData.getAssetAlerts.mockResolvedValue(alerts);
        await setup();
        await waitFor(() => expect(screen.getByRole('button', { name: /alerta L1/ })).toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'alerta L1 aberto' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'alerta L2 feito' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /alerta L3/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /alerta L4/ })).not.toBeInTheDocument();
        expect(mockData.getAssetAlerts).toHaveBeenCalledWith('55');
    });

    it('marcar como feito: atualiza na hora e grava com ativo e usuário', async () => {
        mockData.getAssetAlerts.mockResolvedValue(alerts);
        await setup();
        await waitFor(() => screen.getByRole('button', { name: 'alerta L1 aberto' }));
        await click('alerta L1 aberto');
        expect(mockData.updateAssetAlert).toHaveBeenCalledWith('L1', { isDone: true, updatedUserId: '7', ovaId: '900' });
        expect(screen.getByRole('button', { name: 'alerta L1 feito' })).toBeInTheDocument();
    });

    it('falha ao gravar: desfaz a marcação e avisa', async () => {
        mockData.getAssetAlerts.mockResolvedValue(alerts);
        mockData.updateAssetAlert.mockRejectedValue(new Error('x'));
        await setup();
        await waitFor(() => screen.getByRole('button', { name: 'alerta L1 aberto' }));
        await click('alerta L1 aberto');
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao atualizar status do alerta.');
        expect(screen.getByRole('button', { name: 'alerta L1 aberto' })).toBeInTheDocument();
    });

    it('fora do rascunho (sem modo de edição) os alertas ficam desabilitados', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ processingId: 2 }));
        await setup();
        expect(screen.getByTestId('alerts')).toHaveAttribute('data-disabled', 'true');
    });

    it('somente leitura: nem mostra a seção de alertas', async () => {
        await setup({ readOnly: true });
        expect(screen.queryByTestId('alerts')).not.toBeInTheDocument();
    });
});

describe('OrderVisitAssetReport — próximo ativo', () => {
    const sibling = (id: string, code: string) => ({ id, code, description: code, beforeTagDescription: '', beforeTagSubDescription: '' });

    it('depois de reportar, mostra o aviso e abre o ativo seguinte após o intervalo', async () => {
        mockData.getOrderVisitAssets.mockResolvedValue([sibling('900', 'A'), sibling('901', 'B')]);
        const onNavigateAsset = jest.fn();
        await setup({ onNavigateAsset });
        await waitFor(() => expect(mockData.getOrderVisitAssets).toHaveBeenCalledWith('33'));
        await act(async () => { await Promise.resolve(); });

        jest.useFakeTimers();
        await click('Reportar');
        await click('confirmar Confirmar Reporte');
        expect(screen.getByRole('dialog', { name: 'Próximo Ativo' })).toBeInTheDocument();
        expect(onNavigateAsset).not.toHaveBeenCalled();
        expect(onBack).not.toHaveBeenCalled();
        await act(async () => { jest.advanceTimersByTime(1800); });
        expect(onNavigateAsset).toHaveBeenCalledWith(expect.objectContaining({ id: '901' }));
    });

    it('no último ativo da visita, volta em vez de avançar', async () => {
        mockData.getOrderVisitAssets.mockResolvedValue([sibling('899', 'A'), sibling('900', 'B')]);
        const onNavigateAsset = jest.fn();
        await setup({ onNavigateAsset });
        await waitFor(() => expect(mockData.getOrderVisitAssets).toHaveBeenCalled());
        await act(async () => { await Promise.resolve(); });
        await click('Reportar');
        await click('confirmar Confirmar Reporte');
        expect(onBack).toHaveBeenCalledTimes(1);
        expect(onNavigateAsset).not.toHaveBeenCalled();
    });
});
