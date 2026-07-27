import React, { useState } from 'react';
import { AIChatWindow } from './AIChatWindow.tsx';

export const AIAssistantBubble: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 left-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-9999 ${isOpen ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`}
            >
                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20"></div>
                <span className="material-symbols-outlined text-3xl relative z-10">smart_toy</span>
            </button>

            {/* Chat Window */}
            <AIChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};
