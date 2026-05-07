import React from 'react';

interface LoadingProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    overlay?: boolean;
    text?: string;
    className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
    size = 'md',
    overlay = true,
    text,
    className = ''
}) => {
    const sizeClasses = {
        xs: 'text-[20px]',
        sm: 'text-[24px]',
        md: 'text-[32px]',
        lg: 'text-[48px]',
        xl: 'text-[64px]'
    };

    const containerSizeClasses = {
        xs: 'h-10 w-10',
        sm: 'h-14 w-14',
        md: 'h-[70px] w-[70px]',
        lg: 'h-24 w-24',
        xl: 'h-40 w-40'
    };

    const loaderContent = (
        <div className={`flex flex-col items-center justify-center gap-5 ${className}`}>
            <div className={`relative ${containerSizeClasses[size]} flex items-center justify-center`}>
                <img 
                    src="/siges_logo.png" 
                    alt="Loading..." 
                    className="w-full h-full object-contain animate-spin filter drop-shadow-[0_0_12px_rgba(19,127,236,0.3)]"
                />
            </div>

            {text && (
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase text-center">
                    {text}
                </p>
            )}
        </div>
    );

    // If overlay is false, we still center it in its parent, but without the fixed position
    if (!overlay) {
        return (
            <div className="flex-1 flex items-center justify-center w-full h-full min-h-[200px]">
                {loaderContent}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/80 dark:bg-slate-900/90 backdrop-blur-md">
            {loaderContent}
        </div>
    );
};
