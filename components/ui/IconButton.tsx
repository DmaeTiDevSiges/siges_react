import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string;
    variant?: 'ghost' | 'soft' | 'primary' | 'danger' | 'outline';
    color?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    variant = 'ghost',
    size = 'md',
    className = '',
    color,
    ...props
}) => {
    const baseClasses = "flex items-center justify-center rounded-full transition-all duration-200 active:scale-[0.97] active:brightness-95 font-bold flex-shrink-0 cursor-pointer select-none";

    const variants = {
        ghost: "text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800",
        soft: "bg-primary/10 text-primary hover:bg-primary/20",
        primary: "bg-primary text-white hover:bg-blue-600 shadow-md",
        danger: "bg-white dark:bg-slate-800 border-2 border-[#ff2d55] text-[#ff2d55] hover:bg-red-50 dark:hover:bg-red-900/10 shadow-sm",
        outline: `bg-white dark:bg-slate-800 border-2 shadow-sm ${color ? '' : 'border-primary text-primary hover:bg-blue-50'}`
    };

    const style = color ? { borderColor: color, color: color } : {};

    const sizes = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12", // Increased for a more premium look in modals
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            style={style}
            {...props}
        >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </button>
    );
};
