// Verificação da foto de perfil antes de salvar: exatamente um rosto, de tamanho
// razoável e detectado com confiança (services/ai/profileFaceRules.ts).
// Detector local (services/ai/faceDetector.ts). Se não for possível verificar,
// a foto é RECUSADA (decisão de 08/11/2026) — antes era aceita.

import { detectFacesInImage } from './faceDetector';
import { evaluateProfileFace, type ProfileFaceReason } from './profileFaceRules';

export interface FaceVerificationResult {
    /** true = foto válida para perfil (exatamente um rosto e dentro das regras). */
    hasFace: boolean;
    faceCount: number;
    reason: ProfileFaceReason | 'detector_unavailable' | 'invalid_image';
    /** Mensagem pronta para o usuário. */
    message: string;
    error?: string;
}

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

const toDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

/**
 * Verifica se a imagem (DataURL, File ou Blob) serve como foto de perfil.
 * Nunca aceita por padrão: se o detector não carregar, devolve hasFace = false.
 */
export async function verifyHumanFaceInImage(imageSource: string | File | Blob): Promise<FaceVerificationResult> {
    let img: HTMLImageElement;
    try {
        const src = typeof imageSource === 'string' ? imageSource : await toDataUrl(imageSource);
        img = await loadImageElement(src);
    } catch (err: any) {
        return {
            hasFace: false,
            faceCount: 0,
            reason: 'invalid_image',
            message: 'Não foi possível abrir a imagem. Tente outra foto.',
            error: err?.message,
        };
    }

    try {
        const faces = await detectFacesInImage(img);
        const verdict = evaluateProfileFace(faces, img.naturalWidth, img.naturalHeight);
        return { hasFace: verdict.ok, faceCount: verdict.faceCount, reason: verdict.reason, message: verdict.message };
    } catch (err: any) {
        return {
            hasFace: false,
            faceCount: 0,
            reason: 'detector_unavailable',
            message: 'Não foi possível verificar o rosto agora. Tente novamente em instantes.',
            error: err?.message,
        };
    }
}
