import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { FaceDetector } from '@mediapipe/tasks-vision';
import { IconButton } from './IconButton';
import { getFaceDetector, detectFacesInVideo } from '../../services/ai/faceDetector';
import { evaluateProfileFace, type ProfileFaceVerdict } from '../../services/ai/profileFaceRules';

interface FaceDetectionCameraProps {
    onCapture: (image: string) => void;
    onCancel: () => void;
}

/**
 * Câmera da foto de perfil com detecção ao vivo. Usa o detector LOCAL e as mesmas
 * regras da verificação final (um rosto, tamanho razoável, detecção confiável).
 * Sem detector não há captura (decisão de 08/11/2026: recusar a foto).
 */
export const FaceDetectionCamera: React.FC<FaceDetectionCameraProps> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [faceDetector, setFaceDetector] = useState<FaceDetector | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [detectionMessage, setDetectionMessage] = useState('Iniciando câmera...');
    const [verdict, setVerdict] = useState<ProfileFaceVerdict | null>(null);
    const lastTimestampRef = useRef(0);

    const startCamera = async () => {
        try {
            setDetectionMessage("Solicitando acesso à câmera...");
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
            setDetectionMessage("Acesso à câmera negado.");
        }
    };

    const loadDetector = useCallback(async () => {
        setStatus('loading');
        setDetectionMessage('Carregando o detector de rosto...');
        try {
            const detector = await getFaceDetector('VIDEO');
            setFaceDetector(detector);
            setStatus('ready');
            setDetectionMessage('Posicione seu rosto na guia.');
        } catch (err) {
            console.warn("[FaceDetectionCamera] Detector indisponível:", err);
            setStatus('error');
            setDetectionMessage('Detector de rosto indisponível.');
        }
    }, []);

    useEffect(() => {
        loadDetector();
        startCamera();

        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const detectFaces = useCallback(() => {
        const video = videoRef.current;
        if (status !== 'ready' || !faceDetector || !video || video.readyState !== 4) return;
        try {
            // detectForVideo exige timestamps estritamente crescentes
            const ts = Math.max(performance.now(), lastTimestampRef.current + 1);
            lastTimestampRef.current = ts;
            const faces = detectFacesInVideo(faceDetector, video, ts);
            const v = evaluateProfileFace(faces, video.videoWidth, video.videoHeight);
            setVerdict(v);
            setDetectionMessage(v.ok ? 'Rosto detectado! Pronto para capturar.' : v.message);
        } catch (e) {
            console.warn("[FaceDetectionCamera] Face detection frame error:", e);
        }
    }, [status, faceDetector]);

    useEffect(() => {
        const interval = setInterval(detectFaces, 400);
        return () => clearInterval(interval);
    }, [detectFaces]);

    const isCanCapture = status === 'ready' && !!verdict?.ok;

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

                {/* Detector indisponível: tentar de novo (sem captura manual) */}
                {hasPermission && status === 'error' && (
                    <div className="absolute inset-x-0 bottom-32 flex justify-center">
                        <button
                            onClick={loadDetector}
                            className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors"
                        >
                            Tentar novamente
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
                            status !== 'ready'
                                ? 'bg-amber-500/80'
                                : isCanCapture
                                ? 'bg-green-500/80 scale-105'
                                : 'bg-red-500/80'
                        }`}>
                            <span className="material-symbols-outlined text-[18px]">
                                {status !== 'ready' ? 'info' : isCanCapture ? 'check_circle' : 'warning'}
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
                    ? "Não foi possível carregar o detector de rosto. Sem ele a foto não pode ser enviada."
                    : "Posicione só o seu rosto na guia, perto da câmera. A captura é liberada quando o rosto for reconhecido."
                }
            </p>
        </div>
    );
};
