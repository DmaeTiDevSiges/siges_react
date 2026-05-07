import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { IconButton } from './IconButton';

interface CurrencyInputProps {
    label?: string;
    value: number | null | undefined;
    onChange: (value: number) => void;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    label,
    value,
    onChange,
    required,
    disabled,
    placeholder = '0,00'
}) => {
    // Internal string state for display
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (value !== undefined && value !== null) {
            // Format incoming number to PT-BR string
            const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
            setDisplayValue(formatted);
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-digit chars
        const rawValue = e.target.value.replace(/\D/g, '');

        if (!rawValue) {
            onChange(0);
            return;
        }

        // Convert to float (cents / 100)
        const numericValue = parseInt(rawValue) / 100;

        onChange(numericValue);
    };

    return (
        <Input
            label={label}
            type="text"
            leftIcon={<span className="text-sm font-bold opacity-50">R$</span>}
            rightIcon={
                value && !disabled ? (
                    <IconButton
                        icon="close"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.preventDefault();
                            onChange(0);
                        }}
                    />
                ) : undefined
            }
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            required={required}
            disabled={disabled}
        />
    );
};
