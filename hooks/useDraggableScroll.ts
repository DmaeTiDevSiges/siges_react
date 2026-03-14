import { useRef, useState, useCallback, useEffect } from 'react';

export const useDraggableScroll = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [moved, setMoved] = useState(false);

    const onGlobalMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const walk = (x - startX) * 1.5;

        if (Math.abs(walk) > 5) {
            setMoved(true);
            ref.current.scrollLeft = scrollLeft - walk;
        }
    }, [isDragging, startX, scrollLeft]);

    const onGlobalMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (ref.current) ref.current.style.scrollBehavior = '';
    }, []);

    // Touch support
    const onGlobalTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || !ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const walk = (x - startX) * 1.5;

        if (Math.abs(walk) > 5) {
            setMoved(true);
            ref.current.scrollLeft = scrollLeft - walk;
        }
    }, [isDragging, startX, scrollLeft]);

    const onGlobalTouchEnd = useCallback(() => {
        setIsDragging(false);
        if (ref.current) ref.current.style.scrollBehavior = '';
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onGlobalMouseMove);
            window.addEventListener('mouseup', onGlobalMouseUp);
            window.addEventListener('touchmove', onGlobalTouchMove, { passive: false });
            window.addEventListener('touchend', onGlobalTouchEnd);
        } else {
            window.removeEventListener('mousemove', onGlobalMouseMove);
            window.removeEventListener('mouseup', onGlobalMouseUp);
            window.removeEventListener('touchmove', onGlobalTouchMove);
            window.removeEventListener('touchend', onGlobalTouchEnd);
        }
        return () => {
            window.removeEventListener('mousemove', onGlobalMouseMove);
            window.removeEventListener('mouseup', onGlobalMouseUp);
            window.removeEventListener('touchmove', onGlobalTouchMove);
            window.removeEventListener('touchend', onGlobalTouchEnd);
        };
    }, [isDragging, onGlobalMouseMove, onGlobalMouseUp, onGlobalTouchMove, onGlobalTouchEnd]);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!ref.current) return;
        if (e.button !== 0) return;

        setIsDragging(true);
        setMoved(false);
        const rect = ref.current.getBoundingClientRect();
        setStartX(e.clientX - rect.left);
        setScrollLeft(ref.current.scrollLeft);

        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        if (ref.current) ref.current.style.scrollBehavior = 'auto';
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if (!ref.current) return;

        setIsDragging(true);
        setMoved(false);
        const rect = ref.current.getBoundingClientRect();
        const touch = e.touches[0];
        setStartX(touch.clientX - rect.left);
        setScrollLeft(ref.current.scrollLeft);

        if (ref.current) ref.current.style.scrollBehavior = 'auto';
    };

    const onClickCapture = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (moved) {
            e.stopPropagation();
            if ('preventDefault' in e) e.preventDefault();
        }
    }, [moved]);

    return {
        ref,
        onMouseDown,
        onTouchStart,
        onClickCapture,
        isDragging,
        moved
    };
};
