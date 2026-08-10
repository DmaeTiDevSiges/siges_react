import React from 'react';

interface ActionIconProps {
    icon: string;
    label: string;
    onClick?: () => void;
    className?: string;
}

export const ActionIcon: React.FC<ActionIconProps> = ({ icon, label, onClick, className = '' }) => {
    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-2 group ${className}`}>
            <div className="rounded-full bg-blue-500/10 border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 w-12 h-12 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
            <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">{label}</span>
        </button>
    );
};
