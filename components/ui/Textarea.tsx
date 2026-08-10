import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = '', id, ...props }, ref) => {
        const generatedId = React.useId();
        const textareaId = id || generatedId;

        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 cursor-pointer"
                    >
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    onFocus={(e) => {
                        if (props.onFocus) props.onFocus(e);
                        const target = e.target;
                        setTimeout(() => {
                            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                    }}
                    className={`
                        block w-full px-4 py-3
                        bg-white dark:bg-[#1e293b] 
                        text-slate-900 dark:text-slate-100
                        placeholder-slate-400 dark:placeholder-slate-600
                        border border-slate-200 dark:border-slate-800
                        rounded-xl shadow-sm
                        transition-all duration-200
                        focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none
                        resize-none overflow-hidden
                        ${className}
                    `}
                    {...props}
                />
                {error && <span className="text-red-500 text-xs">{error}</span>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
