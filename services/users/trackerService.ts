import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '../core/supabase';

// Tokens de rastreamento por aparelho (migration 20261106_create_users_tracker_tokens.sql).
// O serviço nativo envia a posição com esse token para fn_tracker_report_location,
// em vez de escrever direto em public.users com a chave anon.

const DEVICE_ID_KEY = 'siges_tracker_device_id';

const randomId = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};

export const trackerService = {
    /** Identificador estável deste aparelho (gerado uma vez e guardado). */
    async getTrackerDeviceId(): Promise<string> {
        const { value } = await Preferences.get({ key: DEVICE_ID_KEY });
        if (value && value.length >= 8) return value;
        const id = randomId();
        await Preferences.set({ key: DEVICE_ID_KEY, value: id });
        return id;
    },

    /** Emite um token novo para este aparelho (revoga o anterior do mesmo aparelho). */
    async issueTrackerToken(): Promise<string> {
        const deviceId = await this.getTrackerDeviceId();
        const deviceInfo = `${Capacitor.getPlatform()} · ${navigator.userAgent}`.slice(0, 300);
        const { data, error } = await supabase.rpc('fn_tracker_issue_token', {
            p_device_id: deviceId,
            p_device_info: deviceInfo,
        });
        if (error) throw new Error(error.message);
        if (typeof data !== 'string' || data.length !== 64) {
            throw new Error('Token de rastreamento inválido');
        }
        return data;
    },

    /** Revoga os tokens deste aparelho (rastreamento pausado ou logout). */
    async revokeTrackerToken(): Promise<void> {
        const deviceId = await this.getTrackerDeviceId();
        const { error } = await supabase.rpc('fn_tracker_revoke_token', { p_device_id: deviceId });
        if (error) console.warn('[trackerService] Falha ao revogar token:', error.message);
    },
};
