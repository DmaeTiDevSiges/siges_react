import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'dashed' | 'ghost';
    fullWidth?: boolean;
    withIcon?: boolean;
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', fullWidth = false, withIcon = false, loading = false, className = '', children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";

        const variants = {
            primary: "bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20",
            secondary: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600",
            dashed: "border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-primary bg-transparent",
            ghost: "bg-transparent text-slate-500 hover:text-primary dark:text-slate-400"
        };

        const sizes = variant === 'dashed' ? "py-4 px-4" : "h-12 px-6";
        const width = fullWidth ? "w-full" : "";
        const disabled = props.disabled || loading;

        return (
            <button
                ref={ref}
                disabled={disabled}
                className={`
                    ${baseStyles} ${variants[variant]} ${sizes} ${width} 
                    ${disabled ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'} 
                    ${loading ? 'animate-pulse ring-2 ring-primary/20' : ''}
                    ${className}
                `}
                {...props}
            >
                {loading ? (
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-transparent animate-[spin_0.6s_linear_infinite]" />
                        </div>
                        <span className="tracking-wide text-sm font-bold uppercase transition-all">Enviando...</span>
                    </div>
                ) : children}
            </button>
        );
    }
);

Button.displayName = 'Button';
