import React from 'react';

interface LoadingProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    overlay?: boolean;
    text?: string;
    className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
    size = 'md',
    overlay = false,
    text,
    className = ''
}) => {
    const sizeClasses = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
        xl: 'w-20 h-20'
    };

    const loaderContent = (
        <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
            <div className="relative flex items-center justify-center">
                {/* Signal Pulse Waves */}
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="absolute rounded-full border border-primary/30"
                        style={{
                            width: size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 70 : 100,
                            height: size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 70 : 100,
                            animation: `loader-signal 2s cubic-bezier(0, 0.5, 0.5, 1) infinite`,
                            animationDelay: `${i * 0.8}s`,
                        }}
                    />
                ))}
                
                {/* Main Logo Image */}
                <img 
                    src="/siges_logo.png" 
                    alt="Loading..." 
                    className={`${sizeClasses[size]} object-contain filter drop-shadow-[0_0_12px_rgba(19,127,236,0.4)]`}
                    style={{
                        animation: 'loader-float 3s ease-in-out infinite'
                    }}
                />
            </div>

            {text && (
                <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] font-black text-primary dark:text-blue-400 tracking-[0.3em] uppercase">
                        {text}
                    </p>
                    <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                            <div 
                                key={i} 
                                className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" 
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes loader-float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-6px) rotate(2deg); }
                }
                @keyframes loader-signal {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
};
