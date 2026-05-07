import { useRef, useCallback } from 'react';

/**
 * Hook that enables click-and-drag horizontal scrolling on a container.
 * Returns a ref to attach to the scrollable element and event handlers.
 */
export function useDragToScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        isDragging.current = true;
        startX.current = e.pageX - ref.current.offsetLeft;
        scrollLeft.current = ref.current.scrollLeft;
        ref.current.style.cursor = 'grabbing';
        ref.current.style.userSelect = 'none';
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX.current) * 1.2;
        ref.current.scrollLeft = scrollLeft.current - walk;
    }, []);

    const stopDragging = useCallback(() => {
        if (!ref.current) return;
        isDragging.current = false;
        ref.current.style.cursor = 'grab';
        ref.current.style.userSelect = '';
    }, []);

    return {
        ref,
        dragHandlers: {
            onMouseDown,
            onMouseMove,
            onMouseUp: stopDragging,
            onMouseLeave: stopDragging,
        },
    };
}
