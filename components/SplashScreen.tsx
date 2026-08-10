import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
    isDarkMode?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isDarkMode = true }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                const increment = Math.floor(Math.random() * 15) + 5;
                return Math.min(prev + increment, 100);
            });
        }, 150);
        return () => clearInterval(interval);
    }, []);

    const darkBg = '#050a10';
    const lightBg = '#f1f5f9';
    const bgColor = isDarkMode ? darkBg : lightBg;

    const darkGradient = `
        radial-gradient(circle at 50% 50%, rgba(19, 127, 236, 0.15) 0%, transparent 60%),
        linear-gradient(180deg, #050a10 0%, #0a1420 100%)
    `;
    const lightGradient = `
        radial-gradient(circle at 50% 50%, rgba(19, 127, 236, 0.1) 0%, transparent 60%),
        linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)
    `;

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden safe-area-top safe-area-bottom"
            style={{
                backgroundColor: bgColor,
                backgroundImage: isDarkMode ? darkGradient : lightGradient,
            }}
        >
            {/* Animated Grid Background */}
            <div 
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(19, 127, 236, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(19, 127, 236, 0.2) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)',
                }}
            />


            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo */}
                <img
                    src="/siges_logo.png"
                    alt="SIGES Logo"
                    className={`w-48 h-48 md:w-56 md:h-56 mx-auto object-contain filter ${isDarkMode ? 'drop-shadow-[0_0_40px_rgba(19,127,236,0.6)]' : 'drop-shadow-[0_0_20px_rgba(19,127,236,0.3)]'}`}
                    style={{
                        animation: 'splash-entrance 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                />

                {/* Brand Name & Tagline */}
                <div 
                    className="mt-1 flex flex-col items-center"
                    style={{
                        animation: 'splash-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
                    }}
                >
                    <h1 className={`text-4xl md:text-5xl font-black tracking-[0.2em] mb-2 uppercase italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        SIGES
                    </h1>
                    <div className="h-[1px] w-12 bg-primary/50 mb-4" />
                    <p className={`text-[10px] md:text-xs font-medium tracking-[0.4em] uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Sistema Gerenciador de Serviços
                    </p>
                </div>

                {/* Progress Indicators */}
                <div 
                    className="mt-16 flex flex-col items-center gap-4 w-48"
                    style={{
                        animation: 'splash-fade-in 0.5s ease 0.6s both',
                    }}
                >
                    {/* Loading Text */}
                    <span className={`text-xs font-medium tracking-[0.3em] uppercase animate-pulse ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Carregando...
                    </span>

                    {/* Progress Bar Container */}
                    <div className={`w-full h-[2px] rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-slate-300/50'}`}>
                        <div 
                            className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_#137fec]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes splash-entrance {
                    0% {
                        opacity: 0;
                        transform: scale(0.8) translateY(30px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @keyframes splash-wave {
                    0% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    100% {
                        transform: scale(3);
                        opacity: 0;
                    }
                }

                @keyframes splash-shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                @keyframes splash-fade-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes splash-fade-in {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};
