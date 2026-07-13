import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
    onSave: (base64: string) => void;
    onCancel: () => void;
    title?: string;
}

const useIsLandscape = () => {
    const [isLandscape, setIsLandscape] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(orientation: landscape)').matches ||
               window.matchMedia('(max-height: 500px)').matches;
    });

    useEffect(() => {
        const mqPortrait = window.matchMedia('(orientation: portrait)');
        const mqLandscape = window.matchMedia('(orientation: landscape)');
        const mqSmallHeight = window.matchMedia('(max-height: 500px)');

        const update = () => {
            setIsLandscape(mqLandscape.matches || mqSmallHeight.matches);
        };

        mqPortrait.addEventListener('change', update);
        mqLandscape.addEventListener('change', update);
        mqSmallHeight.addEventListener('change', update);

        return () => {
            mqPortrait.removeEventListener('change', update);
            mqLandscape.removeEventListener('change', update);
            mqSmallHeight.removeEventListener('change', update);
        };
    }, []);

    return isLandscape;
};

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, title = "Assinatura Digital" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const isLandscape = useIsLandscape();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeObserver = new ResizeObserver(() => {
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const ratio = window.devicePixelRatio || 1;

            let tempImage: ImageData | null = null;
            if (!isEmpty) {
                try {
                    tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
                } catch (e) { /* ignore */ }
            }

            canvas.width = rect.width * ratio;
            canvas.height = rect.height * ratio;
            ctx.scale(ratio, ratio);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;

            const isDarkMode = document.documentElement.classList.contains('dark');
            ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';

            if (tempImage) {
                ctx.putImageData(tempImage, 0, 0);
            }
        });

        resizeObserver.observe(canvas);
        return () => resizeObserver.disconnect();
    }, [isEmpty]);

    const points = useRef<{ x: number, y: number }[]>([]);
    const startPoint = useRef<{ x: number, y: number } | null>(null);
    const hasMoved = useRef(false);
    const MIN_DISTANCE = 5;

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            if (e.touches.length === 0) return { x: 0, y: 0 };
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
        if (e.cancelable) e.preventDefault();
        const { x, y } = getCoordinates(e);
        startPoint.current = { x, y };
        hasMoved.current = false;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!startPoint.current) return;
        if (e.cancelable) e.preventDefault();

        const { x, y } = getCoordinates(e);

        if (!hasMoved.current) {
            const dx = x - startPoint.current.x;
            const dy = y - startPoint.current.y;
            if (Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE) return;

            hasMoved.current = true;
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            setIsDrawing(true);
            setIsEmpty(false);

            const isDarkMode = document.documentElement.classList.contains('dark');
            ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';

            ctx.beginPath();
            ctx.moveTo(startPoint.current.x, startPoint.current.y);
            points.current = [startPoint.current];
        }

        if (!isDrawing) return;

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        points.current.push({ x, y });

        if (points.current.length > 3) {
            const lastThreePoints = points.current.slice(-3);
            const xc = (lastThreePoints[1].x + lastThreePoints[2].x) / 2;
            const yc = (lastThreePoints[1].y + lastThreePoints[2].y) / 2;

            ctx.quadraticCurveTo(lastThreePoints[1].x, lastThreePoints[1].y, xc, yc);
            ctx.stroke();
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const endDrawing = () => {
        setIsDrawing(false);
        startPoint.current = null;
        hasMoved.current = false;
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

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
            tempCtx.drawImage(canvas, 0, 0);
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = '#000000';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            const dataUrl = tempCanvas.toDataURL('image/png');
            onSave(dataUrl);
        } else {
            onSave(canvas.toDataURL('image/png'));
        }
    };

    if (isLandscape) {
        return (
            <div className="flex flex-col h-full w-full px-2 pt-[max(0.25rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between px-2 py-1 shrink-0">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
                    <button
                        onClick={clear}
                        className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-2 py-1 rounded-full transition-colors"
                    >
                        Limpar
                    </button>
                </div>

                <div className="relative flex-1 min-h-0 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden touch-none">
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

                    <div className="absolute left-8 right-8 top-1/3 border-b border-slate-200 dark:border-slate-800 pointer-events-none flex items-center gap-1.5 pb-0.5">
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-sm">edit</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700">Assine aqui</span>
                    </div>
                </div>

                <div className="flex gap-2 px-1 pt-2 shrink-0">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isEmpty}
                        className="flex-[1.5] px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary/20"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between px-1 pb-2 shrink-0">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{title}</h3>
                <button
                    onClick={clear}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-colors"
                >
                    Limpar
                </button>
            </div>

            <div className="relative flex-1 min-h-[200px] bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden touch-none">
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

                <div className="absolute left-10 right-10 top-1/4 border-b-2 border-slate-200 dark:border-slate-800 pointer-events-none flex items-center gap-2 pb-1">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-lg">edit</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700">Assine aqui</span>
                </div>
            </div>

            <div className="flex gap-3 pt-3 shrink-0">
                <button
                    onClick={onCancel}
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={isEmpty}
                    className="flex-[1.5] px-6 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary/20"
                >
                    Salvar Assinatura
                </button>
            </div>
        </div>
    );
};
