import React from 'react';
import { Input } from './Input';

interface DateInputProps {
    label?: string;
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    required,
    disabled,
    placeholder
}) => {
    // We stick to native date input for functionality but style it with our Input
    // Custom date pickers are complex; native is reliable on mobile.
    // Our Input component already accepts type="date", this wrapper just ensures type safety and standard props
    return (
        <Input
            type="date"
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            // Add a calendar icon if supported by browser/styling or just rely on native picker
            leftIcon={<span className="material-symbols-outlined text-[20px] text-slate-400">calendar_today</span>}
        />
    );
};
