/** Diferença (km final − inicial) acima da qual o app pede confirmação dos valores. */
export const KM_CONFIRM_DIFFERENCE = 50;

/** Km final informado (≠ 0) com percurso maior que o limite: provável erro de digitação. */
export const needsKmConfirmation = (initial: number | null | undefined, final: number | null | undefined): boolean =>
    initial != null && final != null && final !== 0 && final - initial > KM_CONFIRM_DIFFERENCE;
