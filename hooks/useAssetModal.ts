import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import { supabase } from '../services/core/supabase';
import { OrderType, Priority, User } from '../types';

/**
 * Estado e ações do modal de detalhe de um setor/ativo do painel "Unidades × Ativos":
 * dados do item, OS ativas, histórico de 7 dias, formulário de SS em passos e conclusão/avaliação
 * de OS. Extraído do `DashboardUnitsAssetsTags` (etapa 4 do PLANO_MELHORIAS_FRONTEND.md),
 * código copiado sem alteração.
 */
export const useAssetModal = (
    currentUser: User,
    selectedSystemId: string,
    loadDashboardData: (systemId: string, silent?: boolean) => Promise<unknown>,
) => {
    const [selectedAssetForModal, setSelectedAssetForModal] = useState<any | null>(null);
    const [modalData, setModalData] = useState<any | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [history7Days, setHistory7Days] = useState<{ date: string; isAvailable: boolean | null }[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyOffset, setHistoryOffset] = useState(0);
    const [activeOrdersForModal, setActiveOrdersForModal] = useState<any[]>([]);
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
    const [showSSForm, setShowSSForm] = useState(false);
    const [ssFormStep, setSsFormStep] = useState(1);
    const [ssFormLoading, setSsFormLoading] = useState(false);
    const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [ssFormData, setSsFormData] = useState({
        orderTypeId: '',
        priorityId: '',
        requestedServices: '',
        receiveNotifications: false
    });
    const [completingOrderId, setCompletingOrderId] = useState<string | number | null>(null);
    const [ratingOrderId, setRatingOrderId] = useState<string | number | null>(null);
    const [selectedRating, setSelectedRating] = useState<number>(0);

    useEffect(() => {
        if (!selectedAssetForModal?.id) {
            setModalData(null);
            setHistory7Days([]);
            setActiveOrdersForModal([]);
            setHistoryOffset(0);
            setHistoryOffset(0);
            setCurrentOrderIndex(0);
            setRatingOrderId(null);
            setSelectedRating(0);
            setRatingOrderId(null);
            setSelectedRating(0);
            return;
        }

        setCurrentOrderIndex(0);
        const fetchAllInfo = async () => {
            setModalLoading(true);
            try {
                // Fetch basic detail info
                const detailPromise = dataService.getUnitAssetTagItemById(selectedAssetForModal.id);
                // Fetch active orders (confirmed link: v_units_assets_tags.id = v_orders.unit_asset_tag_id)
                const ordersPromise = dataService.getActiveOrdersByAssetTagId(selectedAssetForModal.id);

                const [data, orders] = await Promise.all([detailPromise, ordersPromise]);

                setModalData(data);
                setActiveOrdersForModal(orders || []);
            } catch (error) {
                console.error('Error fetching modal detailed info:', error);
                setModalData(null);
                setActiveOrdersForModal([]);
            } finally {
                setModalLoading(false);
            }
        };

        fetchAllInfo();
    }, [selectedAssetForModal?.id]);

    useEffect(() => {
        setRatingOrderId(null);
        setSelectedRating(0);
    }, [currentOrderIndex]);

    useEffect(() => {
        if (!selectedAssetForModal?.id) return;

        const fetchHistoryData = async () => {
            setHistoryLoading(true);
            try {
                const historyData = await dataService.getAssetAvailabilityHistory7Days(selectedAssetForModal.id, historyOffset);
                setHistory7Days(historyData);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistoryData();
    }, [selectedAssetForModal?.id, historyOffset]);

    // Load order types and priorities for inline SS form
    useEffect(() => {
        if (!showSSForm) return;
        const load = async () => {
            try {
                const [types, prios] = await Promise.all([
                    dataService.getOrderTypes('active'),
                    dataService.getPriorities('active')
                ]);
                setOrderTypes(types);
                setPriorities(prios);
            } catch (e) {
                console.error('Error loading SS form lists', e);
            }
        };
        load();
    }, [showSSForm]);

    const openSSForm = () => {
        const defaultDescription = `${modalData?.asset_tag_tag_sub_description || ''}: ${modalData?.last_asset_unavailable_reason_description || ''} ${modalData?.last_comments || ''}`;
        setSsFormData({ 
            orderTypeId: '', 
            priorityId: '', 
            requestedServices: defaultDescription.trim(), 
            receiveNotifications: false 
        });
        setSsFormStep(1);
        setShowSSForm(true);
    };

    const closeSSForm = () => {
        setShowSSForm(false);
        setSsFormStep(1);
    };

    const handleSSFormNext = () => {
        if (ssFormStep === 1) {
            if (!ssFormData.orderTypeId) {
                toast.error('Selecione o Tipo de OS');
                return;
            }
            setSsFormStep(2);
        } else if (ssFormStep === 2) {
            // Prioridade não é obrigatória? Pelo código original não parece ser.
            // Vou permitir seguir sem selecionar se desejar, ou validar se houver regra.
            setSsFormStep(3);
        } else if (ssFormStep === 3) {
            if (!ssFormData.requestedServices) {
                toast.error('Descreva o problema');
                return;
            }
            setSsFormStep(4);
        }
    };

    const handleSSFormSubmit = async () => {
        if (!modalData) return;
        if (!ssFormData.orderTypeId || !ssFormData.requestedServices) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        setSsFormLoading(true);
        try {
            const createdOrder = await dataService.createServiceRequest({
                clientId: modalData.client_id?.toString(),
                unitId: modalData.unit_id?.toString(),
                typeId: ssFormData.orderTypeId,
                priorityId: ssFormData.priorityId || undefined,
                unitAssetTagId: modalData.id?.toString(),
                requestedServices: ssFormData.requestedServices,
            });

            if (ssFormData.receiveNotifications && createdOrder?.id) {
                try {
                    await supabase.from('orders_followers').insert({
                        o_id: parseInt(createdOrder.id),
                        user_id: parseInt(currentUser.id)
                    });
                } catch (followerErr) {
                    console.warn('Erro ao salvar seguidor:', followerErr);
                }
            }

            toast.success('Solicitação de Serviço criada com sucesso!');
            closeSSForm();

            await Promise.all([
                selectedAssetForModal?.id
                    ? dataService.getActiveOrdersByAssetTagId(selectedAssetForModal.id).then(orders => {
                        setActiveOrdersForModal(orders || []);
                        setCurrentOrderIndex(0);
                    })
                    : Promise.resolve(),
                selectedSystemId ? loadDashboardData(selectedSystemId, true) : Promise.resolve()
            ]);
        } catch (err) {
            console.error('Erro ao criar SS:', err);
            toast.error('Erro ao criar solicitação. Tente novamente.');
        } finally {
            setSsFormLoading(false);
        }
    };

    const handleCompleteOrder = async (orderId: string | number, rating: number = 0) => {
        setCompletingOrderId(orderId);
        try {
            const success = await dataService.completeServiceOrder(orderId, currentUser.id);
            if (success) {
                if (selectedAssetForModal?.id) {
                    await Promise.all([
                        dataService.getActiveOrdersByAssetTagId(selectedAssetForModal.id).then(orders => {
                            setActiveOrdersForModal(orders || []);
                            setCurrentOrderIndex(0);
                        }),
                        selectedSystemId ? loadDashboardData(selectedSystemId, true) : Promise.resolve()
                    ]);
                }
                setRatingOrderId(null);
                setSelectedRating(0);
            } else {
                toast.error('Ocorreu um erro ao concluir o serviço.');
            }
        } catch (error) {
            console.error('Error completing service:', error);
            toast.error('Erro ao finalizar serviço');
        } finally {
            setCompletingOrderId(null);
        }
    };

    return { selectedAssetForModal, setSelectedAssetForModal, modalData, modalLoading, history7Days, historyLoading, historyOffset, setHistoryOffset, activeOrdersForModal, currentOrderIndex, setCurrentOrderIndex, showSSForm, ssFormStep, setSsFormStep, ssFormLoading, orderTypes, priorities, ssFormData, setSsFormData, completingOrderId, ratingOrderId, setRatingOrderId, selectedRating, setSelectedRating, openSSForm, closeSSForm, handleSSFormNext, handleSSFormSubmit, handleCompleteOrder };
};
