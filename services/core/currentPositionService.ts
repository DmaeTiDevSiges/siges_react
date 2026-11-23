import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { permissionService } from './permissionService';

export type CurrentPositionErrorCode =
    | 'permission_denied'
    | 'services_disabled'
    | 'timeout'
    | 'unavailable'
    | 'unsupported';

export class CurrentPositionError extends Error {
    constructor(public code: CurrentPositionErrorCode, message: string) {
        super(message);
        this.name = 'CurrentPositionError';
    }
}

export const CURRENT_POSITION_MESSAGES: Record<CurrentPositionErrorCode, string> = {
    permission_denied: 'Permissão de localização negada. Libere a localização nas configurações do aparelho/navegador.',
    services_disabled: 'A localização do aparelho está desligada. Ative o GPS e tente de novo.',
    timeout: 'Não foi possível obter a localização a tempo. Vá para um local aberto e tente de novo.',
    unavailable: 'Localização indisponível no momento.',
    unsupported: 'Geolocalização não é suportada neste dispositivo.',
};

export interface CurrentPosition {
    latitude: number;
    longitude: number;
    accuracy: number | null;
}

interface Options {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

const classify = (err: unknown): CurrentPositionError => {
    if (err instanceof CurrentPositionError) return err;
    const anyErr = err as { code?: number | string; message?: string };
    const msg = String(anyErr?.message ?? '').toLowerCase();
    // GeolocationPositionError web: 1 = negada, 2 = indisponível, 3 = timeout.
    if (anyErr?.code === 1 || msg.includes('denied')) {
        return new CurrentPositionError('permission_denied', CURRENT_POSITION_MESSAGES.permission_denied);
    }
    if (msg.includes('location services') || msg.includes('location is disabled') || msg.includes('disabled')) {
        return new CurrentPositionError('services_disabled', CURRENT_POSITION_MESSAGES.services_disabled);
    }
    if (anyErr?.code === 3 || msg.includes('timeout') || msg.includes('timed out')) {
        return new CurrentPositionError('timeout', CURRENT_POSITION_MESSAGES.timeout);
    }
    return new CurrentPositionError('unavailable', CURRENT_POSITION_MESSAGES.unavailable);
};

/**
 * Posição pontual do aparelho. No app nativo garante a permissão (com o aviso em
 * destaque) antes de ler; na web o plugin usa navigator.geolocation. Sempre com
 * timeout, e falhas viram CurrentPositionError com código tratável pela tela.
 */
export async function getCurrentPosition(options: Options = {}): Promise<CurrentPosition> {
    if (!Capacitor.isNativePlatform() && !navigator.geolocation) {
        throw new CurrentPositionError('unsupported', CURRENT_POSITION_MESSAGES.unsupported);
    }

    if (Capacitor.isNativePlatform()) {
        const perm = await permissionService.requestLocationPermission();
        if (perm.locationServicesDisabled) {
            throw new CurrentPositionError('services_disabled', CURRENT_POSITION_MESSAGES.services_disabled);
        }
        if (perm.level === 'denied') {
            throw new CurrentPositionError('permission_denied', CURRENT_POSITION_MESSAGES.permission_denied);
        }
    }

    try {
        const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: options.enableHighAccuracy ?? true,
            timeout: options.timeout ?? 20_000,
            maximumAge: options.maximumAge ?? 0,
        });
        return {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
        };
    } catch (err) {
        throw classify(err);
    }
}
