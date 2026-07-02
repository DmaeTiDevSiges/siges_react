import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useOrderActions, OrderActionType } from '../../hooks/useOrderActions';
import { Order, User } from '../../types';
import { AuthorizeOrderModal } from './modals/AuthorizeOrderModal';
import { ScheduleOrderModal } from './modals/ScheduleOrderModal';
import { CancelOrderModal } from './modals/CancelOrderModal';
import { UpdateTeamModal } from './modals/UpdateTeamModal';

interface OrderActionManagerProps {
    order: Order;
    currentUser: User | null;
    onSuccess?: () => void;
    onEdit?: (order: Order) => void;
    className?: string;
}

const variantColors: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    danger: { bg: 'bg-red-500/10', text: 'text-red-500' },
    default: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
};

/**
 * Component that coordinates the ActionMenu (bottom sheet style) and its associated Modals
 */
export const OrderActionManager: React.FC<OrderActionManagerProps> = ({
    order,
    currentUser,
    onSuccess,
    onEdit,
    className
}) => {
    const { actions } = useOrderActions(order, currentUser);

    const [showMenu, setShowMenu] = useState(false);
    const [activeModal, setActiveModal] = useState<OrderActionType | null>(null);

    const handleAction = (actionId: string) => {
        const type = actionId as OrderActionType;
        if (type === 'DETAILS') {
            return;
        }
        if (type === 'EDIT_OS') {
            setShowMenu(false);
            onEdit?.(order);
            return;
        }
        setShowMenu(false);
        setActiveModal(type);
    };

    const handleSuccess = () => {
        if (onSuccess) onSuccess();
        setActiveModal(null);
    };

    const { canCreate } = usePermissions();

    if (actions.length === 0 || !canCreate('orders_requests')) return null;

    return (
        <div className={className}>
            {/* 3-dot Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                    showMenu
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-95'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10'
                }`}
                title="Mais ações"
            >
                <span className="material-symbols-outlined text-[20px] leading-none">
                    {showMenu ? 'close' : 'more_vert'}
                </span>
            </button>

            {/* Bottom Sheet Menu */}
            {showMenu && createPortal(
                <div className="fixed inset-0 z-100 flex items-end justify-center" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300" />

                    <div
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Icon Button - Top Right */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>

                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-14" />

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            {actions.map((action) => {
                                const colors = variantColors[action.variant];

                                return (
                                    <button
                                        key={action.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAction(action.id);
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-[0.98] group"
                                    >
                                        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text} shadow-sm transition-transform group-hover:scale-110`}>
                                            <span className="material-symbols-outlined text-[28px]">
                                                {action.icon}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                                {action.label}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {action.description}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Authorization / Generation Modals */}
            {(activeModal === 'GENERATE_OS' || activeModal === 'AUTHORIZE') && (
                <AuthorizeOrderModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    order={order}
                    onSuccess={handleSuccess}
                />
            )}

            {/* Scheduling Modals */}
            {(activeModal === 'SCHEDULE' || activeModal === 'RESCHEDULE') && (
                <ScheduleOrderModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    order={order}
                    onSuccess={handleSuccess}
                />
            )}

            {/* Cancellation Modal */}
            {activeModal === 'CANCEL' && (
                <CancelOrderModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    order={order}
                    onSuccess={handleSuccess}
                />
            )}

            {/* Team Management Modal */}
            {activeModal === 'UPDATE_TEAM' && (
                <UpdateTeamModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    order={order}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};
