import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { evaluateExpression, formatCalcNumber } from '../../utils/calculator';

interface CalculatorModalProps {
    isOpen: boolean;
    currentValue: number;
    onApply: (result: number) => void;
    onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
    isOpen,
    currentValue,
    onApply,
    onClose,
}) => {
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setExpression('');
            setResult(null);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!expression) {
            setResult(null);
            return;
        }
        const val = evaluateExpression(expression);
        setResult(val);
    }, [expression]);

    const appendChar = (char: string) => {
        setExpression(prev => prev + char);
    };

    const clear = () => {
        setExpression('');
        setResult(null);
    };

    const apply = () => {
        if (result !== null && result > 0) {
            onApply(result);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter') apply();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    const btnClass = 'h-12 rounded-xl text-base font-bold transition-all active:scale-95 select-none';
    const numClass = `${btnClass} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700`;
    const opClass = `${btnClass} bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50`;
    const clearClass = `${btnClass} bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50`;
    const applyClass = `${btnClass} bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2`;

    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
        >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <div
                className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                            Calculadora
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    <div className="bg-slate-50 dark:bg-black/30 rounded-xl p-3 mb-2">
                        <input
                            ref={inputRef}
                            type="text"
                            readOnly
                            value={expression}
                            placeholder="0"
                            className="w-full bg-transparent text-right text-lg font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                    </div>

                    <div className="text-right h-8">
                        {result !== null ? (
                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                = {formatCalcNumber(result)}
                            </span>
                        ) : (
                            <span className="text-sm text-slate-300 dark:text-slate-600">
                                Valor atual: {formatCalcNumber(currentValue)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="px-5 pb-5 space-y-2">
                    {/* Row 1 */}
                    <div className="grid grid-cols-4 gap-2">
                        <button type="button" className={numClass} onClick={() => appendChar('7')}>7</button>
                        <button type="button" className={numClass} onClick={() => appendChar('8')}>8</button>
                        <button type="button" className={numClass} onClick={() => appendChar('9')}>9</button>
                        <button type="button" className={opClass} onClick={() => appendChar('/')}>÷</button>
                    </div>
                    {/* Row 2 */}
                    <div className="grid grid-cols-4 gap-2">
                        <button type="button" className={numClass} onClick={() => appendChar('4')}>4</button>
                        <button type="button" className={numClass} onClick={() => appendChar('5')}>5</button>
                        <button type="button" className={numClass} onClick={() => appendChar('6')}>6</button>
                        <button type="button" className={opClass} onClick={() => appendChar('*')}>×</button>
                    </div>
                    {/* Row 3 */}
                    <div className="grid grid-cols-4 gap-2">
                        <button type="button" className={numClass} onClick={() => appendChar('1')}>1</button>
                        <button type="button" className={numClass} onClick={() => appendChar('2')}>2</button>
                        <button type="button" className={numClass} onClick={() => appendChar('3')}>3</button>
                        <button type="button" className={opClass} onClick={() => appendChar('-')}>-</button>
                    </div>
                    {/* Row 4 */}
                    <div className="grid grid-cols-4 gap-2">
                        <button type="button" className={clearClass} onClick={clear}>C</button>
                        <button type="button" className={numClass} onClick={() => appendChar('0')}>0</button>
                        <button type="button" className={numClass} onClick={() => appendChar('.')}>.</button>
                        <button type="button" className={opClass} onClick={() => appendChar('+')}>+</button>
                    </div>
                    {/* Row 5: APLICAR */}
                    <div className="grid grid-cols-1 gap-2">
                        <button type="button" className={applyClass} onClick={apply}>
                            <span className="material-symbols-outlined text-lg">check</span>
                            APLICAR
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
