import React, { useState, useEffect } from 'react';

export const SplashScreen: React.FC = () => {
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

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden safe-area-top safe-area-bottom"
            style={{
                backgroundColor: '#050a10',
                backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(19, 127, 236, 0.15) 0%, transparent 60%),
                    linear-gradient(180deg, #050a10 0%, #0a1420 100%)
                `,
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
                    className="w-48 h-48 md:w-56 md:h-56 mx-auto object-contain filter drop-shadow-[0_0_40px_rgba(19,127,236,0.6)]"
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
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-[0.2em] mb-2 uppercase italic">
                        SIGES
                    </h1>
                    <div className="h-[1px] w-12 bg-primary/50 mb-4" />
                    <p className="text-[10px] md:text-xs font-medium text-slate-400 tracking-[0.4em] uppercase">
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
                    <span className="text-xs font-medium text-slate-400 tracking-[0.3em] uppercase animate-pulse">
                        Carregando...
                    </span>

                    {/* Progress Bar Container */}
                    <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
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
