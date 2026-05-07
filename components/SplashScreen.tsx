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
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
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

            {/* Signal Pulse Waves */}
            <div className="absolute flex items-center justify-center">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="absolute rounded-full border border-primary/20"
                        style={{
                            width: 200,
                            height: 200,
                            animation: `splash-wave 3s cubic-bezier(0, 0.5, 0.5, 1) infinite`,
                            animationDelay: `${i * 1}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo with Glassmorphism & Shimmer */}
                <div 
                    className="relative p-8 rounded-[40px] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden group"
                    style={{
                        animation: 'splash-entrance 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                >
                    {/* Shimmer Effect */}
                    <div 
                        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        style={{
                            animation: 'splash-shimmer 2s infinite',
                        }}
                    />
                    
                    <img
                        src="/siges_logo.png"
                        alt="SIGES Logo"
                        className="w-24 h-24 md:w-32 md:h-32 object-contain filter drop-shadow-[0_0_20px_rgba(19,127,236,0.4)]"
                    />
                </div>

                {/* Brand Name & Tagline */}
                <div 
                    className="mt-10 flex flex-col items-center"
                    style={{
                        animation: 'splash-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
                    }}
                >
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-[0.2em] mb-2 uppercase italic">
                        SIGES
                    </h1>
                    <div className="h-[1px] w-12 bg-primary/50 mb-4" />
                    <p className="text-[10px] md:text-xs font-medium text-slate-400 tracking-[0.4em] uppercase">
                        Sistemas de Gestão de Serviços
                    </p>
                </div>

                {/* Progress Indicators */}
                <div 
                    className="mt-16 flex flex-col items-center gap-4 w-48"
                    style={{
                        animation: 'splash-fade-in 0.5s ease 0.6s both',
                    }}
                >
                    {/* Percentage Counter */}
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-mono font-bold text-white tabular-nums">
                            {progress.toString().padStart(3, '0')}
                        </span>
                        <span className="text-xs font-mono text-primary font-bold">%</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_#137fec]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Brand Identity */}
            <div 
                className="absolute bottom-10 flex flex-col items-center gap-2"
                style={{
                    animation: 'splash-fade-in 0.5s ease 0.8s both',
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-500 tracking-[0.3em] uppercase">
                        Protocolo Signal Ativo
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </div>
                <span className="text-[8px] font-medium text-slate-600 tracking-[0.1em] uppercase opacity-50">
                    © 2026 DMAE TI DEV TEAM
                </span>
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
