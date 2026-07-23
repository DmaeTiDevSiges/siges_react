import { useRef, useCallback, useEffect } from 'react';

export const useDraggableScroll = () => {
    const ref = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const moved = useRef(false);

    const cleanup = useCallback(() => {
        window.removeEventListener('mousemove', onGlobalMouseMove);
        window.removeEventListener('mouseup', onGlobalMouseUp);
        window.removeEventListener('touchmove', onGlobalTouchMove);
        window.removeEventListener('touchend', onGlobalTouchEnd);
    }, []);

    const onGlobalMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const walk = (x - startX.current) * 1.5;

        if (Math.abs(walk) > 5) {
            moved.current = true;
            ref.current.scrollLeft = scrollLeft.current - walk;
        }
    }, []);

    const onGlobalMouseUp = useCallback(() => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (ref.current) ref.current.style.scrollBehavior = '';
        cleanup();
    }, [cleanup]);

    const onGlobalTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging.current || !ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const walk = (x - startX.current) * 1.5;

        if (Math.abs(walk) > 5) {
            moved.current = true;
            ref.current.scrollLeft = scrollLeft.current - walk;
        }
    }, []);

    const onGlobalTouchEnd = useCallback(() => {
        isDragging.current = false;
        if (ref.current) ref.current.style.scrollBehavior = '';
        cleanup();
    }, [cleanup]);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        if (e.button !== 0) return;

        isDragging.current = true;
        moved.current = false;
        const rect = ref.current.getBoundingClientRect();
        startX.current = e.clientX - rect.left;
        scrollLeft.current = ref.current.scrollLeft;

        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        if (ref.current) ref.current.style.scrollBehavior = 'auto';

        window.addEventListener('mousemove', onGlobalMouseMove);
        window.addEventListener('mouseup', onGlobalMouseUp);
    }, [onGlobalMouseMove, onGlobalMouseUp]);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (!ref.current) return;

        isDragging.current = true;
        moved.current = false;
        const rect = ref.current.getBoundingClientRect();
        const touch = e.touches[0];
        startX.current = touch.clientX - rect.left;
        scrollLeft.current = ref.current.scrollLeft;

        if (ref.current) ref.current.style.scrollBehavior = 'auto';

        window.addEventListener('touchmove', onGlobalTouchMove, { passive: false });
        window.addEventListener('touchend', onGlobalTouchEnd);
    }, [onGlobalTouchMove, onGlobalTouchEnd]);

    const onClickCapture = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (moved.current) {
            e.stopPropagation();
            if ('preventDefault' in e) e.preventDefault();
        }
    }, []);

    return {
        ref,
        onMouseDown,
        onTouchStart,
        onClickCapture,
    };
};
