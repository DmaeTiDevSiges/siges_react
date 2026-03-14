import { createClient } from '@supabase/supabase-js';

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

export const supabase = createClient(
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
