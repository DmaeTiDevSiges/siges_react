
import React from 'react';

export const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark animate-fade-out">
            <div className="relative flex flex-col items-center">
                <img
                    src="/siges_logo.png"
                    alt="Siges Logo"
                    className="w-32 h-auto object-contain animate-pulse-slow mb-6"
                />
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );
};
