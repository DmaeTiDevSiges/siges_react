import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';
import { OptimizedImage } from './OptimizedImage';

interface PhotoViewerProps {
    src?: string;
    images?: string[];
    initialIndex?: number;
    alt?: string;
    onClose: () => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({ src, images, initialIndex = 0, alt = "Visualizar Imagem", onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastTouch, setLastTouch] = useState<{ x: number, y: number } | null>(null);
    const [lastDistance, setLastDistance] = useState<number | null>(null);

    // Determine current image source
    const currentSrc = images && images.length > 0 ? images[currentIndex] : src || '';
    const hasMultiple = images && images.length > 1;

    // Reset zoom/rotation when image changes
    useEffect(() => {
        setScale(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
    }, [currentIndex]);

    // Handle navigation
    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (hasMultiple && currentIndex < (images!.length - 1)) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (hasMultiple && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, hasMultiple, images]);

    // Prevent scrolling behind when the modal is open
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    const handleRotate = () => {
        setRotation(r => (r + 90) % 360);
        // Reset offset when rotating to avoid weird clipping issues
        setOffset({ x: 0, y: 0 });
    };

    const handleZoomIn = () => setScale(s => Math.min(s * 1.5, 5));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.5, 0.5));
    const handleReset = () => {
        setScale(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            setIsDragging(true);
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setLastDistance(dist);
            setIsDragging(false); // Disable dragging while pinching
        }
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && isDragging && lastTouch && scale > 1) {
            const dx = e.touches[0].clientX - lastTouch.x;
            const dy = e.touches[0].clientY - lastTouch.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        } else if (e.touches.length === 2 && lastDistance) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const delta = dist / lastDistance;
            setScale(prev => Math.min(Math.max(prev * delta, 0.5), 10)); // Increased max zoom for premium feel
            setLastDistance(dist);
        }
    };

    const onTouchEnd = () => {
        setIsDragging(false);
        setLastTouch(null);
        setLastDistance(null);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-9999 bg-black/95 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-300"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Top Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 bg-linear-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                    <IconButton
                        icon="close"
                        onClick={onClose}
                        variant="soft"
                        className="bg-white/10! text-white! hover:bg-white/20! transition-colors border border-white/10"
                    />
                    <div className="flex flex-col ml-3">
                        <span className="text-white font-bold text-sm tracking-tight leading-none">{alt}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Visualizador em Alta Definição</span>
                            {hasMultiple && (
                                <span className="text-white/60 text-[9px] font-black uppercase tracking-widest bg-white/10 px-1.5 rounded-sm">
                                    {currentIndex + 1} / {images!.length}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-white/5 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-2xl">
                    <IconButton icon="rotate_right" onClick={handleRotate} size="sm" variant="soft" className="bg-white/10! text-white! hover:bg-white/20!" />
                    <div className="w-px h-4 bg-white/10 my-automx-1" />
                    <IconButton icon="zoom_in" onClick={handleZoomIn} size="sm" variant="soft" className="bg-white/10! text-white! hover:bg-white/20!" />
                    <IconButton icon="zoom_out" onClick={handleZoomOut} size="sm" variant="soft" className="bg-white/10! text-white! hover:bg-white/20!" />
                    <IconButton icon="restart_alt" onClick={handleReset} size="sm" variant="soft" className="bg-white/10! text-white! hover:bg-white/20!" />
                </div>
            </div>

            {/* Navigation Buttons for Desktop/Large Screens */}
            {hasMultiple && (
                <>
                    {currentIndex > 0 && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 hidden md:block">
                            <IconButton
                                icon="chevron_left"
                                onClick={handlePrev}
                                className="bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full border border-white/10 backdrop-blur-md transition-all hover:scale-110"
                            />
                        </div>
                    )}
                    {currentIndex < (images!.length - 1) && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 hidden md:block">
                            <IconButton
                                icon="chevron_right"
                                onClick={handleNext}
                                className="bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full border border-white/10 backdrop-blur-md transition-all hover:scale-110"
                            />
                        </div>
                    )}
                </>
            )}

            {/* Image Container */}
            <div
                className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                // Double tap/click to reset or zoom
                onDoubleClick={handleReset}
            >
                <div
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
                    }}
                    className="relative cursor-move"
                    onClick={(e) => e.stopPropagation()}
                >
                    <OptimizedImage
                        key={currentSrc} // Force re-mount on image change to reset state cleanly
                        src={currentSrc}
                        alt={alt}
                        preset="large"
                        className="max-w-[100vw] max-h-screen md:max-w-[90vw] md:max-h-[85vh] object-contain rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-none select-none"
                    />
                </div>
            </div>

            {/* Bottom Navigation Indicators for Mobile */}
            {hasMultiple && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 z-50 pointer-events-none">
                    {images!.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/30'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Helper Hint & Status */}
            <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 pointer-events-none">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[12px]">pinch</span> PINCH PARA ZOOM
                    </span>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[12px]">drag_pan</span> ARRASTE PARA MOVER
                    </span>
                </div>

                {scale > 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-primary font-black text-[10px] uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20 backdrop-blur-sm">
                            Zoom: {Math.round(scale * 100)}%
                        </span>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
