import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '../core/supabase';
import { logClientEvent } from '../core/clientDiagnosticsService';
import { networkSnapshot } from '../core/networkSnapshot';

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
        // "Failed to fetch" = falha de rede passageira (sinal fraco, WebView acordando):
        // tenta mais 2 vezes antes de o rastreamento cair para o GPS da WebView.
        let data: unknown = null;
        let lastError: Error | null = null;
        const attempts: { ms: number; err: string }[] = [];
        for (let attempt = 0; attempt < 3; attempt++) {
            if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
            const startedAt = Date.now();
            try {
                const res = await supabase.rpc('fn_tracker_issue_token', {
                    p_device_id: deviceId,
                    p_device_info: deviceInfo,
                });
                if (res.error) throw new Error(res.error.message);
                data = res.data;
                lastError = null;
                break;
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                attempts.push({ ms: Date.now() - startedAt, err: lastError.message.slice(0, 80) });
            }
        }
        if (lastError) {
            // Registra o retrato da rede e as tentativas: separa falha do aparelho
            // (online=false, sinal fraco) de falha do servidor (online=true em vários aparelhos).
            logClientEvent('error', `Rastreamento: token falhou após ${attempts.length} tentativas — ${lastError.message}`, {
                extra: { stage: 'token_attempts', attempts, ...networkSnapshot() },
            });
            throw lastError;
        }
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
