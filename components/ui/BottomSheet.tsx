import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    showCloseButton?: boolean;
    height?: string; // e.g., '90vh', 'auto'
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    children,
    showCloseButton = true,
    height = '92vh'
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />

            {/* Sheet Container */}
            <div 
                className={`relative w-full max-w-2xl bg-slate-50 dark:bg-slate-950 rounded-t-[32px] shadow-2xl overflow-hidden transition-transform duration-300 ease-out transform flex flex-col ${
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
                style={{ height, maxHeight: '92vh' }}
            >
                {/* Drag Handle Bar */}
                <div className="flex flex-col items-center pt-3 pb-2 shrink-0">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-1" />
                </div>

                {/* Header omitted for brevity in instruction if not changed, but I will include it to be safe */}
                {(title || showCloseButton) && (
                    <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="flex-1">
                            {typeof title === 'string' ? (
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                                    {title}
                                </h3>
                            ) : (
                                title
                            )}
                        </div>
                        {showCloseButton && (
                            <IconButton
                                icon="close"
                                onClick={onClose}
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0"
                            />
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={`flex-1 overflow-y-auto no-scrollbar ${height === 'auto' ? '' : 'h-full'}`}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
