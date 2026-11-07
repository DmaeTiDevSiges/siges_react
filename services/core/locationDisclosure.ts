/**
 * Aviso em destaque de localização (Política de Dados do Usuário da Play Store).
 *
 * A Google exige que o app explique, ANTES do pedido de permissão do Android,
 * quais dados de localização coleta (inclusive com o app fechado), para quê e
 * como, com opção clara de recusar. permissionService chama
 * ensureLocationDisclosure() antes de qualquer pedido de localização; o modal
 * (components/permissions/LocationDisclosureModal) responde pelo evento abaixo.
 *
 * O aceite fica salvo no aparelho. A recusa não é salva: o aviso volta na
 * próxima vez que o app precisar da localização.
 */

/** Aumente a versão se o texto do aviso mudar de forma relevante. */
const STORAGE_KEY = 'siges_location_disclosure_v1';
export const LOCATION_DISCLOSURE_EVENT = 'siges:location-disclosure';

export interface LocationDisclosureRequest {
    resolve: (accepted: boolean) => void;
}

let pending: Promise<boolean> | null = null;

export const hasAcceptedLocationDisclosure = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'accepted';
    } catch {
        return false;
    }
};

const saveAccepted = () => {
    try {
        localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
        // sem storage: o aviso volta a aparecer na próxima abertura
    }
};

/**
 * Resolve true se o usuário já aceitou ou aceitar agora; false se recusar.
 * Chamadas simultâneas compartilham o mesmo aviso.
 */
export const ensureLocationDisclosure = (): Promise<boolean> => {
    if (hasAcceptedLocationDisclosure()) return Promise.resolve(true);
    if (pending) return pending;

    pending = new Promise<boolean>((resolve) => {
        const detail: LocationDisclosureRequest = {
            resolve: (accepted) => {
                if (accepted) saveAccepted();
                pending = null;
                resolve(accepted);
            },
        };
        window.dispatchEvent(new CustomEvent<LocationDisclosureRequest>(LOCATION_DISCLOSURE_EVENT, { detail }));
    });
    return pending;
};
