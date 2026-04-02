import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';

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
}) => {
    // Control body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Drag state
    const modalRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
    const isDragging = useRef(false);

    // Reset position when modal opens
    useEffect(() => {
        if (isOpen) setPosition(null);
    }, [isOpen]);

    const onDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggable || !modalRef.current) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        isDragging.current = true;
        const rect = modalRef.current.getBoundingClientRect();
        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: rect.left,
            originY: rect.top,
        };
    }, [draggable]);

    const onDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current || !dragState.current || !modalRef.current) return;
        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;
        const newX = dragState.current.originX + dx;
        const newY = dragState.current.originY + dy;
        // Clamp inside viewport
        const rect = modalRef.current.getBoundingClientRect();
        const clampedX = Math.max(8, Math.min(window.innerWidth - rect.width - 8, newX));
        const clampedY = Math.max(8, Math.min(window.innerHeight - rect.height - 8, newY));
        setPosition({ x: clampedX, y: clampedY });
    }, []);

    const onDragEnd = useCallback(() => {
        isDragging.current = false;
        dragState.current = null;
    }, []);

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

    return createPortal(
        <div
            className={draggable ? 'fixed inset-0' : 'fixed inset-0 flex items-center justify-center p-4 sm:p-6'}
            style={{ zIndex: 9999 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={draggable ? undefined : onClose}
            />

            {/* Modal Container */}
            <div
                ref={modalRef}
                className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-card-dark 
                    ${fullScreenMobile ? 'h-auto max-h-[92vh]' : 'max-h-[90vh]'} rounded-2xl
                    shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300
                    ${draggable ? 'select-none' : ''}`}
                style={draggable ? (position
                    ? { position: 'fixed', left: position.x, top: position.y, zIndex: 10000 }
                    : { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10000 }
                ) : {}}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerLeave={onDragEnd}
            >
                {children ? (
                    <div className="flex flex-col h-full sm:h-auto">
                        {!hideHeader && (
                            <div
                                className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                onPointerDown={draggable ? onDragStart : undefined}
                            >
                                <h3 className="flex-1 flex items-center gap-2">
                                    {draggable && (
                                        <span className="material-symbols-outlined text-[18px] text-slate-300 dark:text-slate-600 shrink-0 select-none">
                                            drag_indicator
                                        </span>
                                    )}
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
                        )}
                        <div className={`${noPadding ? 'p-0' : 'p-6'} flex-1 overflow-auto`}>
                            {children}
                        </div>
                        
                        {onConfirm && confirmLabel && (
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 shrink-0">
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
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{confirmLoadingLabel || 'Processando...'}</span>
                                        </>
                                    ) : (confirmLabel || 'Confirmar')}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                {(onConfirm && confirmLabel) ? cancelLabel : 'Fechar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
