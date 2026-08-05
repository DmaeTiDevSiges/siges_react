import React, { useRef, useState, useEffect, useCallback } from 'react';
import { IconButton } from './IconButton';

interface FaceDetectionCameraProps {
    onCapture: (image: string) => void;
    onCancel: () => void;
}

// Helper to inject script tag (bypasses ESM dynamic import CORS restrictions in WebViews)
const loadExternalScript = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve(true);
        script.onerror = (err) => {
            console.warn(`[FaceDetectionCamera] Failed to load script ${src}:`, err);
            resolve(false);
        };
        document.head.appendChild(script);
    });
};

export const FaceDetectionCamera: React.FC<FaceDetectionCameraProps> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [faceDetector, setFaceDetector] = useState<any>(null);
    const [detectorMode, setDetectorMode] = useState<'native' | 'mediapipe' | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [detectionMessage, setDetectionMessage] = useState('Iniciando câmera...');
    const [faceCount, setFaceCount] = useState(0);

    const startCamera = async () => {
        try {
            setDetectionMessage("Solicitando acesso à webcam...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setHasPermission(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setHasPermission(false);
            setStatus('error');
            setDetectionMessage("Acesso à webcam negado.");
        }
    };

    // Initialize Face Detector:
    // 1. Try Native Browser Shape Detection API (Android Chrome built-in C++ detector)
    // 2. Try MediaPipe Tasks Vision (via UMD script tag to avoid WebView ESM CORS blocks)
    // 3. Fallback to manual capture if offline/unsupported
    useEffect(() => {
        let active = true;

        const initDetector = async () => {
            // Tier 1: Try Native Chromium FaceDetector API (Built into Android Chrome/WebView)
            if (typeof (window as any).FaceDetector !== 'undefined') {
                try {
                    const nativeDetector = new (window as any).FaceDetector({ fastMode: true, maxFaces: 5 });
                    if (active) {
                        setDetectorMode('native');
                        setFaceDetector(nativeDetector);
                        setStatus('ready');
                        setDetectionMessage("Detector nativo ativo. Posicione seu rosto.");
                        return;
                    }
                } catch (e) {
                    console.warn("[FaceDetectionCamera] Native FaceDetector error, falling back to MediaPipe:", e);
                }
            }

            // Tier 2: Try MediaPipe via UMD bundle script injection
            try {
                // Try to load vision bundle via script tag (avoids dynamic import ESM CORS block in WebViews)
                const loaded = await loadExternalScript('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.js');
                const vision = (window as any).tasksVision || (window as any).vision;

                if (loaded && vision) {
                    const { FaceDetector, FilesetResolver } = vision;
                    const filesetResolver = await FilesetResolver.forVisionTasks(
                        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
                    );

                    let detector: any = null;

                    // Try GPU first, fallback to CPU
                    try {
                        detector = await FaceDetector.createFromOptions(filesetResolver, {
                            baseOptions: {
                                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                                delegate: "GPU"
                            },
                            runningMode: "VIDEO"
                        });
                    } catch (gpuError) {
                        console.warn("[FaceDetectionCamera] GPU delegate failed, trying CPU:", gpuError);
                        detector = await FaceDetector.createFromOptions(filesetResolver, {
                            baseOptions: {
                                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                                delegate: "CPU"
                            },
                            runningMode: "VIDEO"
                        });
                    }

                    if (active && detector) {
                        setDetectorMode('mediapipe');
                        setFaceDetector(detector);
                        setStatus('ready');
                        return;
                    }
                }
            } catch (err) {
                console.warn("[FaceDetectionCamera] MediaPipe script load failed:", err);
            }

            // Tier 3: Fallback if detector cannot be loaded (offline / blocked network)
            if (active) {
                setStatus('error');
                setDetectionMessage("Detector indisponível. Captura manual liberada.");
            }
        };

        initDetector();
        startCamera();

        return () => {
            active = false;
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Set ready status when permission and detector are available
    useEffect(() => {
        if (faceDetector && hasPermission && status !== 'ready') {
            setStatus('ready');
        }
    }, [faceDetector, hasPermission, status]);

    const detectFaces = useCallback(async () => {
        if (status === 'ready' && faceDetector && videoRef.current?.readyState === 4) {
            try {
                const video = videoRef.current;
                let count = 0;

                if (detectorMode === 'native') {
                    const faces = await faceDetector.detect(video);
                    count = faces ? faces.length : 0;
                } else if (detectorMode === 'mediapipe') {
                    const startTimeMs = Date.now();
                    const detections = await faceDetector.detectForVideo(video, startTimeMs);
                    count = detections.detections.length;
                }

                setFaceCount(count);

                if (count === 0) {
                    setDetectionMessage("Nenhum rosto detectado");
                } else if (count === 1) {
                    setDetectionMessage("Rosto detectado! Pronto para capturar.");
                } else {
                    setDetectionMessage(`${count} rostos detectados. Use apenas um rosto.`);
                }
            } catch (e) {
                console.warn("[FaceDetectionCamera] Face detection frame error:", e);
            }
        }
    }, [status, faceDetector, detectorMode]);

    useEffect(() => {
        const interval = setInterval(() => {
            detectFaces();
        }, 500);
        return () => clearInterval(interval);
    }, [detectFaces]);

    const isCanCapture = faceCount === 1 || status === 'error';

    const handleCapture = () => {
        if (isCanCapture && videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Flip horizontally for natural selfie look
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
                onCapture(imageSrc);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border-4 border-slate-800">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ transform: 'scaleX(-1)' }}
                    className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* No Permission View */}
                {hasPermission === false && (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
                        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">no_photography</span>
                        <h3 className="text-white text-xl font-bold mb-2">Acesso Negado</h3>
                        <p className="text-slate-400 text-sm mb-8">
                            Por favor, habilite o acesso à sua webcam nas configurações do navegador para continuar.
                        </p>
                        <button
                            onClick={startCamera}
                            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {/* Top Actions & Feedback */}
                <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
                    <div className="pointer-events-auto">
                        <IconButton
                            icon="close"
                            variant="ghost"
                            style={{ color: 'white' }}
                            onClick={onCancel}
                            className="bg-black/20 backdrop-blur-md"
                        />
                    </div>
                    {hasPermission && (
                        <div className={`px-4 py-2 rounded-full backdrop-blur-md text-white text-sm font-bold shadow-lg flex items-center gap-2 transition-all ${
                            status === 'error'
                                ? 'bg-amber-500/80'
                                : faceCount === 1
                                ? 'bg-green-500/80 scale-105'
                                : 'bg-red-500/80'
                        }`}>
                            <span className="material-symbols-outlined text-[18px]">
                                {status === 'error' ? 'info' : faceCount === 1 ? 'check_circle' : 'warning'}
                            </span>
                            {detectionMessage}
                        </div>
                    )}
                </div>

                {/* Guideline Circle */}
                {hasPermission && (
                    <div className={`absolute inset-0 border-[3px] rounded-full pointer-events-none transition-all duration-300 m-12 ${
                        isCanCapture ? 'border-green-400 scale-105 shadow-[0_0_30px_rgba(74,222,128,0.4)]' : 'border-white/20'
                    }`} style={{ borderRadius: '40% 40% 50% 50% / 40% 40% 60% 60%' }}>
                    </div>
                )}

                {/* Capture Button */}
                {hasPermission && (
                    <div className="absolute bottom-8 inset-x-0 flex justify-center">
                        <button
                            onClick={handleCapture}
                            disabled={!isCanCapture}
                            className={`group w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-95 shadow-2xl ${
                                isCanCapture
                                    ? 'bg-white border-primary cursor-pointer'
                                    : 'bg-white/20 border-white/40 cursor-not-allowed opacity-50'
                            }`}
                        >
                            <div className={`w-14 h-14 rounded-full transition-all duration-300 ${
                                isCanCapture ? 'bg-primary scale-100' : 'bg-white/20 scale-50'
                            }`} />
                        </button>
                    </div>
                )}
            </div>

            <p className="text-white/60 text-center mt-8 text-sm px-10 leading-relaxed max-w-xs font-medium">
                {hasPermission === false
                    ? "A permissão de câmera é necessária para o reconhecimento facial."
                    : status === 'error'
                    ? "Detector de rosto desativado no momento. Você pode tirar a foto normalmente."
                    : "Posicione seu rosto na guia. A captura será desbloqueada quando um único rosto for detectado."
                }
            </p>
        </div>
    );
};
