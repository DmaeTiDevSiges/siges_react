import React from 'react';
import { Loading } from './Loading';
import { useUiVersion } from '../../contexts/UiVersionContext';


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'dashed' | 'ghost';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    withIcon?: boolean;
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', fullWidth = false, withIcon = false, loading = false, className = '', children, disabled, ...props }, ref) => {
        const { isV2 } = useUiVersion();

        const baseStyles = isV2
            // v2: pílula, plano, foco visível sem deslocar layout
            ? "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            : "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";

        const variants = isV2 ? {
            primary: "bg-brand hover:bg-brand-strong text-on-brand",
            secondary: "bg-surface-2 text-fg hover:brightness-95",
            dashed: "border border-dashed border-line text-fg-muted hover:text-brand bg-transparent",
            ghost: "bg-transparent text-brand hover:bg-brand-soft"
        } : {
            primary: "bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20",
            secondary: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600",
            dashed: "border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-primary bg-transparent",
            ghost: "bg-transparent text-slate-500 hover:text-primary dark:text-slate-400"
        };

        const sizeStyles = {
            xs: "h-7 px-2.5 text-xs",
            sm: "h-9 px-4 text-xs",
            md: "h-12 px-6",
            lg: "h-14 px-6 text-base"
        };

        const sizes = variant === 'dashed' ? "py-4 px-4" : sizeStyles[size];
        const width = fullWidth ? "w-full" : "";
        const disabledState = disabled || loading;

        return (
            <button
                ref={ref}
                disabled={disabledState}
                className={`
                    ${baseStyles} ${variants[variant]} ${sizes} ${width} 
                    ${disabledState ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'} 
                    ${loading ? 'animate-pulse ring-2 ring-primary/20' : ''}
                    ${className}
                `}
                {...props}
            >
                {loading ? (
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center">
                            <Loading size="xs" />
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
