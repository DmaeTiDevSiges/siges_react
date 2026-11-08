import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { createTrackingFetch } from '../offline/networkFailures';
import { isOfflineSupported, OFFLINE_READ_TIMEOUT_MS } from '../offline/offlineConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Check your .env file.');
}

let url = supabaseUrl || 'https://placeholder.supabase.co';
if (url && !url.startsWith('http')) {
    url = `https://${url}`;
}
// Remove trailing slash to avoid double-slash in constructed URLs (e.g. //realtime/v1/websocket)
url = url.replace(/\/+$/, '');

// Custom Storage implementation for Capacitor/Native environment
// Uses SharedPreferences on Android and UserDefaults on iOS, which persists reliably across app updates
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!Capacitor.isNativePlatform()) {
      return window.localStorage.getItem(key);
    }
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      window.localStorage.setItem(key, value);
      return;
    }
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      window.localStorage.removeItem(key);
      return;
    }
    await Preferences.remove({ key });
  },
};

// Use a global variable to persist the client across HMR reloads in development
const globalForSupabase = globalThis as unknown as {
    supabase: any
};

export const supabase = globalForSupabase.supabase ?? createClient(
    url,
    supabaseAnonKey || 'placeholder',
    {
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        },
        auth: {
            storage: customStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        },
        global: {
            headers: {
                'X-Client-Info': 'siges-app'
            },
            // Modo offline: conta falhas de rede (o cache de leitura não grava
            // por cima com o [] de uma queda) e, com o modo ligado, limita as
            // leituras REST a 30 s (sinal "conectado" sem internet real).
            fetch: createTrackingFetch((input, init) => fetch(input, init), {
                readTimeoutMs: () => (isOfflineSupported() ? OFFLINE_READ_TIMEOUT_MS : null),
            }),
        }
    }
);

if (import.meta.env.DEV) {
    globalForSupabase.supabase = supabase;
}

/**
 * Modo offline: id do usuário da sessão SALVA no aparelho, sem ir à rede.
 * (getSession() tentaria renovar um token vencido — offline isso falha.)
 * Mesma chave que o supabase-js usa: sb-<1º trecho do host>-auth-token.
 */
const SESSION_STORAGE_KEY = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;

export const readStoredSessionUserId = async (): Promise<string | null> => {
    try {
        const raw = await customStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const session = parsed?.currentSession ?? parsed; // formato antigo/novo
        return session?.user?.id ?? null;
    } catch {
        return null;
    }
};

