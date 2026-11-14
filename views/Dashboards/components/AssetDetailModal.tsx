import React from 'react';
import { formatDateInBrazil } from '../../../utils/formatters';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { IconButton } from '../../../components/ui/IconButton';
import { Modal } from '../../../components/ui/Modal';
import { Textarea } from '../../../components/ui/Textarea';
import { PhotoViewer } from '../../../components/ui/PhotoViewer';
import { OptimizedImage } from '../../../components/ui/OptimizedImage';
import { formatDateTime } from '../../../utils/formatters';
import { AvailabilityHistory } from '../../../components/ui/AvailabilityHistory';
import { CompanyAvatar } from '../../../components/ui/CompanyAvatar';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Loading } from '../../../components/ui/Loading';
import type { useAssetModal } from '../../../hooks/useAssetModal';

interface AssetDetailModalProps {
    /** Estado e ações do modal (hook `useAssetModal`). */
    modal: ReturnType<typeof useAssetModal>;
    /** Carregando os dados do painel (usado no botão de atualização da SS). */
    loading: boolean;
    lightboxImage: string | null;
    setLightboxImage: (url: string | null) => void;
}

/** Modal "Detalhes da Disponibilidade" de um setor/ativo (JSX movido do DashboardUnitsAssetsTags sem alteração). */
export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ modal, loading, lightboxImage, setLightboxImage }) => {
    const {
        activeOrdersForModal,
        closeSSForm,
        completingOrderId,
        currentOrderIndex,
        handleCompleteOrder,
        handleSSFormNext,
        handleSSFormSubmit,
        history7Days,
        historyLoading,
        historyOffset,
        modalData,
        modalLoading,
        openSSForm,
        orderTypes,
        priorities,
        ratingOrderId,
        selectedAssetForModal,
        selectedRating,
        setCurrentOrderIndex,
        setHistoryOffset,
        setRatingOrderId,
        setSelectedAssetForModal,
        setSelectedRating,
        setSsFormData,
        setSsFormStep,
        showSSForm,
        ssFormData,
        ssFormLoading,
        ssFormStep,
    } = modal;

    return (
        <>
        {/* Asset Detail Modal */}
        <Modal
            isOpen={!!selectedAssetForModal}
            onClose={() => {
                setSelectedAssetForModal(null);
                closeSSForm();
            }}
            title="Detalhes da Disponibilidade"
            maxWidth="sm"
            fullScreenMobile
            draggable
        >
            {modalLoading ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3">
                    <Loading size="md" text="Carregando dados..." />
                </div>
            ) : modalData ? (
                <div className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 pb-8 sm:pb-10">

                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                        <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] flex items-center justify-center shadow-lg transition-transform shrink-0 ${modalData.isAvailable ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                                <span className="material-symbols-outlined text-2xl sm:text-3xl [font-variation-settings:'FILL'_1]">
                                    {modalData.isAvailable ? 'thumb_up' : 'thumb_down'}
                                </span>
                            </div>
                            <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
                                <span className="text-[12px] sm:text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight truncate">
                                    {modalData.unit_description}
                                </span>
                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                                    {modalData.asset_tag_tag_sub_description}{modalData.asset_tag_item_description ? ` > ${modalData.asset_tag_item_description}` : ''}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3 items-start w-full sm:w-auto">
                            {modalData.last_provider_company_logo && (
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-center p-1.5 sm:p-2 shrink-0">
                                    <OptimizedImage
                                        src={modalData.last_provider_company_logo}
                                        alt="Empresa"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            <IconButton
                                icon="engineering"
                                onClick={() => {
                                    if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
                                    openSSForm();
                                }}
                                className={`h-10 w-10 sm:h-11 sm:w-11 transition-all rounded-xl sm:rounded-2xl active:scale-95 shrink-0 ${
                                    showSSForm
                                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                                }`}
                                title="Nova Solicitação de Serviço"
                            />
                        </div>
                    </div>



                    {/* Dedicated Image Section if available */}
                    {modalData.last_reported_image && (
                        <div
                            className="w-full h-40 sm:h-48 rounded-[24px] sm:rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800/50 shadow-sm cursor-pointer hover:opacity-95 transition-all group relative"
                            onClick={() => setLightboxImage(modalData.last_reported_image)}
                        >
                            <OptimizedImage
                                src={modalData.last_reported_image}
                                alt="Evidência"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-white text-2xl sm:text-3xl opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                            </div>
                        </div>
                    )}

                    {/* Status Grid */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 space-y-2.5 sm:space-y-3 border border-slate-100 dark:border-slate-800/50">
                        {!modalData.isAvailable && (
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</span>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 uppercase text-right truncate ml-2">
                                    {modalData.last_asset_unavailable_reason_description || 'NÃO INFORMADO'}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Operação</span>
                            <span className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-white">
                                {modalData.isAvailable ? '1' : '0'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Registro</span>
                            <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 tabular-nums">
                                #{modalData.last_asset_available_id}
                            </span>
                        </div>
                    </div>

                    {/* Reporter Section */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-0.5">
                                <CompanyAvatar
                                    src={modalData.last_reported_by_company_logo}
                                    name="Equipe"
                                    size="md"
                                    className="rounded-xl!"
                                />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                    {modalData.last_reported_user_name_short || modalData.last_reported_by_name || modalData.last_created_user_name_short || 'Desconhecido'}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
                                    {modalData.last_reported_at ? formatDateTime(modalData.last_reported_at) : 'Sem data'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Inline SS Creation Form */}
                    {showSSForm && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                            {/* Step indicator */}
                            <div className="flex items-center w-full mb-3 px-1 gap-1">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors shrink-0 ${
                                    ssFormStep >= 1 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>1</div>
                                <div className={`flex-1 h-0.5 rounded transition-colors ${ssFormStep >= 2 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors shrink-0 ${
                                    ssFormStep >= 2 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>2</div>
                                <div className={`flex-1 h-0.5 rounded transition-colors ${ssFormStep >= 3 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors shrink-0 ${
                                    ssFormStep >= 3 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>3</div>
                                <div className={`flex-1 h-0.5 rounded transition-colors ${ssFormStep >= 4 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors shrink-0 ${
                                    ssFormStep >= 4 ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>4</div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[20px] p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                                {ssFormStep === 1 && (
                                    <Select
                                        label="Tipo de OS"
                                        required
                                        value={ssFormData.orderTypeId}
                                        onChange={(e) => setSsFormData(prev => ({ ...prev, orderTypeId: e.target.value }))}
                                        options={orderTypes.map(t => ({ value: t.id, label: t.description }))}
                                        placeholder="Selecione o Tipo"
                                    />
                                )}

                                {ssFormStep === 2 && (
                                    <Select
                                        label="Prioridade"
                                        value={ssFormData.priorityId}
                                        onChange={(e) => setSsFormData(prev => ({ ...prev, priorityId: e.target.value }))}
                                        options={priorities.map(p => ({ value: p.id, label: p.description }))}
                                        placeholder="Selecione a Prioridade"
                                    />
                                )}

                                {ssFormStep === 3 && (
                                    <Textarea
                                        label="Descrição do Problema"
                                        required
                                        rows={3}
                                        value={ssFormData.requestedServices}
                                        onChange={(e) => setSsFormData(prev => ({ ...prev, requestedServices: e.target.value }))}
                                        placeholder="Descreva a necessidade com detalhes..."
                                    />
                                )}

                                {ssFormStep === 4 && (
                                    <div className="py-1">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                                    Receber notificações
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                                    Acompanhe as atualizações desta solicitação
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSsFormData(prev => ({ ...prev, receiveNotifications: !prev.receiveNotifications }))}
                                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
                                                    ssFormData.receiveNotifications ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                                                }`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                                    ssFormData.receiveNotifications ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Form Actions */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={ssFormStep === 1 ? closeSSForm : () => setSsFormStep(prev => prev - 1)}
                                        className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                                    >
                                        {ssFormStep === 1 ? 'Cancelar' : 'Voltar'}
                                    </button>
                                    {ssFormStep < 4 ? (
                                        <button
                                            onClick={handleSSFormNext}
                                            disabled={(ssFormStep === 1 && !ssFormData.orderTypeId) || (ssFormStep === 2 && !ssFormData.priorityId) || (ssFormStep === 3 && !ssFormData.requestedServices)}
                                            className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-primary hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Próximo
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSSFormSubmit}
                                            disabled={ssFormLoading}
                                            className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {ssFormLoading ? (
                                                <Loading size="xs" />
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-sm">send</span>
                                                    Enviar
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Active Order Card */}
                    {activeOrdersForModal.length > 0 && !showSSForm && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 shadow-lg animate-in fade-in zoom-in duration-300 mx-1 relative">
                            {/* Header Row: Arrow - Title - Arrow */}
                            <div className="flex items-center justify-between mb-4">
                                {activeOrdersForModal.length > 1 ? (
                                    <button aria-label="OS anterior"
                                        onClick={() => setCurrentOrderIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentOrderIndex === 0}
                                        className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all shrink-0 ${currentOrderIndex === 0 ? 'text-slate-200 dark:text-slate-800' : 'text-black bg-amber-200/50 hover:bg-amber-200 active:scale-90 shadow-sm'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                                    </button>
                                ) : <div className="w-8" />}

                                <div className="flex flex-col items-center">
                                    <h4 className="text-[10px] font-black text-amber-800 dark:text-amber-500 uppercase tracking-[0.2em] text-center">
                                        {activeOrdersForModal.length === 1
                                            ? 'SOLICITAÇÃO ATIVA'
                                            : `${currentOrderIndex + 1}/${activeOrdersForModal.length} SOLICITAÇÕES ATIVAS`}
                                    </h4>
                                </div>

                                {activeOrdersForModal.length > 1 ? (
                                    <button aria-label="Próxima OS"
                                        onClick={() => setCurrentOrderIndex(prev => Math.min(activeOrdersForModal.length - 1, prev + 1))}
                                        disabled={currentOrderIndex === activeOrdersForModal.length - 1}
                                        className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all shrink-0 ${currentOrderIndex === activeOrdersForModal.length - 1 ? 'text-slate-200 dark:text-slate-800' : 'text-black bg-amber-200/50 hover:bg-amber-200 active:scale-90 shadow-sm'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    </button>
                                ) : <div className="w-8" />}
                            </div>

                            {/* Body: SS Info - Left Aligned */}
                            <div className="flex flex-col items-start px-1">
                                {activeOrdersForModal[currentOrderIndex] && (
                                    <div className="flex flex-col items-start gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300 w-full">
                                        <div className="flex items-center justify-between gap-2 mb-1 w-full">
                                            <span className="text-sm font-black text-black bg-amber-600 px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap">
                                                {activeOrdersForModal[currentOrderIndex].order_mask || activeOrdersForModal[currentOrderIndex].id}
                                            </span>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-amber-800/60 dark:text-amber-400/60 uppercase tracking-tighter text-right">
                                                    {activeOrdersForModal[currentOrderIndex].status_description}
                                                </span>
                                                {activeOrdersForModal[currentOrderIndex].status_at && (
                                                    <span className="text-[9px] font-bold text-amber-800/40 dark:text-amber-400/40 text-right">
                                                        {formatDateInBrazil(activeOrdersForModal[currentOrderIndex].status_at, 'dateTime', 'pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} h
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mt-1 leading-snug max-w-[280px] text-left">
                                            {activeOrdersForModal[currentOrderIndex].requested_services || 'Sem descrição'}
                                        </p>

                                        {ratingOrderId === activeOrdersForModal[currentOrderIndex].id ? (
                                            <div className="mt-4 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
                                                <span className="text-[10px] font-black text-amber-800/60 dark:text-amber-400/60 uppercase tracking-widest">Avalie o Serviço</span>
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button aria-label={`Avaliar com ${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
                                                            key={star}
                                                            onClick={() => setSelectedRating(prev => prev === star ? 0 : star)}
                                                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${selectedRating >= star ? 'text-amber-500 scale-110' : 'text-slate-300 dark:text-slate-700 hover:text-amber-200'}`}
                                                        >
                                                            <span className={`material-symbols-outlined text-2xl ${selectedRating >= star ? 'fill-1' : ''}`}>
                                                                star
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-4 w-full">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRatingOrderId(null);
                                                            setSelectedRating(0);
                                                        }}
                                                        className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        Voltar
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCompleteOrder(activeOrdersForModal[currentOrderIndex].id, selectedRating);
                                                        }}
                                                        disabled={!!completingOrderId}
                                                        className="flex-2 py-2.5 bg-amber-600 hover:bg-amber-700 rounded-xl text-[10px] font-black text-black uppercase tracking-widest shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-4 px-4 whitespace-nowrap"
                                                    >
                                                        {completingOrderId ? (
                                                            <Loading size="xs" />
                                                        ) : (
                                                            <>
                                                                <span className="material-symbols-outlined text-base">
                                                                    {selectedRating > 0 ? 'star' : 'done'}
                                                                </span>
                                                                {selectedRating > 0 ? `Confirmar (${selectedRating})` : 'Notificar sem avaliar'}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRating(0);
                                                    setRatingOrderId(activeOrdersForModal[currentOrderIndex].id);
                                                }}
                                                disabled={!!completingOrderId}
                                                className="mt-4 w-full py-2.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/30 rounded-xl text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-base">checklist</span>
                                                Conclusão Serviço
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Availability History with period navigation */}
                    <AvailabilityHistory
                        history={history7Days}
                        loading={historyLoading}
                        offsetDays={historyOffset}
                        onOffsetChange={(dir) => {
                            setHistoryOffset(prev => dir === 'prev' ? prev + 7 : Math.max(0, prev - 7));
                        }}
                    />
                </div>
            ) : (
                <div className="p-8 text-center text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    Erro ao carregar detalhes
                </div>
            )}
        </Modal>

        {lightboxImage && (
            <PhotoViewer
                src={lightboxImage}
                onClose={() => setLightboxImage(null)}
                alt="Evidência Fotográfica"
            />
        )}
        </>
    );
};
