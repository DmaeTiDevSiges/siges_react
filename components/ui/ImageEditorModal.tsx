import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { imgproxyService } from '../../services/imgproxyService';
import { FileUtils } from '../../utils/FileUtils';


interface Point {
    x: number;
    y: number;
}

interface EditorObject {
    type: 'pen' | 'arrow' | 'circle' | 'text';
    points?: Point[];
    text?: string;
    color: string;
    lineWidth: number;
    fontSize?: number;
}

interface ImageEditorModalProps {
    isOpen: boolean;
    imageFile: File | string; // Can be a File object or a URL
    onClose: () => void;
    onSave: (editedFile: File) => void;
    preventAnnotation?: boolean;
}

type Mode = 'pan' | 'pen' | 'arrow' | 'circle' | 'text';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, imageFile, onClose, onSave, preventAnnotation = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Image and Transform State
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    
    // Editor State
    const [mode, setMode] = useState<Mode>('pan');
    const [color, setColor] = useState('#ff0000'); // Default Red
    const [objects, setObjects] = useState<EditorObject[]>([]);
    const [currentObject, setCurrentObject] = useState<EditorObject | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Interactivity State
    const [isInteracting, setIsInteracting] = useState(false);
    const [lastTouch, setLastTouch] = useState<Point | null>(null);
    const [lastDistance, setLastDistance] = useState<number | null>(null);

    // If preventAnnotation is true, force pattern to pan
    useEffect(() => {
        if (preventAnnotation) {
            setMode('pan');
        }
    }, [preventAnnotation, isOpen]);

    // Initial Image Load
    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        let objectUrl: string | null = null;

        const loadFromBlob = (blob: Blob) => {
            if (cancelled) return;
            const currentObjectUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(currentObjectUrl);
                if (!cancelled) {
                    setImage(img);
                    resetView(img);
                }
            };
            img.onerror = (err) => {
                URL.revokeObjectURL(currentObjectUrl);
                console.error("Editor: failed to load image from blob", err);
            };
            img.src = currentObjectUrl;
        };

        if (typeof imageFile === 'string') {
            // For remote URLs: fetch via imgproxy to avoid R2 CORS restriction.
            // imgproxy runs on the same VPS and accesses R2 internally via S3 credentials,
            // so it can serve the image with proper CORS headers to our app.
            const fetchUrl = imgproxyService.isImgproxyConfigured()
                ? imgproxyService.generateUrl(imageFile, { format: 'jpeg', quality: 95 })
                : imageFile;

            fetch(fetchUrl)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.blob();
                })
                .then(blob => { if (!cancelled) loadFromBlob(blob); })
                .catch((err) => {
                    console.warn("Editor: fetch failed, trying direct load (canvas may be read-only):", err);
                    // Last resort: load directly — canvas will be tainted, toBlob will fail
                    if (cancelled) return;
                    const img = new Image();
                    img.onload = () => { if (!cancelled) { setImage(img); resetView(img); } };
                    img.src = imageFile;
                });
        } else {
            // File object: blob URL is always CORS-safe
            const blob = new Blob([imageFile], { type: imageFile.type });
            loadFromBlob(blob);
        }

        return () => {
            cancelled = true;
        };
    }, [isOpen, imageFile]);

    const resetView = (img: HTMLImageElement) => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const padding = 40;
        const availableWidth = container.clientWidth - padding;
        const availableHeight = container.clientHeight - padding;
        
        const imgWidth = img.width;
        const imgHeight = img.height;
        
        const scaleX = availableWidth / imgWidth;
        const scaleY = availableHeight / imgHeight;
        const newScale = Math.min(scaleX, scaleY, 1);
        
        setScale(newScale);
        setOffset({
            x: (container.clientWidth - imgWidth * newScale) / 2,
            y: (container.clientHeight - imgHeight * newScale) / 2
        });
        setRotation(0);
        setObjects([]);
    };

    // Rendering Loop
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !image) return;

        // Sync canvas size to container
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            if (canvas.width !== rect.width * devicePixelRatio || canvas.height !== rect.height * devicePixelRatio) {
                canvas.width = rect.width * devicePixelRatio;
                canvas.height = rect.height * devicePixelRatio;
                ctx.scale(devicePixelRatio, devicePixelRatio);
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        // Apply view transform
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);
        
        // Apply rotation around center of image
        ctx.translate(image.width / 2, image.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-image.width / 2, -image.height / 2);

        // Draw Image
        ctx.drawImage(image, 0, 0);

        // Draw Objects
        const allObjects = [...objects];
        if (currentObject) allObjects.push(currentObject);

        allObjects.forEach(obj => {
            ctx.strokeStyle = obj.color;
            ctx.fillStyle = obj.color;
            ctx.lineWidth = obj.lineWidth / scale; // Keep relative line width
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (obj.type === 'pen' && obj.points && obj.points.length > 1) {
                ctx.beginPath();
                ctx.moveTo(obj.points[0].x, obj.points[0].y);
                for (let i = 1; i < obj.points.length; i++) {
                    ctx.lineTo(obj.points[i].x, obj.points[i].y);
                }
                ctx.stroke();
            } else if (obj.type === 'arrow' && obj.points && obj.points.length === 2) {
                const p1 = obj.points[0];
                const p2 = obj.points[1];
                drawArrow(ctx, p1.x, p1.y, p2.x, p2.y, obj.lineWidth / scale);
            } else if (obj.type === 'circle' && obj.points && obj.points.length === 2) {
                const p1 = obj.points[0];
                const p2 = obj.points[1];
                const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (obj.type === 'text' && obj.points && obj.points[0] && obj.text) {
                ctx.font = `bold ${obj.fontSize || 20}px Inter, sans-serif`;
                ctx.fillText(obj.text, obj.points[0].x, obj.points[0].y);
            }
        });

        ctx.restore();
    }, [image, scale, offset, rotation, objects, currentObject]);

    useEffect(() => {
        render();
    }, [render]);

    const drawArrow = (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, lineWidth: number) => {
        const headlen = Math.max(lineWidth * 8, 20); // Cabeça da seta mais proeminente
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 5), toy - headlen * Math.sin(angle - Math.PI / 5));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 5), toy - headlen * Math.sin(angle + Math.PI / 5));
        ctx.closePath();
        ctx.fill();
    };

    // Coordinate mapping: Screen to Image
    const screenToImage = (x: number, y: number): Point => {
        // 1. Compensate for offset
        let ix = (x - offset.x) / scale;
        let iy = (y - offset.y) / scale;

        // 2. Compensate for rotation
        if (image) {
            const cx = image.width / 2;
            const cy = image.height / 2;
            const rad = (-rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const dx = ix - cx;
            const dy = iy - cy;
            
            ix = cx + (dx * cos - dy * sin);
            iy = cy + (dx * sin + dy * cos);
        }

        return { x: ix, y: iy };
    };

    // Input Handlers
    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if ('touches' in e && e.touches.length === 2) {
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            setLastDistance(dist);
            setIsInteracting(false);
            return;
        }

        setIsInteracting(true);
        setLastTouch({ x, y });

        if (mode !== 'pan') {
            const imgPoint = screenToImage(x, y);
            if (mode === 'text') {
                const textInput = prompt("Digite o texto:");
                if (textInput) {
                    setObjects(prev => [...prev, {
                        type: 'text',
                        points: [imgPoint],
                        text: textInput,
                        color,
                        lineWidth: 2,
                        fontSize: 24 / scale
                    }]);
                }
                setIsInteracting(false);
            } else {
                setCurrentObject({
                    type: mode as any,
                    points: [imgPoint],
                    color,
                    lineWidth: 4
                });
            }
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!image) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if ('touches' in e && e.touches.length === 2 && lastDistance) {
            const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            const delta = dist / lastDistance;
            const newScale = Math.min(Math.max(scale * delta, 0.1), 10);
            
            // Zoom towards center of two touches
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
            
            setOffset(prev => ({
                x: midX - (midX - prev.x) * delta,
                y: midY - (midY - prev.y) * delta
            }));
            
            setScale(newScale);
            setLastDistance(dist);
            return;
        }

        if (!isInteracting || !lastTouch) return;

        if (mode === 'pan') {
            setOffset(prev => ({
                x: prev.x + (x - lastTouch.x),
                y: prev.y + (y - lastTouch.y)
            }));
            setLastTouch({ x, y });
        } else if (currentObject) {
            const imgPoint = screenToImage(x, y);
            if (mode === 'pen') {
                setCurrentObject(prev => prev ? {
                    ...prev,
                    points: [...(prev.points || []), imgPoint]
                } : null);
            } else {
                // Circle or Arrow: replace end point
                setCurrentObject(prev => prev ? {
                    ...prev,
                    points: [prev.points![0], imgPoint]
                } : null);
            }
        }
    };

    const handleEnd = () => {
        setIsInteracting(false);
        setLastTouch(null);
        setLastDistance(null);
        
        if (currentObject) {
            setObjects(prev => [...prev, currentObject]);
            setCurrentObject(null);
        }
    };

    const rotateImage = () => {
        setRotation(r => (r + 90) % 360);
    };

    const handleUndo = () => {
        setObjects(prev => prev.slice(0, -1));
    };

    const generateEditedBlob = async (quality = 0.90): Promise<Blob | null> => {
        if (!image) return null;

        // 1. Create an offscreen canvas with exact image dimensions
        const isRotated = rotation === 90 || rotation === 270;
        const exportWidth = isRotated ? image.height : image.width;
        const exportHeight = isRotated ? image.width : image.height;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = exportWidth;
        offCanvas.height = exportHeight;
        const octx = offCanvas.getContext('2d');
        
        if (!octx) return null;

        // 2. Apply rotation
        octx.save();
        octx.translate(exportWidth / 2, exportHeight / 2);
        octx.rotate((rotation * Math.PI) / 180);
        octx.translate(-image.width / 2, -image.height / 2);

        // 3. Draw original image
        octx.drawImage(image, 0, 0);

        // 4. Draw all objects (annotations)
        const allObjects = [...objects];
        if (currentObject) allObjects.push(currentObject);

        allObjects.forEach(obj => {
            octx.strokeStyle = obj.color;
            octx.fillStyle = obj.color;
            octx.lineWidth = obj.lineWidth; // Use stable line width for export
            octx.lineCap = 'round';
            octx.lineJoin = 'round';

            if (obj.type === 'pen' && obj.points && obj.points.length > 1) {
                octx.beginPath();
                octx.moveTo(obj.points[0].x, obj.points[0].y);
                for (let i = 1; i < obj.points.length; i++) {
                    octx.lineTo(obj.points[i].x, obj.points[i].y);
                }
                octx.stroke();
            } else if (obj.type === 'arrow' && obj.points && obj.points.length === 2) {
                drawArrow(octx, obj.points[0].x, obj.points[0].y, obj.points[1].x, obj.points[1].y, obj.lineWidth);
            } else if (obj.type === 'circle' && obj.points && obj.points.length === 2) {
                const p1 = obj.points[0];
                const p2 = obj.points[1];
                const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                octx.beginPath();
                octx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
                octx.stroke();
            } else if (obj.type === 'text' && obj.points && obj.points[0] && obj.text) {
                octx.font = `bold ${obj.fontSize || 20}px Inter, sans-serif`;
                octx.fillText(obj.text, obj.points[0].x, obj.points[0].y);
            }
        });

        octx.restore();

        return new Promise((resolve) => {
            offCanvas.toBlob(resolve, 'image/jpeg', quality);
        });
    };

    const handleExport = async () => {
        setIsSaving(true);
        try {
            const blob = await generateEditedBlob(0.90);
            if (blob) {
                const file = new File([blob], `edited_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onSave(file);
            } else {
                throw new Error("toBlob returned null");
            }
        } catch (error) {
            console.error("Editor: export failed", error);
            alert("Erro ao processar imagem. Tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        setIsSaving(true);
        try {
            const blob = await generateEditedBlob(0.95);
            if (blob) {
                await FileUtils.downloadFile(blob, `siges_imagem_${Date.now()}.jpg`);
            } else {
                throw new Error("Blob is null");
            }
        } catch (error) {
            console.error("Editor: download failed", error);
            alert("Erro ao baixar imagem.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;


    return createPortal(
        <div className="fixed inset-0 z-9999 bg-black flex flex-col animate-in fade-in duration-300" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {/* Toolbar Top - Close, Download and OK */}
            <div className="p-4 bg-linear-to-b from-black to-transparent flex items-center justify-between z-10">
                <IconButton icon="close" onClick={onClose} variant="soft" size="lg" className="bg-white/10! text-white! rounded-2xl!" />
                
                <div className="flex gap-3 items-center">
                    <IconButton 
                        icon="download" 
                        onClick={handleDownload} 
                        disabled={isSaving}
                        variant="soft" 
                        size="lg" 
                        className="bg-white/10! text-white! rounded-2xl!" 
                    />
                    <Button 
                        onClick={handleExport} 
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-white font-black px-6 h-12! rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                    >
                        {isSaving ? '...' : 'OK'}
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden touch-none bg-slate-900/50">
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleStart}
                    onMouseMove={handleMove}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={handleMove}
                    onTouchEnd={handleEnd}
                    className="cursor-crosshair w-full h-full"
                />
            </div>

            {/* Toolbar Bottom - Tools, Colors and Actions */}
            <div className="px-4 pb-8 pt-6 bg-linear-to-t from-black to-transparent flex flex-col gap-6 z-10">
                {!preventAnnotation && (
                    <div className="flex justify-center">
                        <div className="flex gap-2.5 bg-white/10 p-1.5 rounded-[24px] backdrop-blur-2xl border border-white/10 shadow-2xl">
                            <ToolButton active={mode === 'pan'} icon="pan_tool" onClick={() => setMode('pan')} />
                            <ToolButton active={mode === 'pen'} icon="edit" onClick={() => setMode('pen')} />
                            <ToolButton active={mode === 'arrow'} icon="trending_flat" onClick={() => setMode('arrow')} />
                            <ToolButton active={mode === 'circle'} icon="radio_button_unchecked" onClick={() => setMode('circle')} />
                            <ToolButton active={mode === 'text'} icon="text_fields" onClick={() => setMode('text')} />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    {!preventAnnotation ? (
                        <div className="flex gap-3">
                            <ColorDot active={color === '#ff0000'} color="#ff0000" onClick={() => setColor('#ff0000')} />
                            <ColorDot active={color === '#facc15'} color="#facc15" onClick={() => setColor('#facc15')} />
                            <ColorDot active={color === '#22c55e'} color="#22c55e" onClick={() => setColor('#22c55e')} />
                            <ColorDot active={color === '#ffffff'} color="#ffffff" onClick={() => setColor('#ffffff')} />
                        </div>
                    ) : (
                        <div />
                    )}
                    
                    <div className="flex gap-4">
                        <IconButton icon="rotate_right" onClick={rotateImage} variant="soft" size="md" className="bg-white/10! text-white! rounded-xl!" />
                        {!preventAnnotation && (
                            <IconButton icon="undo" onClick={handleUndo} disabled={objects.length === 0} variant="soft" size="md" className="bg-white/10! text-white! rounded-xl!" />
                        )}
                    </div>
                </div>
            </div>
            
            {/* Status Hint */}
            <div className="absolute bottom-52 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/60 font-black uppercase tracking-widest border border-white/5">
                    {mode === 'pan' ? 'Use 2 dedos para zoom / Corte' : `MODO: ${mode.toUpperCase()}`}
                </div>
            </div>
        </div>,
        document.body
    );
};

const ToolButton: React.FC<{ active: boolean; icon: string; onClick: () => void }> = ({ active, icon, onClick }) => (
    <button
        onClick={onClick}
        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 ${active ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 z-10' : 'text-white/70 hover:bg-white/10 active:scale-95'}`}
    >
        <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
);

const ColorDot: React.FC<{ active: boolean; color: string; onClick: () => void }> = ({ active, color, onClick }) => (
    <button
        onClick={onClick}
        className={`w-11 h-11 rounded-full border-2 transition-all p-0.5 ${active ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
    >
        <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
    </button>
);
