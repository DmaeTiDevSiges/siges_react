import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to detect if the keyboard is visible and handle input scrolling.
 * Works on both mobile (Capacitor) and web.
 */
export const useKeyboard = () => {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        // Detect if running on mobile platform
        const isMobile = Capacitor.isNativePlatform() || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Only enable keyboard detection on mobile platforms
        if (!isMobile) return;

        let maxHeight = window.innerHeight;
        let keyboardTimeout: NodeJS.Timeout;

        const updateHeight = () => {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            if (currentHeight > maxHeight) maxHeight = currentHeight;

            // Significant drop in height usually means keyboard is visible
            const isVisible = currentHeight < maxHeight * 0.85;
            setKeyboardVisible(isVisible);
        };

        const handleOrientationChange = () => {
            // Reset max height on orientation change
            setTimeout(() => {
                maxHeight = window.innerHeight;
                updateHeight();
            }, 300);
        };

        // Improved scrollIntoView handler for inputs
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            const tagName = target.tagName;
            
            // Only handle input-like elements
            const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
            const isEditable = (target as any).isContentEditable === true;
            
            if (isInput || isEditable) {
                setKeyboardVisible(true);
                
                // Clear any existing timeout
                if (keyboardTimeout) clearTimeout(keyboardTimeout);
                
                // Wait for keyboard to fully animate and viewport to resize
                keyboardTimeout = setTimeout(() => {
                    if (document.activeElement === target) {
                        // Calculate the position more intelligently
                        const rect = target.getBoundingClientRect();
                        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                        
                        // If the input is in the bottom half of the screen, scroll it into view
                        if (rect.bottom > viewportHeight * 0.6) {
                            target.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'end',
                                inline: 'nearest'
                            });
                        }
                    }
                }, 350);
            }
        };

        const handleBlur = () => {
            // Delay hiding keyboard to account for focus transitions between inputs
            setTimeout(() => {
                const activeEl = document.activeElement;
                const isInputEl = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
                const isEditableEl = (activeEl as any)?.isContentEditable === true;
                
                if (!(isInputEl || isEditableEl)) {
                    // Check if the viewport height also recovered
                    const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                    if (currentHeight >= maxHeight * 0.9) {
                        setKeyboardVisible(false);
                    }
                }
            }, 250);
        };

        // Add event listeners
        window.visualViewport?.addEventListener('resize', updateHeight);
        window.addEventListener('resize', updateHeight);
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('focusin', handleFocus, true); // Use capture phase
        window.addEventListener('focusout', handleBlur);

        return () => {
            // Cleanup
            if (keyboardTimeout) clearTimeout(keyboardTimeout);
            window.visualViewport?.removeEventListener('resize', updateHeight);
            window.removeEventListener('resize', updateHeight);
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('focusin', handleFocus, true);
            window.removeEventListener('focusout', handleBlur);
        };
    }, []);

    return isKeyboardVisible;
};

/**
 * Hook to get keyboard height in pixels (useful for adding dynamic padding)
 */
export const useKeyboardHeight = () => {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const isMobile = Capacitor.isNativePlatform() || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) return;

        const initialHeight = window.innerHeight;
        let maxHeight = initialHeight;

        const updateHeight = () => {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            if (currentHeight > maxHeight) maxHeight = currentHeight;
            
            const heightDiff = maxHeight - currentHeight;
            // Only set keyboard height if it's significant (keyboard is visible)
            if (heightDiff > 100) {
                setKeyboardHeight(heightDiff);
            } else {
                setKeyboardHeight(0);
            }
        };

        window.visualViewport?.addEventListener('resize', updateHeight);
        window.addEventListener('resize', updateHeight);

        return () => {
            window.visualViewport?.removeEventListener('resize', updateHeight);
            window.removeEventListener('resize', updateHeight);
        };
    }, []);

    return keyboardHeight;
};
