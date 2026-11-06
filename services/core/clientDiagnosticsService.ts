/// <reference types="vite/client" />
// Diagnóstico de "app reinicia sozinho" (web) e "app fecha sozinho" (APK).
//
// Grava em public.logs_app_client_events (migration 20261106_...):
//   - erros JS não tratados, promises rejeitadas e erros do ErrorBoundary;
//   - recargas automáticas com o motivo (markReload antes do reload);
//   - reaberturas inesperadas: o app reabre sem ter sido fechado/minimizado
//     (APK: crash/OOM da WebView) ou depois de ir para segundo plano
//     (Android/navegador encerrou o processo/aba).
//
// Infraestrutura de bootstrap: importa o supabase direto (não passa pelo
// dataService) para poder ser usada em app/routes.tsx e no ErrorBoundary
// sem carregar a fachada inteira.
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

declare const __BUILD_ID__: string;

export type ClientEventType =
    | 'error'
    | 'unhandled_rejection'
    | 'boundary'
    | 'reload'
    | 'unexpected_restart'
    | 'restored_after_kill'
    | 'app_restored_result';

export type ReloadReason = 'chunk_error' | 'update' | 'error_boundary' | 'impersonation_end';

const SESSION_KEY = 'siges-diag-session';
const RELOAD_KEY = 'siges-diag-reload';
const QUEUE_KEY = 'siges-diag-queue';
const MAX_EVENTS_PER_SESSION = 25;
const DEDUPE_MS = 30_000;
const RESTART_WINDOW_MS = 1000 * 60 * 60 * 12; // reabertura "inesperada" só conta se a sessão anterior é recente
const BACKGROUND_KILL_WINDOW_MS = 1000 * 60 * 30;

const RELOAD_LABELS: Record<ReloadReason, string> = {
    chunk_error: 'falha ao baixar uma parte do app (deploy novo ou bloqueio do Cloudflare)',
    update: 'atualização do app',
    error_boundary: 'erro em uma tela',
    impersonation_end: 'fim da personificação de usuário',
};

interface SessionMarker {
    id: string;
    state: 'foreground' | 'background' | 'closed';
    at: number;
    screen?: string;
}

interface ReloadMarker {
    reason: ReloadReason;
    at: number;
    screen?: string;
    detail?: string;
}

interface QueuedEvent {
    event_type: ClientEventType;
    occurred_at: string;
    message: string | null;
    stack: string | null;
    screen: string | null;
    url: string | null;
    app_version: string | null;
    platform: string;
    user_agent: string | null;
    session_id: string;
    extra: Record<string, unknown> | null;
}

let initialized = false;
let sessionId = '';
let currentScreen = '';
let sentThisSession = 0;
let pendingReloadNotice: string | null = null;
const recentMessages = new Map<string, number>();

const safeGet = <T>(key: string): T | null => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
};

const safeSet = (key: string, value: unknown) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // storage cheio/indisponível: diagnóstico é best-effort
    }
};

const safeRemove = (key: string) => {
    try {
        localStorage.removeItem(key);
    } catch { }
};

const truncate = (value: unknown, max: number): string | null => {
    if (value == null) return null;
    const text = String(value);
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const appVersion = (): string | null => {
    try {
        return typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : null;
    } catch {
        return null;
    }
};

const screenName = () => currentScreen || (() => {
    try { return localStorage.getItem('app_active_tab') || ''; } catch { return ''; }
})();

const writeSession = (state: SessionMarker['state']) => {
    if (!sessionId) return;
    safeSet(SESSION_KEY, { id: sessionId, state, at: Date.now(), screen: screenName() } satisfies SessionMarker);
};

const buildEvent = (
    type: ClientEventType,
    message: unknown,
    options: { stack?: unknown; extra?: Record<string, unknown>; screen?: string; occurredAt?: number } = {}
): QueuedEvent => ({
    event_type: type,
    occurred_at: new Date(options.occurredAt ?? Date.now()).toISOString(),
    message: truncate(message, 2000),
    stack: truncate(options.stack, 8000),
    screen: truncate(options.screen ?? screenName(), 200),
    url: truncate(typeof window !== 'undefined' ? window.location.href : null, 1000),
    app_version: truncate(appVersion(), 100),
    platform: Capacitor.getPlatform(),
    user_agent: truncate(typeof navigator !== 'undefined' ? navigator.userAgent : null, 500),
    session_id: sessionId || 'boot',
    extra: options.extra ?? null,
});

const enqueue = (event: QueuedEvent) => {
    const queue = safeGet<QueuedEvent[]>(QUEUE_KEY) || [];
    queue.push(event);
    safeSet(QUEUE_KEY, queue.slice(-20));
};

const send = async (event: QueuedEvent): Promise<boolean> => {
    if (import.meta.env.DEV) {
        console.info('[diagnostics]', event.event_type, event.message, event.extra || '');
        return true;
    }
    try {
        const { error } = await supabase.from('logs_app_client_events').insert(event);
        return !error;
    } catch {
        return false;
    }
};

const flushQueue = async () => {
    const queue = safeGet<QueuedEvent[]>(QUEUE_KEY);
    if (!queue?.length) return;
    safeRemove(QUEUE_KEY);
    for (const event of queue) {
        if (!(await send(event))) enqueue(event);
    }
};

/** Registra um evento de diagnóstico (best-effort, nunca lança erro). */
export const logClientEvent = (
    type: ClientEventType,
    message: unknown,
    options: { stack?: unknown; extra?: Record<string, unknown>; screen?: string; occurredAt?: number } = {}
) => {
    try {
        if (sentThisSession >= MAX_EVENTS_PER_SESSION) return;
        const key = `${type}:${String(message).slice(0, 200)}`;
        const last = recentMessages.get(key);
        if (last && Date.now() - last < DEDUPE_MS) return;
        recentMessages.set(key, Date.now());
        sentThisSession++;

        const event = buildEvent(type, message, options);
        void send(event).then(ok => { if (!ok) enqueue(event); });
    } catch { }
};

/**
 * Chamar ANTES de qualquer recarga automática. Grava o motivo para ser
 * registrado e exibido quando o app reabrir, e fecha a sessão atual para
 * a recarga não ser contada como "reabertura inesperada".
 */
export const markReload = (reason: ReloadReason, detail?: unknown) => {
    safeSet(RELOAD_KEY, {
        reason,
        at: Date.now(),
        screen: screenName(),
        detail: truncate(detail, 500) ?? undefined,
    } satisfies ReloadMarker);
    writeSession('closed');
};

/** Tela atual (chamado pelo App quando currentScreen muda). */
export const setDiagnosticsScreen = (screen: string) => {
    currentScreen = screen;
    if (initialized && document.visibilityState === 'visible') writeSession('foreground');
};

/** Motivo da última recarga automática, uma única vez (para avisar o usuário). */
export const consumeReloadNotice = (): string | null => {
    const notice = pendingReloadNotice;
    pendingReloadNotice = null;
    return notice;
};

const errorMessage = (value: unknown): { message: string; stack?: string } => {
    if (value instanceof Error) return { message: `${value.name}: ${value.message}`, stack: value.stack };
    if (typeof value === 'string') return { message: value };
    try {
        return { message: JSON.stringify(value) };
    } catch {
        return { message: String(value) };
    }
};

// Ruído conhecido que não indica falha do app.
const IGNORED_ERRORS = [
    'ResizeObserver loop',
    'Script error.',
];

const inspectPreviousSession = () => {
    const now = Date.now();
    const reload = safeGet<ReloadMarker>(RELOAD_KEY);
    const previous = safeGet<SessionMarker>(SESSION_KEY);
    safeRemove(RELOAD_KEY);

    if (reload && now - reload.at < 1000 * 60 * 5) {
        logClientEvent('reload', reload.reason, {
            screen: reload.screen,
            occurredAt: reload.at,
            extra: reload.detail ? { detail: reload.detail } : undefined,
        });
        if (reload.reason !== 'impersonation_end') {
            pendingReloadNotice = RELOAD_LABELS[reload.reason];
        }
        return;
    }

    if (!previous) return;
    const age = now - previous.at;

    if (previous.state === 'foreground' && age < RESTART_WINDOW_MS) {
        // Sessão anterior estava em primeiro plano e não foi fechada nem minimizada.
        logClientEvent('unexpected_restart', 'App reabriu sem fechamento normal', {
            screen: previous.screen,
            occurredAt: previous.at,
            extra: { previousSessionId: previous.id, secondsSinceLastSeen: Math.round(age / 1000) },
        });
    } else if (previous.state === 'background' && age < BACKGROUND_KILL_WINDOW_MS) {
        logClientEvent('restored_after_kill', 'App reabriu do zero após ir para segundo plano', {
            screen: previous.screen,
            occurredAt: previous.at,
            extra: { previousSessionId: previous.id, secondsInBackground: Math.round(age / 1000) },
        });
    }
};

/** Inicializa a captura (chamar uma vez no bootstrap, antes do render). */
export const initClientDiagnostics = () => {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;
    sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    try {
        inspectPreviousSession();
    } catch { }
    writeSession(document.visibilityState === 'hidden' ? 'background' : 'foreground');
    void flushQueue();

    window.addEventListener('error', (event) => {
        // Falha ao carregar <script>/<link> chega como Event sem message.
        if (!event.message && event.target && event.target !== window) {
            const target = event.target as HTMLScriptElement | HTMLLinkElement;
            const src = (target as HTMLScriptElement).src || (target as HTMLLinkElement).href;
            if (src) logClientEvent('error', `Falha ao carregar recurso: ${src}`);
            return;
        }
        if (IGNORED_ERRORS.some(ignored => event.message?.includes(ignored))) return;
        const { message, stack } = errorMessage(event.error ?? event.message);
        logClientEvent('error', message, {
            stack,
            extra: event.filename ? { source: `${event.filename}:${event.lineno}:${event.colno}` } : undefined,
        });
    }, true);

    window.addEventListener('unhandledrejection', (event) => {
        const { message, stack } = errorMessage(event.reason);
        if (IGNORED_ERRORS.some(ignored => message.includes(ignored))) return;
        logClientEvent('unhandled_rejection', message, { stack });
    });

    document.addEventListener('visibilitychange', () => {
        writeSession(document.visibilityState === 'hidden' ? 'background' : 'foreground');
    });
    window.addEventListener('pagehide', () => writeSession('closed'));
    window.addEventListener('online', () => void flushQueue());

    if (Capacitor.isNativePlatform()) {
        void import('@capacitor/app').then(({ App }) => {
            App.addListener('appStateChange', ({ isActive }) => {
                writeSession(isActive ? 'foreground' : 'background');
                if (isActive) void flushQueue();
            });
            App.addListener('appRestoredResult', (result) => {
                logClientEvent('app_restored_result', `${result.pluginId}.${result.methodName}`, {
                    extra: { success: result.success, error: result.error?.message },
                });
            });
        }).catch(() => undefined);
    }
};
