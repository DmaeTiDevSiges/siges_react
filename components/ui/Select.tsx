import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface Option {
    value: string;
    label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    options?: Option[]; // Optional explicitly passed options
    placeholder?: string;
    value?: string | string[];
    onChange?: (e: any) => void;
    multiple?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, className = '', leftIcon, children, options: optionsProp, value, onChange, placeholder, disabled, multiple, id, ...props }, ref) => {
        const generatedId = React.useId();
        const selectId = id || generatedId;
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState('');
        const [coords, setCoords] = useState({ left: 0, top: 0, width: 0 });
        const containerRef = useRef<HTMLDivElement>(null);
        const dropdownRef = useRef<HTMLDivElement>(null);

        // Parsing options from children if options prop is not provided
        const options = useMemo(() => {
            const opts: Option[] = optionsProp ? [...optionsProp] : [];

            // Also parse from children for backward compatibility or mixed usage
            React.Children.forEach(children, child => {
                if (React.isValidElement<{ value?: any; children?: any }>(child) && child.type === 'option') {
                    opts.push({
                        value: String(child.props.value || ''),
                        label: String(child.props.children || '')
                    });
                }
            });
            return opts;
        }, [children, optionsProp]);

        const selectedOptions = useMemo(() => {
            if (multiple && Array.isArray(value)) {
                return options.filter(opt => value.includes(String(opt.value)));
            }
            return options.filter(opt => String(opt.value) === String(value));
        }, [options, value, multiple]);

        const selectedOption = selectedOptions[0];

        const filteredOptions = useMemo(() =>
            options.filter(opt =>
                opt.label.toLowerCase().includes(search.toLowerCase()) ||
                opt.value === "" // Keep empty/placeholder option
            ),
            [options, search]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as Node;
                const clickedInsideContainer = containerRef.current?.contains(target);
                const clickedInsideDropdown = dropdownRef.current?.contains(target);

                if (containerRef.current && !clickedInsideContainer && !clickedInsideDropdown) {
                    setIsOpen(false);
                }
            };

            const updatePosition = () => {
                if (containerRef.current && isOpen) {
                    const rect = containerRef.current.getBoundingClientRect();
                    setCoords({
                        left: rect.left,
                        top: rect.bottom + 8, // +8px for mt-2 effect
                        width: rect.width
                    });
                }
            };

            if (isOpen) {
                updatePosition();
                document.addEventListener('mousedown', handleClickOutside);
                window.addEventListener('resize', updatePosition);
                // Close on scroll to avoid detached dropdowns
                window.addEventListener('scroll', () => setIsOpen(false), true);
            } else {
                setSearch(''); // Auto-clear search when closing
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', () => setIsOpen(false), true);
            };
        }, [isOpen]);

        const handleSelect = (val: string, e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (onChange) {
                let newValue: string | string[];
                if (multiple) {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (currentValues.includes(val)) {
                        newValue = currentValues.filter(v => v !== val);
                    } else {
                        newValue = [...currentValues, val];
                    }
                } else {
                    newValue = val;
                }

                const event = {
                    target: { value: newValue, name: props.name },
                    persist: () => { },
                };
                onChange(event);
            }
            if (!multiple) {
                setIsOpen(false);
                setSearch('');
            }
        };

        return (
            <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 cursor-pointer"
                    >
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}

                <div className="relative group">
                    {/* Native hidden select for ref and traditional form support */}
                    <select
                        ref={ref}
                        id={selectId}
                        value={value ?? ''}
                        onChange={onChange}
                        className="sr-only"
                        {...props}
                        tabIndex={-1}
                        required={props.required}
                    >
                        {options.map(opt => (
                            <option key={`${opt.value}-${opt.label}`} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    {leftIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 z-10 pointer-events-none group-focus-within:text-primary transition-colors">
                            {leftIcon}
                        </div>
                    )}

                    {/* Custom Trigger */}
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!disabled) setIsOpen(!isOpen);
                        }}
                        className={`
                            flex items-center w-full h-12 px-4 
                            bg-white dark:bg-[#1e293b] 
                            text-slate-900 dark:text-slate-100
                            border ${isOpen ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10' : 'border-slate-200 dark:border-slate-800'}
                            rounded-xl shadow-sm
                            transition-all duration-200
                            ${disabled
                                ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-900/60 grayscale pointer-events-none select-none'
                                : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700'
                            }
                            ${leftIcon ? 'pl-11' : ''} 
                            ${className}
                        `}
                    >
                        <span className={`block truncate flex-1 text-sm ${selectedOptions.length === 0 || (selectedOptions.length === 1 && selectedOptions[0].value === "") ? 'text-slate-400 dark:text-slate-500' : 'font-medium'}`}>
                            {selectedOptions.length > 0 && !(selectedOptions.length === 1 && selectedOptions[0].value === "")
                                ? (multiple ? `${selectedOptions.length} selecionado(s)` : selectedOptions[0].label)
                                : (placeholder || 'Selecione...')}
                        </span>

                        <div className={`ml-2 transition-colors ${disabled ? 'text-slate-400 dark:text-slate-600' : 'text-slate-400 group-focus-within:text-primary'}`}>
                            <span className={`material-symbols-outlined text-xl transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                {disabled ? 'lock' : 'expand_more'}
                            </span>
                        </div>
                    </div>

                    {/* Dropdown Menu - Portaled */}
                    {isOpen && createPortal(
                        <div
                            ref={dropdownRef}
                            style={{
                                position: 'fixed',
                                left: coords.left,
                                top: coords.top,
                                width: coords.width,
                                zIndex: 99999, // Higher than Modal
                            }}
                            className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                            {/* Search Field */}
                            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg">search</span>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Filtrar opções..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 bg-white dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white transition-all"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setIsOpen(false);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Options List */}
                            <div className="max-h-64 overflow-y-auto no-scrollbar py-1">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((opt) => (
                                        <div
                                            key={`${opt.value}-${opt.label}`}
                                            onClick={(e) => handleSelect(opt.value, e)}
                                            className={`
                                                px-4 py-2.5 text-sm cursor-pointer transition-all flex items-center justify-between
                                                ${(multiple && Array.isArray(value) && value.includes(String(opt.value))) || (!multiple && String(opt.value) === String(value))
                                                    ? 'bg-primary/10 text-primary font-semibold'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                {multiple && (
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${Array.isArray(value) && value.includes(String(opt.value)) ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                                                        {Array.isArray(value) && value.includes(String(opt.value)) && (
                                                            <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                                                        )}
                                                    </div>
                                                )}
                                                <span className="truncate">{opt.label}</span>
                                            </div>
                                            {!multiple && String(opt.value) === String(value) && (
                                                <span className="material-symbols-outlined text-lg">check</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-10 text-center">
                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl mb-2">search_off</span>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum resultado encontrado.</p>
                                    </div>
                                )}
                            </div>
                        </div>,
                        document.body
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

Select.displayName = 'Select';
