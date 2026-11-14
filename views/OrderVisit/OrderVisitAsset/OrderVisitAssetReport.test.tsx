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
    updateAssetPhotoFromReport: jest.fn(),
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
const mockCamera = { getPhoto: jest.fn(), pickImages: jest.fn() };
const mockFs = { readFile: jest.fn() };
jest.mock('@capacitor/camera', () => ({
    Camera: { getPhoto: (...a: unknown[]) => mockCamera.getPhoto(...a), pickImages: (...a: unknown[]) => mockCamera.pickImages(...a) },
    CameraResultType: { Uri: 'uri' }, CameraSource: { Camera: 'CAMERA' },
}));
jest.mock('@capacitor/filesystem', () => ({ Filesystem: { readFile: (...a: unknown[]) => mockFs.readFile(...a) } }));
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
    AssetReportConditionSection: (p: Record<string, any>) => (
        <div data-testid={`cond-${p.side}`} data-readonly={String(p.isReadOnly)} data-cover={String(p.canUseAsCover)}>
            {p.value}
            <button onClick={() => p.onAdd(p.side)}>adicionar foto {p.side}</button>
            <button onClick={() => p.onEdit(p.side, 0)}>editar foto {p.side}</button>
            <button onClick={() => p.onEdit(p.side, 9)}>editar foto inexistente {p.side}</button>
            <button onClick={() => p.onUseAsCover(`https://x.test/storage/v1/object/public/bucket/companies/CO/assets/55/${p.side}.jpg?t=1`)}>usar como capa {p.side}</button>
            <button onClick={() => p.onView(p.photos[0]?.url)}>ver foto {p.side}</button>
            {p.onFileDrop && <button onClick={() => p.onFileDrop(p.side, new File(['x'], 'solto.png', { type: 'image/png' }))}>soltar arquivo {p.side}</button>}
        </div>
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
    AssetReportMovementSection: (p: Record<string, any>) => (
        <div data-testid="movement" data-moved={String(p.isMoved)} data-missing={String(p.showMissing)} data-readonly={String(p.isReadOnly)}
            data-values={JSON.stringify(p.values)} data-origin={JSON.stringify(p.origin)}>
            <button onClick={() => p.onToggle(true)}>ligar movimentação</button>
            <button onClick={() => p.onToggle(false)}>desligar movimentação</button>
            <button onClick={() => p.onClientChange('C9')}>trocar cliente</button>
            <button onClick={() => p.onUnitChange('U9')}>trocar unidade</button>
            <button onClick={() => p.onUnitAssetTagChange({ id: 'T9', description: 'Sala', asset_tag_id: 4, asset_tag_sub_id: 8 })}>escolher setor</button>
            <button onClick={() => p.onUnitAssetTagChange(null)}>limpar setor</button>
            <button onClick={() => p.onStatusChange('S9')}>trocar situação</button>
            <button onClick={() => p.onPriorityChange(3)}>trocar prioridade</button>
            <button onClick={() => p.onPriorityChange(undefined)}>limpar prioridade</button>
            <button onClick={() => p.onLocationChange('Sala 9')}>trocar local</button>
            <button onClick={() => p.onCommentsChange('obs')}>trocar observação</button>
            <button onClick={() => p.onTextBlur()}>sair do texto</button>
        </div>
    ),
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
    Modal: (p: { isOpen: boolean; title: unknown; onConfirm?: () => void; onClose: () => void; message?: string }) => p.isOpen ? (
        <div role="dialog" aria-label={String(p.title)}>
            <span>{p.message}</span>
            <button onClick={p.onConfirm}>confirmar {String(p.title)}</button>
            <button onClick={p.onClose}>cancelar {String(p.title)}</button>
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
jest.mock('../../../components/ui/PhotoViewer', () => ({
    PhotoViewer: (p: { src: string; images: string[]; initialIndex: number; onClose: () => void }) => (
        <div data-testid="viewer" data-src={p.src} data-images={p.images.join('|')} data-index={p.initialIndex}>
            <button onClick={p.onClose}>fechar visualizador</button>
        </div>
    ),
}));
jest.mock('../../../components/ui/ImageUploadSheet', () => ({
    ImageUploadSheet: (p: { onTakeCamera: () => void; onSelectGallery: () => void; onClose: () => void }) => (
        <div data-testid="sheet">
            <button onClick={p.onTakeCamera}>tirar foto</button>
            <button onClick={p.onSelectGallery}>escolher da galeria</button>
            <button onClick={p.onClose}>fechar folha</button>
        </div>
    ),
}));
jest.mock('../../../components/ui/ImageEditorModal', () => ({
    ImageEditorModal: (p: { imageFile: File | string; onSave: (f: File) => void; onClose: () => void }) => (
        <div data-testid="editor" data-src={typeof p.imageFile === 'string' ? p.imageFile : `${p.imageFile.name}|${p.imageFile.type}`}>
            <button onClick={() => p.onSave(new File(['e'], 'editada.jpg', { type: 'image/jpeg' }))}>salvar edição da foto</button>
            <button onClick={p.onClose}>fechar editor</button>
        </div>
    ),
}));

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
    mockPhotos.reset.mockReset(); mockPhotos.savePhoto.mockReset(); mockPhotos.removePhoto.mockReset();
    mockCamera.getPhoto.mockReset(); mockCamera.pickImages.mockReset(); mockFs.readFile.mockReset();
    (global as any).fetch = jest.fn().mockResolvedValue({ blob: async () => new Blob(['img'], { type: 'image/jpeg' }) });
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

describe('OrderVisitAssetReport — fotos', () => {
    const editorSrc = () => screen.getByTestId('editor').getAttribute('data-src');

    it('tirar foto: abre o editor com o arquivo da câmera (nome por lado, tipo da imagem)', async () => {
        mockCamera.getPhoto.mockResolvedValue({ webPath: 'blob:abc', format: 'jpeg' });
        await setup();
        await click('adicionar foto initial');
        expect(screen.getByTestId('sheet')).toBeInTheDocument();
        await click('tirar foto');
        expect(editorSrc()).toMatch(/^report_initial_\d+\.jpeg\|image\/jpeg$/);
        expect(mockCamera.getPhoto).toHaveBeenCalledWith(expect.objectContaining({ quality: 80, allowEditing: false }));
    });

    it('câmera sem imagem ou cancelada: nada abre e nada é avisado', async () => {
        await setup();
        mockCamera.getPhoto.mockResolvedValueOnce({ format: 'jpeg' });
        await click('adicionar foto final');
        await click('tirar foto');
        expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
        mockCamera.getPhoto.mockRejectedValueOnce(new Error('cancelado'));
        await click('tirar foto');
        expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
        expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('galeria: abre o editor com a foto escolhida', async () => {
        mockCamera.pickImages.mockResolvedValue({ photos: [{ webPath: 'blob:g', format: 'png' }] });
        await setup();
        await click('adicionar foto final');
        await click('escolher da galeria');
        expect(editorSrc()).toMatch(/^report_final_\d+\.png\|image\/jpeg$/);
        expect(mockCamera.pickImages).toHaveBeenCalledWith({ quality: 80, limit: 1 });
    });

    it('galeria sem seleção: nada abre', async () => {
        mockCamera.pickImages.mockResolvedValue({ photos: [] });
        await setup();
        await click('adicionar foto initial');
        await click('escolher da galeria');
        expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
    });

    it('galeria: se o endereço não abre, lê o arquivo pelo caminho (Android) e abre o editor', async () => {
        (global as any).fetch = jest.fn()
            .mockRejectedValueOnce(new Error('bloqueado'))
            .mockResolvedValueOnce({ blob: async () => new Blob(['b'], { type: 'image/jpeg' }) });
        mockFs.readFile.mockResolvedValue({ data: 'QUJD' });
        mockCamera.pickImages.mockResolvedValue({ photos: [{ webPath: 'content://x', path: '/storage/x.jpg', format: 'jpeg' }] });
        await setup();
        await click('adicionar foto initial');
        await click('escolher da galeria');
        expect(mockFs.readFile).toHaveBeenCalledWith({ path: '/storage/x.jpg' });
        expect((global as any).fetch).toHaveBeenLastCalledWith('data:image/jpeg;base64,QUJD');
        expect(editorSrc()).toMatch(/^report_initial_\d+\.jpeg/);
    });

    it('galeria: se não abre e não há caminho, desiste sem avisar', async () => {
        (global as any).fetch = jest.fn().mockRejectedValue(new Error('bloqueado'));
        mockCamera.pickImages.mockResolvedValue({ photos: [{ webPath: 'x', format: 'jpeg' }] });
        await setup();
        await click('adicionar foto initial');
        await click('escolher da galeria');
        expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
        expect(mockFs.readFile).not.toHaveBeenCalled();
    });

    it('limite de 3 fotos por lado: avisa e não abre câmera nem galeria', async () => {
        mockPhotos.initialPhotos = [{ url: 'a' }, { url: 'b' }, { url: 'c' }];
        await setup();
        await click('adicionar foto initial');
        await click('tirar foto');
        await click('escolher da galeria');
        expect(mockToast.error).toHaveBeenCalledWith('Máximo de 3 fotos permitido');
        expect(mockCamera.getPhoto).not.toHaveBeenCalled();
        expect(mockCamera.pickImages).not.toHaveBeenCalled();
        // o outro lado (1 foto) continua livre
        mockToast.error.mockClear();
        mockCamera.getPhoto.mockResolvedValue({ webPath: 'blob:z', format: 'jpeg' });
        await click('adicionar foto final');
        await click('tirar foto');
        expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('arrastar arquivo (web): abre o editor com o próprio arquivo', async () => {
        await setup();
        await click('soltar arquivo final');
        expect(editorSrc()).toBe('solto.png|image/png');
    });

    it('arrastar arquivo no limite de fotos: avisa e não abre o editor', async () => {
        mockPhotos.finalPhotos = [{ url: 'a' }, { url: 'b' }, { url: 'c' }];
        await setup();
        await click('soltar arquivo final');
        expect(mockToast.error).toHaveBeenCalledWith('Máximo de 3 fotos permitido');
        expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
    });

    it('editar foto existente: abre o editor com a URL; foto ainda subindo pede para aguardar', async () => {
        await setup();
        await click('editar foto initial');
        expect(editorSrc()).toBe('antes.jpg');
        await click('fechar editor');
        expect(screen.queryByTestId('editor')).not.toBeInTheDocument();

        mockPhotos.initialPhotos = [{ url: 'antes.jpg', pending: true } as never];
        await click('editar foto initial');
        expect(mockToast.info).toHaveBeenCalledWith('Aguarde o envio desta foto terminar');
        expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
    });

    it('editar foto que não existe: ignora', async () => {
        await setup();
        await click('editar foto inexistente initial');
        expect(screen.queryByTestId('editor')).not.toBeInTheDocument();
        expect(mockToast.info).not.toHaveBeenCalled();
    });

    it('salvar a edição: entrega ao hook de fotos (lado, posição ou null para nova) e fecha o editor', async () => {
        await setup();
        await click('editar foto final');
        await click('salvar edição da foto');
        expect(mockPhotos.savePhoto).toHaveBeenCalledWith('final', 0, expect.any(File));
        expect(screen.queryByTestId('editor')).not.toBeInTheDocument();

        mockCamera.getPhoto.mockResolvedValue({ webPath: 'blob:n', format: 'jpeg' });
        await click('adicionar foto initial');
        await click('tirar foto');
        await click('salvar edição da foto');
        expect(mockPhotos.savePhoto).toHaveBeenLastCalledWith('initial', null, expect.any(File));
    });

    it('ver foto: o visualizador recebe todas as fotos (antes + depois) e a posição da escolhida', async () => {
        await setup();
        await click('ver foto final');
        const viewer = screen.getByTestId('viewer');
        expect(viewer).toHaveAttribute('data-images', 'antes.jpg|depois.jpg');
        expect(viewer).toHaveAttribute('data-index', '1');
        await click('fechar visualizador');
        expect(screen.queryByTestId('viewer')).not.toBeInTheDocument();
    });

    it('fechar a folha de envio', async () => {
        await setup();
        await click('adicionar foto initial');
        await click('fechar folha');
        expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
    });
});

describe('OrderVisitAssetReport — foto de capa', () => {
    beforeEach(() => {
        mockData.updateAssetPhotoFromReport.mockResolvedValue(undefined);
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ oCompanyId: 'CO' }));
    });

    it('só gestor do contrato/super admin e visita não arquivada podem usar como capa', async () => {
        await setup();
        expect(screen.getByTestId('cond-initial')).toHaveAttribute('data-cover', 'false');
    });

    it('gestor (role manager) com visita aberta: pode usar como capa', async () => {
        mockData.isUserContractManager.mockResolvedValue(true);
        mockData.getContractManagers.mockResolvedValue([{ managerId: '7', role: 'Manager' }]);
        await setup();
        expect(screen.getByTestId('cond-initial')).toHaveAttribute('data-cover', 'true');
    });

    it('gestor só leitor (viewer) não pode', async () => {
        mockData.getContractManagers.mockResolvedValue([{ managerId: '7', role: 'viewer' }]);
        await setup();
        expect(screen.getByTestId('cond-initial')).toHaveAttribute('data-cover', 'false');
    });

    it('confirmar: manda ativo, empresa, nome do arquivo e pasta de origem', async () => {
        await setup();
        await click('usar como capa initial');
        expect(screen.getByRole('dialog', { name: 'Usar como Foto de Capa' })).toBeInTheDocument();
        await click('confirmar Usar como Foto de Capa');
        expect(mockData.updateAssetPhotoFromReport).toHaveBeenCalledWith('55', 'CO', 'initial.jpg', 'companies/CO/assets/55');
        expect(mockToast.success).toHaveBeenCalledWith('Foto do ativo atualizada com sucesso!');
        expect(screen.queryByRole('dialog', { name: 'Usar como Foto de Capa' })).not.toBeInTheDocument();
    });

    it('falha: avisa e a janela continua aberta', async () => {
        mockData.updateAssetPhotoFromReport.mockRejectedValue(new Error('x'));
        await setup();
        await click('usar como capa final');
        await click('confirmar Usar como Foto de Capa');
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao atualizar foto do ativo');
        expect(screen.getByRole('dialog', { name: 'Usar como Foto de Capa' })).toBeInTheDocument();
    });

    it('cancelar fecha a janela sem gravar', async () => {
        await setup();
        await click('usar como capa initial');
        await click('cancelar Usar como Foto de Capa');
        expect(screen.queryByRole('dialog', { name: 'Usar como Foto de Capa' })).not.toBeInTheDocument();
        expect(mockData.updateAssetPhotoFromReport).not.toHaveBeenCalled();
    });

    it('ativo sem empresa carregada: confirmar não faz nada', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ oCompanyId: undefined }));
        await setup();
        await click('usar como capa initial');
        await click('confirmar Usar como Foto de Capa');
        expect(mockData.updateAssetPhotoFromReport).not.toHaveBeenCalled();
    });
});

describe('OrderVisitAssetReport — movimentação', () => {
    const origin = {
        clientId: 'C1', beforeClientId: 'C1', beforeUnitId: 'U1', beforeUnitAssetTagId: 'T1',
        beforePriorityId: 2, beforeStatusId: 'S1', beforeLocation: 'Sala 3',
        beforeClientName: 'Cliente Um', beforeUnitDescription: 'Unidade Um', beforeTagDescription: 'Setor A',
        beforeTagSubDescription: 'Posição 2', beforeStatusDescription: 'Operando',
    };
    const movedTo = { afterClientId: 'C2', afterUnitId: 'U2', afterUnitAssetTagId: 'T2', afterStatusId: 'S2', afterPriorityId: 1, afterLocation: 'Sala 8' };
    const values = () => JSON.parse(screen.getByTestId('movement').getAttribute('data-values')!);
    const attr = (name: string) => screen.getByTestId('movement').getAttribute(`data-${name}`);

    it('carga: destino começa como o que foi gravado, ou como a origem (cliente e unidade)', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset(origin));
        await setup();
        expect(attr('moved')).toBe('false');
        expect(values()).toMatchObject({ clientId: 'C1', unitId: 'U1', unitAssetTagId: '', statusId: '', location: '', comments: '' });
        expect(values().priorityId).toBeUndefined();
    });

    it('carga: destino gravado tem prioridade sobre a origem', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, ...movedTo, isMoved: true, movedComments: 'mudou' }));
        await setup();
        expect(attr('moved')).toBe('true');
        expect(values()).toEqual({ clientId: 'C2', unitId: 'U2', unitAssetTagId: 'T2', statusId: 'S2', priorityId: 1, location: 'Sala 8', comments: 'mudou' });
    });

    it('origem exibida: cliente, unidade, setor / posição, situação e local', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset(origin));
        await setup();
        expect(JSON.parse(attr('origin')!)).toEqual({
            clientName: 'Cliente Um', unitDescription: 'Unidade Um', tagDescription: 'Setor A / Posição 2',
            statusDescription: 'Operando', location: 'Sala 3',
        });
    });

    it('ligar: preenche o destino com o que falta da origem (inclusive prioridade 0) e grava só isso', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, beforePriorityId: 0 }));
        await setup();
        await click('ligar movimentação');
        expect(attr('moved')).toBe('true');
        expect(mockAutosave.saveNow).toHaveBeenCalledWith({
            is_moved: true, after_unit_asset_tag_id: 'T1', after_priority_id: 0, after_status_id: 'S1', after_location: 'Sala 3',
        });
        expect(values()).toMatchObject({ clientId: 'C1', unitId: 'U1', unitAssetTagId: 'T1', statusId: 'S1', priorityId: 0, location: 'Sala 3' });
    });

    it('ligar com o destino já preenchido: só marca "movido"', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, ...movedTo, isMoved: false }));
        await setup();
        await click('ligar movimentação');
        expect(mockAutosave.saveNow).toHaveBeenCalledWith({ is_moved: true });
    });

    it('desligar: pede confirmação sem gravar nada; cancelar mantém tudo', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, ...movedTo, isMoved: true }));
        await setup();
        await click('desligar movimentação');
        expect(screen.getByRole('dialog', { name: 'Desligar movimentação' })).toBeInTheDocument();
        expect(mockAutosave.saveNow).not.toHaveBeenCalled();
        await click('cancelar Desligar movimentação');
        expect(screen.queryByRole('dialog', { name: 'Desligar movimentação' })).not.toBeInTheDocument();
        expect(attr('moved')).toBe('true');
    });

    it('desligar e confirmar: zera o destino, grava tudo nulo, avisa e fecha a janela', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, ...movedTo, isMoved: true, movedComments: 'x' }));
        await setup();
        await click('desligar movimentação');
        await click('confirmar Desligar movimentação');
        expect(mockAutosave.saveNow).toHaveBeenCalledWith({
            is_moved: false, after_client_id: null, after_unit_id: null, after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null,
            after_status_id: null, after_priority_id: null, after_location: null, moved_comments: null,
        });
        expect(mockToast.info).toHaveBeenCalledWith('Movimentação desativada e dados de destino resetados');
        expect(attr('moved')).toBe('false');
        expect(values()).toEqual({ clientId: '', unitId: '', unitAssetTagId: '', statusId: '', location: '', comments: '' });
        expect(screen.queryByRole('dialog', { name: 'Desligar movimentação' })).not.toBeInTheDocument();
    });

    it('trocar cliente: zera unidade e setor (na tela e no banco)', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, ...movedTo, isMoved: true }));
        await setup();
        await click('trocar cliente');
        expect(values()).toMatchObject({ clientId: 'C9', unitId: '', unitAssetTagId: '' });
        expect(mockAutosave.saveNow).toHaveBeenCalledWith({
            after_client_id: 'C9', after_unit_id: null, after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null,
        });
    });

    it('trocar unidade: zera o setor', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, ...movedTo, isMoved: true }));
        await setup();
        await click('trocar unidade');
        expect(values()).toMatchObject({ clientId: 'C2', unitId: 'U9', unitAssetTagId: '' });
        expect(mockAutosave.saveNow).toHaveBeenCalledWith({ after_unit_id: 'U9', after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null });
    });

    it('escolher setor: grava o vínculo e os ids de tag e subtag como texto; limpar grava nulos', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, ...movedTo, isMoved: true }));
        await setup();
        await click('escolher setor');
        expect(values().unitAssetTagId).toBe('T9');
        expect(mockAutosave.saveNow).toHaveBeenCalledWith({ after_unit_asset_tag_id: 'T9', after_tag_id: '4', after_tag_sub_id: '8' });
        await click('limpar setor');
        expect(values().unitAssetTagId).toBe('');
        expect(mockAutosave.saveNow).toHaveBeenLastCalledWith({ after_unit_asset_tag_id: null, after_tag_id: null, after_tag_sub_id: null });
    });

    it('situação, prioridade, local e observação: situação/prioridade gravam na hora; local/observação entram na fila do autosave', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, ...movedTo, isMoved: true }));
        await setup();
        await click('trocar situação');
        expect(mockAutosave.saveNow).toHaveBeenLastCalledWith({ after_status_id: 'S9' });
        await click('trocar prioridade');
        expect(mockAutosave.saveNow).toHaveBeenLastCalledWith({ after_priority_id: 3 });
        await click('limpar prioridade');
        expect(mockAutosave.saveNow).toHaveBeenLastCalledWith({ after_priority_id: null });
        await click('trocar local');
        expect(mockAutosave.queueSave).toHaveBeenLastCalledWith({ after_location: 'Sala 9' });
        await click('trocar observação');
        expect(mockAutosave.queueSave).toHaveBeenLastCalledWith({ moved_comments: 'obs' });
        await click('sair do texto');
        expect(mockAutosave.flushQuietly).toHaveBeenCalled();
        expect(values()).toMatchObject({ statusId: 'S9', location: 'Sala 9', comments: 'obs' });
        expect(values().priorityId).toBeUndefined();
    });

    it('aviso de campos faltando: só quando movido, incompleto e editável', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, isMoved: true }));
        await setup();
        expect(attr('missing')).toBe('true');
        await click('escolher setor');
        await click('trocar situação');
        await click('trocar prioridade');
        expect(attr('missing')).toBe('false');
    });

    it('sem movimentação não mostra o aviso; somente leitura também não', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset(origin));
        const first = await setup();
        expect(attr('missing')).toBe('false');
        first.unmount();
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, isMoved: true }));
        await setup({ readOnly: true });
        expect(attr('missing')).toBe('false');
        expect(attr('readonly')).toBe('true');
    });

    it('progresso: a movimentação entra na lista só quando ligada, e conclui com o destino completo', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset(origin));
        await setup();
        expect(screen.getAllByTestId('progress')[0]).not.toHaveTextContent('movement');
        await click('ligar movimentação');
        expect(screen.getAllByTestId('progress')[0]).toHaveTextContent('movement:true');
    });

    it('reportar com movimentação incompleta: avisa os campos e não abre confirmação', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, isMoved: true }));
        await setup();
        await click('Reportar');
        expect(mockToast.error).toHaveBeenCalledWith('Preencha todos os campos obrigatórios da movimentação');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('reportar movimentação para o MESMO lugar: abre o aviso "Atenção" (sem toast)', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({
            ...origin, isMoved: true, afterClientId: 'C1', afterUnitId: 'U1', afterUnitAssetTagId: 'T1',
            afterStatusId: 'S1', afterPriorityId: 2, afterLocation: 'Sala 3',
        }));
        await setup();
        await click('Reportar');
        expect(screen.getByRole('dialog', { name: 'Atenção' })).toBeInTheDocument();
        expect(screen.queryByRole('dialog', { name: 'Confirmar Reporte' })).not.toBeInTheDocument();
        expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('reportar movimentação completa e diferente da origem: segue para a confirmação', async () => {
        mockData.getOrderVisitAssetById.mockResolvedValue(asset({ ...origin, ...movedTo, isMoved: true }));
        await setup();
        await click('Reportar');
        expect(screen.getByRole('dialog', { name: 'Confirmar Reporte' })).toBeInTheDocument();
    });
});
