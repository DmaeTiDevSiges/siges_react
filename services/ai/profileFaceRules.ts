/**
 * Regras da foto de perfil (decisão de 08/11/2026):
 *   - exatamente UM rosto;
 *   - rosto de tamanho razoável (não um rosto minúsculo ao fundo);
 *   - detecção confiável.
 * Função pura: usada pela câmera (dica ao vivo) e pela verificação antes de salvar.
 */

export interface FaceBox {
    /** Largura da caixa do rosto, em pixels da imagem analisada. */
    width: number;
    height: number;
    /** Confiança da detecção, 0–1. */
    score: number;
}

export type ProfileFaceReason = 'ok' | 'no_face' | 'multiple_faces' | 'face_too_small' | 'low_confidence';

export interface ProfileFaceVerdict {
    ok: boolean;
    reason: ProfileFaceReason;
    faceCount: number;
    message: string;
}

/** Largura do rosto ÷ menor lado da imagem. */
export const MIN_FACE_RATIO = 0.2;
export const MIN_FACE_SCORE = 0.7;

export const PROFILE_FACE_MESSAGES: Record<ProfileFaceReason, string> = {
    ok: 'Rosto detectado.',
    no_face: 'Nenhum rosto encontrado. Use uma foto nítida do seu rosto.',
    multiple_faces: 'A foto deve ter só você: foi encontrado mais de um rosto.',
    face_too_small: 'Seu rosto está muito pequeno. Aproxime a câmera ou recorte a foto.',
    low_confidence: 'Não foi possível reconhecer um rosto com segurança. Melhore a iluminação e tente de novo.',
};

export function evaluateProfileFace(faces: readonly FaceBox[], imageWidth: number, imageHeight: number): ProfileFaceVerdict {
    const verdict = (reason: ProfileFaceReason): ProfileFaceVerdict => ({
        ok: reason === 'ok',
        reason,
        faceCount: faces.length,
        message: PROFILE_FACE_MESSAGES[reason],
    });

    if (faces.length === 0) return verdict('no_face');
    if (faces.length > 1) return verdict('multiple_faces');

    const [face] = faces;
    if (face.score < MIN_FACE_SCORE) return verdict('low_confidence');

    const shortSide = Math.min(imageWidth, imageHeight);
    if (!shortSide || face.width / shortSide < MIN_FACE_RATIO) return verdict('face_too_small');

    return verdict('ok');
}
