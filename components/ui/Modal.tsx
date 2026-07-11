import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Loading } from './Loading';


// Safe haptic trigger (no-op on web)
const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
        try { await Haptics.impact({ style }); } catch { /* ignore */ }
    }
};

const SWIPE_DISMISS_THRESHOLD = 120; // px downward before dismissing

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: React.ReactNode;
    message?: string;
    children?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    fullScreenMobile?: boolean;
    hideHeader?: boolean;
    noPadding?: boolean;
    loading?: boolean;
    confirmLoading?: boolean;
    confirmLoadingLabel?: string;
    draggable?: boolean;
    hideCancelButton?: boolean;
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    children,
    confirmLabel,
    cancelLabel = 'Cancelar',
    type = 'info',
    maxWidth = 'sm',
    fullScreenMobile = false,
    hideHeader = false,
    noPadding = false,
    confirmLoading = false,
    confirmLoadingLabel,
    draggable = false,
    hideCancelButton = false,
    className,
}) => {
    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // --- Drag state ---
    const modalRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDraggingActive, setIsDraggingActive] = useState(false); // for visual feedback
    const [dismissProgress, setDismissProgress] = useState(0);       // 0-1 swipe-to-dismiss progress
    const dragState = useRef<{
        startX: number; startY: number;
        originX: number; originY: number;
    } | null>(null);
    const isDragging = useRef(false);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setPosition(null);
            setIsDraggingActive(false);
            setDismissProgress(0);
        }
    }, [isOpen]);

    const onDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggable || !modalRef.current) return;
        // Skip if clicking a button/interactive child
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[role="button"]')) return;

        isDragging.current = true;
        setIsDraggingActive(true);
        const rect = modalRef.current.getBoundingClientRect();
        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: rect.left,
            originY: rect.top,
        };

        triggerHaptic(ImpactStyle.Light);
    }, [draggable]);

    const onDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current || !dragState.current || !modalRef.current) return;

        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;
        const newX = dragState.current.originX + dx;
        const newY = dragState.current.originY + dy;

        // Swipe-to-dismiss: track downward progress
        if (dy > 0) {
            const progress = Math.min(dy / SWIPE_DISMISS_THRESHOLD, 1);
            setDismissProgress(progress);
        } else {
            setDismissProgress(0);
        }

        // Clamp inside viewport
        const rect = modalRef.current.getBoundingClientRect();
        const clampedX = Math.max(8, Math.min(window.innerWidth - rect.width - 8, newX));
        const clampedY = Math.max(8, Math.min(window.innerHeight - rect.height - 8, newY));
        setPosition({ x: clampedX, y: clampedY });
    }, []);

    const onDragEnd = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        setIsDraggingActive(false);

        // Swipe-to-dismiss: if dragged far enough down, close
        if (dismissProgress >= 1) {
            triggerHaptic(ImpactStyle.Medium);
            setDismissProgress(0);
            onClose();
            return;
        }

        setDismissProgress(0);
        triggerHaptic(ImpactStyle.Light);
        dragState.current = null;
    }, [dismissProgress, onClose]);

    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'warning':
                return {
                    icon: 'warning',
                    color: 'text-amber-500',
                    bg: 'bg-amber-50 dark:bg-amber-900/10',
                    button: 'bg-amber-500 hover:bg-amber-600'
                };
            case 'error':
                return {
                    icon: 'error',
                    color: 'text-red-500',
                    bg: 'bg-red-50 dark:bg-red-900/10',
                    button: 'bg-red-500 hover:bg-red-600'
                };
            case 'success':
                return {
                    icon: 'check_circle',
                    color: 'text-green-500',
                    bg: 'bg-green-50 dark:bg-green-900/10',
                    button: 'bg-green-500 hover:bg-green-600'
                };
            default:
                return {
                    icon: 'info',
                    color: 'text-primary',
                    bg: 'bg-blue-50 dark:bg-blue-900/10',
                    button: 'bg-primary hover:bg-primary-dark'
                };
        }
    };

    const styles = getTypeStyles();

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl'
    };

    // Dynamic styles when draggable
    const draggableStyle: React.CSSProperties = draggable ? {
        position: position ? 'fixed' : 'relative',
        zIndex: 10000,
        ...(position && { left: position.x, top: position.y }),
        // Elevation increase + slight scale while dragging
        boxShadow: isDraggingActive
            ? '0 32px 80px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.25)'
            : undefined,
        transform: isDraggingActive ? 'scale(1.02)' : undefined,
        // Opacity feedback during swipe-to-dismiss
        opacity: 1 - dismissProgress * 0.4,
        transition: isDraggingActive
            ? 'box-shadow 150ms ease, opacity 100ms ease'
            : 'box-shadow 200ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
    } : {};

    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
            style={{ zIndex: 9999, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            {/* Backdrop — dimmer when near dismiss threshold */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                style={draggable ? { opacity: 1 - dismissProgress * 0.5 } : undefined}
                onClick={draggable ? undefined : onClose}
            />

            {/* Modal Container */}
            <div
                ref={modalRef}
                className={`relative flex flex-col w-full ${maxWidthClasses[maxWidth]} 
                    ${fullScreenMobile ? 'h-auto max-h-[92vh]' : 'max-h-[90vh]'} 
                    shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300
                    ${draggable ? 'select-none' : ''} ${className || 'bg-white dark:bg-card-dark rounded-2xl'}`}
                style={draggableStyle}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerLeave={onDragEnd}
            >
                {children ? (
                    <div className="flex flex-col flex-1 min-h-0">
                        {!hideHeader && (
                            <div
                                className={`border-b border-slate-100 dark:border-slate-800 flex flex-col shrink-0 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                style={{ minHeight: 44 }}
                                onPointerDown={draggable ? onDragStart : undefined}
                                aria-label={draggable ? 'Arrastar para reposicionar' : undefined}
                            >
                                {/* Pill drag handle — mobile-native pattern */}
                                {draggable && (
                                    <div className="flex justify-center pt-2.5 pb-1 pointer-events-none">
                                        <div
                                            className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors"
                                            style={{
                                                backgroundColor: isDraggingActive
                                                    ? 'var(--color-primary, #00B4B4)'
                                                    : undefined
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Title + Close row */}
                                <div className="px-[24px] pb-[24px] pt-[24px] flex items-center justify-between gap-2">
                                    <h3 className="flex-1 flex items-center gap-2">
                                        {typeof title === 'string' ? (
                                            <span className="text-lg font-black text-slate-900 dark:text-white uppercase leading-none">{title}</span>
                                        ) : (
                                            title
                                        )}
                                    </h3>
                                    <IconButton
                                        icon="close"
                                        onClick={onClose}
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0"
                                    />
                                </div>

                                {/* Swipe-to-dismiss hint bar */}
                                {draggable && dismissProgress > 0 && (
                                    <div className="px-4 pb-2">
                                        <div className="h-0.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${dismissProgress * 100}%`,
                                                    backgroundColor: dismissProgress >= 1 ? '#ef4444' : '#00B4B4',
                                                }}
                                            />
                                        </div>
                                        {dismissProgress >= 0.8 && (
                                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest text-center mt-1 animate-pulse">
                                                Soltar para fechar
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={`${noPadding ? 'p-0' : 'p-[24px]'} flex-1 overflow-auto`}>
                            {children}
                        </div>

                        {onConfirm && confirmLabel && (
                            <div className="p-[24px] border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 shrink-0">
                                <button
                                    onClick={() => {
                                        if (confirmLoading) return;
                                        onConfirm();
                                    }}
                                    disabled={confirmLoading}
                                    className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-lg ${styles.button} active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
                                >
                                    {confirmLoading ? (
                                        <>
                                            <Loading size="xs" />
                                            <span>{confirmLoadingLabel || 'Processando...'}</span>
                                        </>
                                    ) : (
                                        <span>{confirmLabel}</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6">
                        {/* Icon & Title */}
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 ${styles.bg} rounded-2xl flex items-center justify-center mb-4`}>
                                <span className={`material-symbols-outlined text-4xl ${styles.color}`}>
                                    {styles.icon}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {title}
                            </h3>
                            {message && (
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    {message}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-8 flex flex-col gap-3">
                            {onConfirm && confirmLabel && (
                                <button
                                    onClick={() => {
                                        if (confirmLoading) return;
                                        onConfirm();
                                    }}
                                    disabled={confirmLoading}
                                    className={`w-full py-4 rounded-2xl text-white font-bold transition-all shadow-lg ${styles.button} active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
                                >
                                    {confirmLoading ? (
                                        <>
                                            <Loading size="xs" />
                                            <span>{confirmLoadingLabel || 'Processando...'}</span>
                                        </>
                                    ) : (confirmLabel || 'Confirmar')}
                                </button>
                            )}
                            {!hideCancelButton && (
                                <button
                                    onClick={onClose}
                                    className="w-full py-3.5 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {(onConfirm && confirmLabel) ? cancelLabel : 'Fechar'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
