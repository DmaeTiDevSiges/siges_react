import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    /**
     * `underline` = campo grande sem caixa, só linha inferior (fluxos guiados / StepFlow,
     * visual novo). Padrão `default` = campo atual.
     */
    variant?: 'default' | 'underline';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', leftIcon, rightIcon, id, variant = 'default', ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;

        if (variant === 'underline') {
            return (
                <div className="flex flex-col gap-2 w-full">
                    {label && (
                        <label htmlFor={inputId} className="text-label font-normal text-fg-muted cursor-pointer">
                            {label} {props.required && <span className="text-danger">*</span>}
                        </label>
                    )}
                    <div className="relative flex items-center gap-2 border-b-2 border-line focus-within:border-brand transition-colors">
                        {leftIcon && <span className="text-fg-muted">{leftIcon}</span>}
                        <input
                            ref={ref}
                            id={inputId}
                            aria-invalid={!!error || undefined}
                            className={`block w-full h-14 bg-transparent border-0 px-0 text-[24px] font-semibold text-fg placeholder:text-fg-subtle focus:ring-0 outline-none ${className}`}
                            {...props}
                        />
                        {rightIcon && <span className="text-fg-muted">{rightIcon}</span>}
                    </div>
                    {error && <span className="text-danger text-caption">{error}</span>}
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 cursor-pointer"
                    >
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-primary pointer-events-none">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        onFocus={(e) => {
                            if (props.onFocus) props.onFocus(e);
                            const target = e.target;
                            setTimeout(() => {
                                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                        }}
                        className={`
                            block w-full h-12 px-4 
                            bg-white dark:bg-[#1e293b] 
                            text-slate-900 dark:text-slate-100
                            placeholder-slate-400 dark:placeholder-slate-600
                            border border-slate-200 dark:border-slate-800
                            rounded-xl shadow-sm
                            transition-all duration-200
                            focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none
                            ${leftIcon ? 'pl-11' : ''} 
                            ${rightIcon ? 'pr-11' : ''} 
                            ${className}
                        `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-primary">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <span className="text-red-500 text-[11px] font-medium ml-1">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
