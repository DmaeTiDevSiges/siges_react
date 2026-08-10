import React from 'react';
import { AssetAttribute } from '../../types';
import { Input } from './Input';
import { ActionIcon } from './ActionIcon';
import { Select } from './Select';
import { DecimalInput } from './DecimalInput';

interface DynamicFieldProps {
    attribute: AssetAttribute;
    value: string;
    onChange: (value: string) => void;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({ attribute, value, onChange }) => {
    const label = attribute.unit ? `${attribute.label} (${attribute.unit})` : attribute.label;

    switch (attribute.dataType) {
        case 'number':
            return (
                <div className="space-y-1.5">
                    <DecimalInput
                        label={label}
                        precision={attribute.decimals || 0}
                        required={attribute.required}
                        value={value ? parseFloat(value) : null}
                        onChange={val => onChange(val.toString())}
                        placeholder={`Ex: 10${attribute.unit ? ` ${attribute.unit}` : ''}`}
                    />
                </div>
            );

        case 'date':
            return (
                <div className="space-y-1.5">
                    <Input
                        label={label}
                        type="date"
                        required={attribute.required}
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            );

        case 'boolean':
            return (
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={value === 'true'}
                            onChange={e => onChange(e.target.checked ? 'true' : 'false')}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {label}
                            {attribute.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                    </label>
                </div>
            );

        case 'select':
            // For now, select fields will need options defined elsewhere
            // This is a placeholder implementation
            return (
                <div className="space-y-1.5">
                    <Select
                        label={label}
                        required={attribute.required}
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                        options={[]}
                        placeholder="Selecione..."
                    />
                </div>
            );

        case 'text':
        default:
            return (
                <div className="space-y-1.5">
                    <Input
                        label={label}
                        type="text"
                        required={attribute.required}
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                        placeholder={`Ex: ${attribute.label}`}
                    />
                </div>
            );
    }
};
