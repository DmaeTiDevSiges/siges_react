import React, { useRef, useState, useEffect } from 'react';
import { IconButton } from './IconButton';

interface SignaturePadProps {
    onSave: (base64: string) => void;
    onCancel: () => void;
    title?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, title = "Assinatura Digital" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ajustar resolução para retina/high-dpi
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        ctx.scale(ratio, ratio);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a'; // slate-900
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setIsEmpty(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        
        // Impedir scroll durante a assinatura no mobile
        if (e.cancelable) e.preventDefault();

        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    };

    const handleSave = () => {
        if (isEmpty) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Exportar como PNG base64
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div className="flex flex-col gap-4 w-full h-full pb-safe">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{title}</h3>
                <button 
                    onClick={clear}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-colors"
                >
                    Limpar
                </button>
            </div>

            <div className="relative flex-1 min-h-[300px] bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden touch-none">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseOut={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                    className="w-full h-full cursor-crosshair"
                    style={{ touchAction: 'none' }}
                />
                
                {isEmpty && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-400">draw</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Assine aqui</span>
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    onClick={onCancel}
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={isEmpty}
                    className="flex-[2] px-6 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary/20"
                >
                    Salvar Assinatura
                </button>
            </div>
        </div>
    );
};
