import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to detect if the keyboard is visible.
 * Useful for hiding bottom navigation bars which take up space when typing.
 */
export const useKeyboard = () => {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const isMobile = Capacitor.isNativePlatform() || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) return;

        let maxHeight = window.innerHeight;

        const updateHeight = () => {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            if (currentHeight > maxHeight) maxHeight = currentHeight;

            // Significant drop in height usually means keyboard
            const isVisible = currentHeight < maxHeight * 0.8;
            setKeyboardVisible(isVisible);
        };

        const handleOrientationChange = () => {
            // Reset max height on orientation change
            setTimeout(() => {
                maxHeight = window.innerHeight;
                updateHeight();
            }, 300);
        };

        window.visualViewport?.addEventListener('resize', updateHeight);
        window.addEventListener('resize', updateHeight);
        window.addEventListener('orientationchange', handleOrientationChange);

        const handleFocus = (e: any) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                setKeyboardVisible(true);
                // Wait for keyboard to animate up and viewport to resize
                setTimeout(() => {
                    if (document.activeElement === e.target) {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 400);
            }
        };

        const handleBlur = () => {
            setTimeout(() => {
                const activeEl = document.activeElement;
                if (!(activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA')) {
                    // Check if the viewport height also recovered
                    const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                    if (currentHeight >= maxHeight * 0.85) {
                        setKeyboardVisible(false);
                    }
                }
            }, 200);
        };

        window.addEventListener('focusin', handleFocus);
        window.addEventListener('focusout', handleBlur);

        return () => {
            window.visualViewport?.removeEventListener('resize', updateHeight);
            window.removeEventListener('resize', updateHeight);
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('focusin', handleFocus);
            window.removeEventListener('focusout', handleBlur);
        };
    }, []);

    return isKeyboardVisible;
};
