import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { IconButton } from './IconButton';

interface DecimalInputProps {
    label?: string;
    value: number | null | undefined;
    onChange: (value: number) => void;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    precision?: number;
    rightIcon?: React.ReactNode;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({
    label,
    value,
    onChange,
    required,
    disabled,
    placeholder = '0,0000',
    precision = 4,
    rightIcon
}) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (value !== undefined && value !== null) {
            const formatted = new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
            }).format(value);
            setDisplayValue(formatted);
        } else {
            setDisplayValue('');
        }
    }, [value, precision]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-digit chars
        const rawValue = e.target.value.replace(/\D/g, '');

        if (!rawValue) {
            onChange(0);
            return;
        }

        // Convert to float based on precision
        const divisor = Math.pow(10, precision);
        const numericValue = parseInt(rawValue) / divisor;

        onChange(numericValue);
    };

    return (
        <Input
            label={label}
            type="text"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            required={required}
            disabled={disabled}
            className={rightIcon ? 'pr-20' : ''}
            rightIcon={
                <div className="flex items-center gap-2">
                    {value && !disabled && (
                        <IconButton
                            icon="close"
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                                e.preventDefault();
                                onChange(0);
                            }}
                        />
                    )}
                    {rightIcon}
                </div>
            }
        />
    );
};
