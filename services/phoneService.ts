import { registerPlugin, Capacitor } from '@capacitor/core';
import { dataService } from './dataService';

const PhoneInfo = registerPlugin<{
    getPhoneNumber(): Promise<{ number: string | null; error: string | null }>;
    checkPermissions(): Promise<{ phoneState: string }>;
    requestPermissions(): Promise<{ phoneState: string }>;
}>('PhoneInfo');

/**
 * Reads the device phone number and compares with the database.
 * Only updates if there's a divergence.
 */
export async function syncPhoneNumber(userId: string, currentMobile?: string): Promise<{ updated: boolean; number?: string; error?: string }> {
    if (Capacitor.getPlatform() !== 'android') {
        return { updated: false, error: 'Detecção de telefone só disponível no Android' };
    }

    try {
        // Explicitly request permission from JS side
        const perm = await PhoneInfo.checkPermissions();
        if (perm.phoneState !== 'granted') {
            const req = await PhoneInfo.requestPermissions();
            if (req.phoneState !== 'granted') {
                return { updated: false, error: 'Permissão de telefone não concedida pelo usuário' };
            }
        }

        const result = await PhoneInfo.getPhoneNumber();

        if (result.error || !result.number) {
            // Device can't read number — not an error if DB already has one
            if (currentMobile && currentMobile.replace(/\D/g, '').length >= 10) {
                return { updated: false, number: undefined, error: undefined };
            }
            return { updated: false, error: result.error || 'Número não disponível no dispositivo' };
        }

        const deviceClean = result.number.replace(/\D/g, '');
        const dbClean = (currentMobile || '').replace(/\D/g, '');

        if (deviceClean.length < 10) {
            return { updated: false, number: result.number, error: 'Número muito curto para ser válido' };
        }

        if (deviceClean === dbClean) {
            return { updated: false, number: result.number };
        }

        await dataService.updatePhoneNumber(userId, deviceClean, result.number);

        return { updated: true, number: result.number };
    } catch (e: any) {
        return { updated: false, error: e?.message || 'Erro desconhecido' };
    }
}
