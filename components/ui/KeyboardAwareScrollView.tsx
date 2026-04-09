import React, { useRef, useEffect, useCallback } from 'react';
import { useKeyboardHeight } from '../../hooks/useKeyboard';

interface KeyboardAwareScrollViewProps {
    children: React.ReactNode;
    className?: string;
    /** Additional bottom padding when keyboard is visible (in pixels) */
    extraPadding?: number;
    /** Enable automatic scroll into view on focus */
    autoScroll?: boolean;
}

/**
 * A scrollable container that automatically adjusts for keyboard visibility.
 * Adds dynamic bottom padding when the keyboard is shown to prevent inputs from being hidden.
 * 
 * @example
 * <KeyboardAwareScrollView className="flex-1 p-4">
 *   <form>
 *     <input name="field1" />
 *     <input name="field2" />
 *   </form>
 * </KeyboardAwareScrollView>
 */
export const KeyboardAwareScrollView: React.FC<KeyboardAwareScrollViewProps> = ({
    children,
    className = '',
    extraPadding = 20,
    autoScroll = true
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const keyboardHeight = useKeyboardHeight();
    
    // Calculate dynamic bottom padding based on keyboard height
    const dynamicPadding = keyboardHeight > 0 ? keyboardHeight + extraPadding : 0;

    // Auto-scroll to focused input
    useEffect(() => {
        if (!autoScroll || !containerRef.current) return;

        const container = containerRef.current;
        
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            
            // Check if the target is inside this container
            if (!container.contains(target)) return;
            
            // Only scroll for input-like elements
            const isInput = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.tagName === 'SELECT';
            const isEditable = (target as any).isContentEditable === true;
            
            if (isInput || isEditable) {
                
                // Wait for keyboard to animate
                setTimeout(() => {
                    if (document.activeElement === target) {
                        const rect = target.getBoundingClientRect();
                        const containerRect = container.getBoundingClientRect();
                        
                        // Calculate if input is visible in container
                        const isVisible = rect.top >= containerRect.top && 
                                         rect.bottom <= containerRect.bottom;
                        
                        if (!isVisible) {
                            target.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center',
                                inline: 'nearest'
                            });
                        }
                    }
                }, 350);
            }
        };

        container.addEventListener('focusin', handleFocus, true);
        
        return () => {
            container.removeEventListener('focusin', handleFocus, true);
        };
    }, [autoScroll]);

    return (
        <div
            ref={containerRef}
            className={`overflow-y-auto ${className}`}
            style={{
                paddingBottom: `${dynamicPadding}px`,
                transition: 'padding-bottom 0.3s ease-out'
            }}
        >
            {children}
        </div>
    );
};
