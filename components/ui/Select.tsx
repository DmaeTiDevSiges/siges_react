import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface Option {
    value: string;
    label: string | React.ReactNode;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    options?: Option[]; // Optional explicitly passed options
    placeholder?: string;
    value?: string | string[];
    onChange?: (e: any) => void;
    onSearchChange?: (val: string) => void;
    multiple?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, className = '', leftIcon, children, options: optionsProp, value, onChange, onSearchChange, placeholder, disabled, multiple, id, ...props }, ref) => {
        const generatedId = React.useId();
        const selectId = id || generatedId;
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState('');
        const [coords, setCoords] = useState({ left: 0, top: 0, width: 0, placement: 'bottom', maxHeight: 256 });
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
            options.filter(opt => {
                if (opt.value === "") return true; // Keep empty/placeholder option
                const labelText = typeof opt.label === 'string' ? opt.label : String(opt.label);
                return labelText.toLowerCase().includes(search.toLowerCase());
            }),
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
                    const viewHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                    const viewTop = window.visualViewport ? window.visualViewport.offsetTop : 0;
                    
                    const spaceBelow = viewHeight - rect.bottom;
                    const spaceAbove = rect.top - viewTop;
                    
                    let placement = 'bottom';
                    let top = rect.bottom;
                    let maxHeight = 256;
                    
                    if (spaceBelow < 280 && spaceAbove > spaceBelow) {
                        placement = 'top';
                        top = rect.top;
                        maxHeight = Math.max(120, spaceAbove - 20);
                    } else {
                        maxHeight = Math.max(120, spaceBelow - 20);
                    }

                    setCoords({
                        left: rect.left,
                        top,
                        width: rect.width,
                        placement,
                        maxHeight
                    });
                }
            };

            const handleScroll = (e: Event) => {
                if (dropdownRef.current?.contains(e.target as Node)) {
                    return;
                }
                updatePosition();
            };

            if (isOpen) {
                updatePosition();
                document.addEventListener('mousedown', handleClickOutside);
                window.addEventListener('resize', updatePosition);
                if (window.visualViewport) {
                    window.visualViewport.addEventListener('resize', updatePosition);
                    window.visualViewport.addEventListener('scroll', updatePosition);
                }
                window.addEventListener('scroll', handleScroll, true);
                
                setTimeout(() => {
                    if (containerRef.current) {
                        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 150);
            } else {
                setSearch(''); // Auto-clear search when closing
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                window.removeEventListener('resize', updatePosition);
                if (window.visualViewport) {
                    window.visualViewport.removeEventListener('resize', updatePosition);
                    window.visualViewport.removeEventListener('scroll', updatePosition);
                }
                window.removeEventListener('scroll', handleScroll, true);
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
                        <span className={`block flex-1 text-sm ${selectedOptions.length === 0 || (selectedOptions.length === 1 && selectedOptions[0].value === "") ? 'text-slate-400 dark:text-slate-500 truncate' : 'font-medium whitespace-pre-line'}`}>
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
                            style={{
                                position: 'fixed',
                                left: coords.left,
                                top: coords.top,
                                width: coords.width,
                                zIndex: 99999, // Higher than Modal
                                transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
                                pointerEvents: 'none', // Prevent the wrapper from blocking clicks
                            }}
                        >
                            <div
                                ref={dropdownRef}
                                style={{ maxHeight: `${coords.maxHeight}px`, pointerEvents: 'auto' }}
                                className={`bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in flex flex-col duration-200 ${coords.placement === 'top' ? 'mb-2' : 'mt-2'}`}
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
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                if (onSearchChange) onSearchChange(e.target.value);
                                            }}
                                            className="w-full h-10 pl-9 pr-3 bg-white dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white transition-all"
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') setIsOpen(false);
                                            }}
                                            onFocus={(e) => {
                                                // Natively ensure search input is fully visible if keyboard causes reflow
                                                setTimeout(() => {
                                                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }, 300);
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Options List */}
                                <div className="flex-1 overflow-y-auto no-scrollbar py-1">
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
                                                    <span className="whitespace-pre-line">{opt.label}</span>
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
