/**
 * Detector de rosto (MediaPipe BlazeFace) servido pelo PRÓPRIO app:
 *   - WASM: public/mediapipe/wasm/ (copiado de node_modules pelo vite.config.ts)
 *   - modelo: public/mediapipe/blaze_face_short_range.tflite (versionado)
 * Sem CDN: funciona offline no APK. Carregado só quando usado (import dinâmico)
 * e mantido em memória — antes o modelo era baixado e inicializado a cada foto.
 *
 * Se não carregar, quem chama deve RECUSAR a foto (decisão de 08/11/2026).
 */

import type { FaceDetector, Detection } from '@mediapipe/tasks-vision';
import type { FaceBox } from './profileFaceRules';

type Mode = 'IMAGE' | 'VIDEO';

const cache: Partial<Record<Mode, Promise<FaceDetector>>> = {};

function assetUrl(relative: string): string {
    // Relativo ao documento: funciona no site, no Electron e no Capacitor.
    return new URL(relative, document.baseURI).href;
}

async function createDetector(runningMode: Mode): Promise<FaceDetector> {
    const { FaceDetector: Detector, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(assetUrl('mediapipe/wasm'));
    const options = (delegate: 'GPU' | 'CPU') => ({
        baseOptions: { modelAssetPath: assetUrl('mediapipe/blaze_face_short_range.tflite'), delegate },
        runningMode,
        minDetectionConfidence: 0.5,
    });
    try {
        return await Detector.createFromOptions(fileset, options('GPU'));
    } catch {
        return Detector.createFromOptions(fileset, options('CPU'));
    }
}

/** Detector em cache por modo; falha não fica em cache (permite tentar de novo). */
export function getFaceDetector(mode: Mode): Promise<FaceDetector> {
    if (!cache[mode]) {
        cache[mode] = createDetector(mode).catch(err => {
            delete cache[mode];
            throw err;
        });
    }
    return cache[mode] as Promise<FaceDetector>;
}

function toFaceBoxes(detections: Detection[] | undefined): FaceBox[] {
    return (detections || []).map(d => ({
        width: d.boundingBox?.width ?? 0,
        height: d.boundingBox?.height ?? 0,
        score: d.categories?.[0]?.score ?? 0,
    }));
}

/** Rostos numa imagem já carregada. Lança erro se o detector não carregar. */
export async function detectFacesInImage(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap): Promise<FaceBox[]> {
    const detector = await getFaceDetector('IMAGE');
    return toFaceBoxes(detector.detect(image).detections);
}

/** Rostos num quadro de vídeo (câmera ao vivo); o detector vem de getFaceDetector('VIDEO'). */
export function detectFacesInVideo(detector: FaceDetector, video: HTMLVideoElement, timestampMs: number): FaceBox[] {
    return toFaceBoxes(detector.detectForVideo(video, timestampMs).detections);
}
