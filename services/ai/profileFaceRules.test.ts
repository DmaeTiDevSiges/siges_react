import { evaluateProfileFace, MIN_FACE_RATIO } from './profileFaceRules';

const face = (width: number, score = 0.95) => ({ width, height: width, score });

describe('evaluateProfileFace', () => {
    it('aceita um rosto nítido e de bom tamanho', () => {
        const v = evaluateProfileFace([face(300)], 800, 800);
        expect(v).toMatchObject({ ok: true, reason: 'ok', faceCount: 1 });
    });

    it('recusa sem rosto', () => {
        expect(evaluateProfileFace([], 800, 800)).toMatchObject({ ok: false, reason: 'no_face' });
    });

    it('recusa mais de um rosto', () => {
        expect(evaluateProfileFace([face(300), face(250)], 800, 800)).toMatchObject({ ok: false, reason: 'multiple_faces', faceCount: 2 });
    });

    it('recusa rosto pequeno (abaixo de 20% do menor lado)', () => {
        expect(evaluateProfileFace([face(100)], 800, 600)).toMatchObject({ ok: false, reason: 'face_too_small' });
        // no limite passa
        expect(evaluateProfileFace([face(600 * MIN_FACE_RATIO)], 800, 600).ok).toBe(true);
    });

    it('recusa detecção pouco confiável', () => {
        expect(evaluateProfileFace([face(300, 0.5)], 800, 800)).toMatchObject({ ok: false, reason: 'low_confidence' });
    });

    it('imagem sem dimensão não passa', () => {
        expect(evaluateProfileFace([face(300)], 0, 0).ok).toBe(false);
    });
});
