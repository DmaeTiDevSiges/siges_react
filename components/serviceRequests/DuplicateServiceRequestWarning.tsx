import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Order, User } from '../../types';
import { dataService } from '../../services/dataService';
import { Loading } from '../ui/Loading';
import { Button } from '../ui/Button';
import { ServiceRequestCardDetail } from './ServiceRequestCardDetail';
import { useOrderFollow } from '../../hooks/useOrderFollow';

interface DuplicateServiceRequestWarningProps {
    unitId: string;
    unitAssetTagId?: string;
    typeId: string;
    assetTagId: string;
    assetTagSubId?: string | null;
    onContinue: () => void;
    onCancel: () => void;
    onSelectOrder?: (order: Order) => void;
    currentUser?: User | null;
}

export const DuplicateServiceRequestWarning: React.FC<DuplicateServiceRequestWarningProps> = ({
    unitId,
    unitAssetTagId,
    typeId,
    assetTagId,
    assetTagSubId,
    onContinue,
    onCancel,
    onSelectOrder,
    currentUser
}) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const PAGE_SIZE = 10;
    const { isOrderFollowed, toggleFollow } = useOrderFollow(currentUser?.id);

    // Função para formatar data em formato português
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Carrega SSs similares
    const loadDuplicates = useCallback(async (pageNum: number = 0) => {
        try {
            if (pageNum === 0) setIsLoading(true);
            
            const result = await dataService.getOrdersFilters({
                parentId: null, // Apenas SSs
                unitId,
                unitAssetTagId,
                orderTypeId: typeId,
                assetTagId,
                assetTagSubId,
                useGeneralView: false, // Auto-exclui status 7 e 8
                page: pageNum,
                pageSize: PAGE_SIZE
            });

            if (pageNum === 0) {
                setOrders(result.data);
            } else {
                setOrders(prev => [...prev, ...result.data]);
            }
            
            setHasMore(result.hasMore);
            setTotal(result.total);
            setPage(pageNum);
        } catch (error) {
            console.error('Erro ao carregar SSs duplicadas:', error);
            setOrders([]);
            setHasMore(false);
        } finally {
            if (pageNum === 0) setIsLoading(false);
        }
    }, [unitId, unitAssetTagId, typeId, assetTagId, assetTagSubId]);

    // Carrega na montagem
    useEffect(() => {
        loadDuplicates(0);
    }, [loadDuplicates]);

    // Infinity scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollWidth, scrollLeft, clientWidth } = container;
            if (scrollWidth - scrollLeft - clientWidth < 200 && hasMore && !isLoading) {
                loadDuplicates(page + 1);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, isLoading, page, loadDuplicates]);

    if (isLoading && orders.length === 0) {
        return (
            <section className="space-y-5 px-4 py-12">
                <div className="flex justify-center">
                    <Loading />
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-4 flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-2">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                            SSs Similares Encontradas
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Já existem {total} solicitações para a mesma unidade, tipo de SS e setor.
                        </p>
                    </div>
                </div>
            </div>

            {/* Lista horizontal de SSs */}
            <div className="overflow-x-auto no-scrollbar flex-1 py-4" ref={containerRef}>
                <div className="flex gap-4 px-4 pb-4 min-w-max">
                    {orders.map((order) => (
                        <div key={order.id} className="min-w-[320px] max-w-[360px] flex-shrink-0">
                            <ServiceRequestCardDetail
                                order={order}
                                onClick={() => {
                                    if (onSelectOrder) {
                                        onSelectOrder(order);
                                    }
                                }}
                                isFollowed={order.id ? isOrderFollowed(order.id) : false}
                                onToggleFollow={async (e) => {
                                    e.stopPropagation();
                                    if (order.id) await toggleFollow(order.id);
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Loading mais itens */}
            {hasMore && orders.length > 0 && (
                <div className="px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                    Carregue mais SSs rolando horizontalmente
                </div>
            )}

            {/* Botões de Ação */}
            <div className="px-4 space-y-3 pt-4">
                <Button
                    onClick={onContinue}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors active:scale-95"
                >
                    Continuar com Nova SS
                </Button>
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    className="w-full px-4 py-3 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-colors active:scale-95"
                >
                    Cancelar
                </Button>
            </div>
        </section>
    );
};
