import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Check your .env file.');
}

// For Easypanel/self-hosted Supabase, we need to configure WebSocket properly
const isEasypanel = supabaseUrl?.includes('easypanel.host');


let url = supabaseUrl || 'https://placeholder.supabase.co';
if (url && !url.startsWith('http')) {
    url = `https://${url}`;
}

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
        realtime: isEasypanel ? {
            // For Easypanel, use wss:// protocol with the same host
            // Easypanel typically routes WebSocket through the same URL
            params: {
                eventsPerSecond: 10
            }
        } : {
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
            }
        }
    }
);

if (import.meta.env.DEV) {
    globalForSupabase.supabase = supabase;
}
