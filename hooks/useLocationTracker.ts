import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { permissionService } from '../services/core/permissionService';
import { LocationService } from '../services/core/locationServicePlugin';
import { dataService } from '../services/dataService';
import { haversineDistance } from '../utils/geo';
import { logClientEvent } from '../services/core/clientDiagnosticsService';
import { networkSnapshot } from '../services/core/networkSnapshot';

/** Lembrete de otimização de bateria: no máximo 1x por dia. */
const BATTERY_REMINDER_KEY = 'siges_tracker_battery_reminder_at';
const BATTERY_REMINDER_MS = 1000 * 60 * 60 * 24;

/**
 * Se o Android ainda otimiza a bateria do SIGES, o rastreamento é encerrado em
 * segundo plano (principalmente Samsung/Xiaomi/Motorola). Avisa com atalho.
 */
const remindBatteryOptimization = async () => {
    try {
        const status = await LocationService.getStatus();
        if (status.ignoringBatteryOptimizations && status.backgroundLocation) return;
        const last = Number(localStorage.getItem(BATTERY_REMINDER_KEY) || 0);
        if (Date.now() - last < BATTERY_REMINDER_MS) return;
        localStorage.setItem(BATTERY_REMINDER_KEY, String(Date.now()));

        // Sem "Permitir o tempo todo" o rastreamento não volta sozinho após o
        // Android encerrar o serviço ou o celular reiniciar.
        if (!status.backgroundLocation) {
            toast.warning('Permita a localização "O tempo todo" para o rastreamento não ser interrompido.', {
                duration: 15000,
                action: {
                    label: 'Permitir',
                    onClick: () => { void permissionService.requestBackgroundLocationPermission(); },
                },
            });
            return;
        }

        toast.warning('A economia de bateria pode interromper o rastreamento. Em Ajustar, escolha o SIGES e marque "Não otimizar".', {
            duration: 15000,
            action: {
                label: 'Ajustar',
                onClick: () => { void permissionService.openBatteryOptimizationSettings(); },
            },
        });
    } catch {
        // plugin antigo (APK sem getStatus) — ignora
    }
};


/** Minimum interval between Supabase writes for the liveness heartbeat, in seconds. */
const HEARTBEAT_MIN_SECONDS = 30;
/** How often we re-check that the watcher is alive (and re-create it if not), in ms. */
const WATCHDOG_INTERVAL_MS = 60_000;
/** Backoff para voltar do GPS da WebView ao serviço nativo após falha. */
const NATIVE_RETRY_MIN_MS = 60_000;
const NATIVE_RETRY_MAX_MS = 10 * 60_000;
/** Espera antes de revogar o token de um serviço parado (um reinício cancela). */
const REVOKE_DELAY_MS = 20_000;
/** Distance filter in meters — triggers a location write if user moves this much. */
const DISTANCE_FILTER_M = 50;

/** URL base do Supabase (lida das variáveis de ambiente em build-time) */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type BlockReason = null | 'permission_denied' | 'location_services_disabled' | 'watcher_failed' | 'background_required';

/**
 * Hook that tracks user location in background (works even when app is minimized/screen locked).
 * Updates users_tracker (latitude, longitude, tracker_heartbeat_at, tracked_at
 * and tracker_accuracy) on each accepted position update.
 *
 * On Android 10+ the permission flow is split into two steps:
 *   1) this hook auto-requests foreground location on first run;
 *   2) the UI must surface a "Permitir sempre" button that calls
 *      `permissionService.requestBackgroundLocationPermission()` in response to
 *      a direct user action — Android refuses the background prompt otherwise.
 *
 * @param userId - Internal user ID (BigInt string from users.id)
 * @param trackerIntervalSeconds - Interval in seconds (from users.tracker_interval_seconds).
 *   Pass 0 or null to disable. Used as a MINIMUM write-interval for the liveness heartbeat;
 *   movement is controlled by NATIVE_DISTANCE_FILTER_M on native or watchPosition on web.
 * @param retryCount - Increment to force a re-check of the watcher (used by the
 *   "Tentar Novamente" button on LocationBlockedScreen).
 * @param hasOpenVisit - Whether the user has an active visit (keeps tracking even if unavailable).
 * @param isAvailable - Whether the user is available. When false and no open visit, tracking is paused.
 * @param shiftStart - users.shift_start ("HH:mm[:ss]"). No Android, fora do expediente e sem visita
 *   aberta o serviço nativo pausa sozinho (cfg_app.tracker_config.shift_only), mesmo com o app fechado.
 * @param shiftEnd - users.shift_end ("HH:mm[:ss]").
 * @param isTeamLeader - users.is_team_leader. Política (nov/2026): SÓ líderes de equipe são
 *   rastreados; para os demais o serviço nativo é desligado e nada é coletado.
 */
export function useLocationTracker(
    userId: string | undefined,
    trackerIntervalSeconds: number | null | undefined,
    retryCount: number = 0,
    hasOpenVisit: boolean = false,
    isAvailable: boolean = true,
    shiftStart?: string | null,
    shiftEnd?: string | null,
    isTeamLeader?: boolean
) {
    const watcherIdRef = useRef<string | null>(null);
    const webWatchIdRef = useRef<number | null>(null);
    const lastWriteAtRef = useRef<number>(0);
    const lastPosRef = useRef<{lat: number, lng: number} | null>(null);
    const heartbeatTimerRef = useRef<number | null>(null);
    const watchdogRef = useRef<number | null>(null);
    // Parada do serviço nativo em andamento (o novo start espera terminar, senão o
    // stop atrasado derruba o serviço recém-ligado) e revogação de token adiada.
    const stopChainRef = useRef<Promise<void>>(Promise.resolve());
    const pendingRevokeRef = useRef<number | null>(null);
    const [blockReason, setBlockReason] = useState<BlockReason>(null);

    const isLocationBlocked = blockReason !== null;

    useEffect(() => {


        if (!userId) {
            console.warn('[LocationTracker] Not started: userId missing');
            return;
        }

        // Só líderes de equipe são rastreados. Desliga ATIVAMENTE o serviço nativo:
        // ele pode estar rodando de antes (restaurado no boot ou de quando era líder).
        if (!isTeamLeader) {
            setBlockReason(null);
            if (Capacitor.isNativePlatform()) {
                void LocationService.stop()
                    .then(() => dataService.revokeTrackerToken())
                    .catch(() => undefined);
            }
            return;
        }

        if (!trackerIntervalSeconds || trackerIntervalSeconds <= 0) {
            console.warn('[LocationTracker] Not started: trackerIntervalSeconds invalid →', trackerIntervalSeconds);
            return;
        }

        if (!isAvailable && !hasOpenVisit) {
            return;
        }

        const intervalSeconds = Math.max(trackerIntervalSeconds, HEARTBEAT_MIN_SECONDS);

        let cancelled = false;
        // Evita start() simultâneos (efeito, watchdog e visibilitychange) criarem
        // dois watchers antes de watcherIdRef/webWatchIdRef serem preenchidos.
        let starting = false;
        // Fallback para o GPS da WebView (token/serviço nativo falharam): o serviço
        // nativo é retentado com backoff, senão o rastreamento fica só com o app aberto.
        let nativeFallback = false;
        let nativeRetryDelayMs = NATIVE_RETRY_MIN_MS;
        let nativeNextRetryAt = 0;

        const stopAll = async () => {
            if (watcherIdRef.current === 'native') {
                watcherIdRef.current = null;
                logClientEvent('error', 'Rastreamento: serviço nativo parado (efeito reiniciado ou encerrado)', {
                    extra: { stage: 'native_stop', level: 'info', hasOpenVisit, isAvailable, isTeamLeader, ...networkSnapshot() },
                });
                stopChainRef.current = stopChainRef.current
                    .then(() => LocationService.stop())
                    .catch(err => console.warn('[LocationTracker] Failed to stop native service:', err))
                    .then(() => undefined);
                // O token NÃO é revogado na hora: revoke e issue atuam no aparelho todo e,
                // ao iniciar/encerrar uma visita (o efeito reinicia), a revogação atrasada
                // podia cair em cima do token recém-emitido → 'invalid' → serviço desligado.
                // Reiniciando, o novo start cancela este timer (emitir já revoga o anterior).
                if (pendingRevokeRef.current !== null) window.clearTimeout(pendingRevokeRef.current);
                pendingRevokeRef.current = window.setTimeout(() => {
                    pendingRevokeRef.current = null;
                    void dataService.revokeTrackerToken().catch(() => undefined);
                }, REVOKE_DELAY_MS);
            }
            if (webWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(webWatchIdRef.current);
                webWatchIdRef.current = null;
            }
            if (heartbeatTimerRef.current !== null) {
                window.clearInterval(heartbeatTimerRef.current);
                heartbeatTimerRef.current = null;
            }
        };

        const persistLocation = async (
            latitude: number,
            longitude: number,
            accuracy: number | null,
            triggerReason: 'time' | 'distance' | 'heartbeat' = 'time'
        ) => {
            try {
                await dataService.updateUserLocation(userId, latitude, longitude, accuracy);
                lastWriteAtRef.current = Date.now();
                lastPosRef.current = { lat: latitude, lng: longitude };
            } catch (err) {
                // Sem rede/RLS: não deixa a promise rejeitar sem tratamento. A próxima
                // leitura tenta de novo (lastWriteAtRef não avançou).
                const message = err instanceof Error ? err.message : String(err);
                console.warn('[LocationTracker] Falha ao gravar posição:', message);
                logClientEvent('error', `Rastreamento: falha ao gravar posição — ${message}`, {
                    extra: { stage: 'persist_location', triggerReason },
                });
            }
        };

        const shouldWrite = (newLat: number, newLng: number): { write: boolean; reason: 'time' | 'distance' | null } => {
            const now = Date.now();
            const elapsed = (now - lastWriteAtRef.current) / 1000;
            
            // 1. Time-based: Se passou o tempo do intervalo (ex: 60s), devemos enviar
            if (lastWriteAtRef.current === 0 || elapsed >= intervalSeconds) {
                return { write: true, reason: 'time' };
            }

            // 2. Distance-based: Se o usuário andou mais que X metros, enviamos para manter a rota fiel
            if (lastPosRef.current) {
                const distance = haversineDistance(
                    lastPosRef.current.lat,
                    lastPosRef.current.lng,
                    newLat,
                    newLng
                );
                if (distance >= DISTANCE_FILTER_M) {
                    return { write: true, reason: 'distance' };
                }
            }

            return { write: false, reason: null };
        };

        const startHeartbeat = () => {
            if (heartbeatTimerRef.current !== null) return;
            heartbeatTimerRef.current = window.setInterval(async () => {
                // Heartbeat: refresh tracker_heartbeat_at even without movement so the
                // server can detect dead trackers. Only useful if we already have a fix,
                // so we read the last known position from the last write.
                if (lastWriteAtRef.current === 0 || !lastPosRef.current) return;
                
                const elapsed = (Date.now() - lastWriteAtRef.current) / 1000;
                if (elapsed < intervalSeconds) return;

                // Envia a última posição conhecida como heartbeat
                await persistLocation(
                    lastPosRef.current.lat,
                    lastPosRef.current.lng,
                    null,
                    'heartbeat'
                );
            }, intervalSeconds * 1000);
        };

        /**
         * Falha que NÃO depende do usuário (servidor sem a função de token,
         * plugin nativo antigo, sistema recusou o serviço...): não bloqueia o app.
         * Registra a causa e rastreia pelo GPS da WebView enquanto o app estiver
         * aberto (mesmo caminho da versão web). Bloqueio fica só para permissão
         * negada / GPS desligado, que o usuário consegue resolver.
         */
        const fallbackToWebWatcher = (stage: 'token' | 'native_start', err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[LocationTracker] ${stage} failed, falling back to WebView GPS:`, err);
            logClientEvent('error', `Rastreamento: falha em ${stage} — ${message}`, {
                stack: err instanceof Error ? err.stack : undefined,
                extra: { stage, fallback: 'web_watcher', retryInMs: nativeRetryDelayMs, ...networkSnapshot() },
            });
            if (cancelled) return;
            nativeFallback = true;
            nativeNextRetryAt = Date.now() + nativeRetryDelayMs;
            nativeRetryDelayMs = Math.min(nativeRetryDelayMs * 2, NATIVE_RETRY_MAX_MS);
            setBlockReason(null);
            if (webWatchIdRef.current === null) startWebWatcher();
        };

        /** Tenta voltar do GPS da WebView para o serviço nativo (só com o app visível). */
        const retryNative = async (force = false) => {
            if (cancelled || starting || !nativeFallback) return;
            if (document.visibilityState !== 'visible') return;
            if (!force && Date.now() < nativeNextRetryAt) return;
            starting = true;
            try {
                // Para o watcher web antes: se o nativo falhar de novo, o fallback recria.
                if (webWatchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(webWatchIdRef.current);
                    webWatchIdRef.current = null;
                }
                if (heartbeatTimerRef.current !== null) {
                    window.clearInterval(heartbeatTimerRef.current);
                    heartbeatTimerRef.current = null;
                }
                nativeFallback = false;
                await startNativeWatcher();
            } finally {
                starting = false;
            }
        };

        const startNativeWatcher = async () => {
            // Token por aparelho (fn_tracker_issue_token): o serviço nativo grava
            // a posição só via fn_tracker_report_location, nunca direto em users.
            // Espera a parada anterior (reinício por visita aberta/fechada) terminar e
            // cancela a revogação adiada: o token novo não pode ser revogado por ela.
            await stopChainRef.current;
            if (cancelled) return;
            if (pendingRevokeRef.current !== null) {
                window.clearTimeout(pendingRevokeRef.current);
                pendingRevokeRef.current = null;
            }
            let trackerToken: string;
            try {
                trackerToken = await dataService.issueTrackerToken();
            } catch (err) {
                // Ex.: migration 20261106_create_users_tracker_tokens.sql não aplicada.
                fallbackToWebWatcher('token', err);
                return;
            }
            if (cancelled) return;

            // Intervalos por atividade (cfg_app.tracker_config). Falha ou coluna
            // ausente → o APK usa os padrões dele (ver TrackerConfig.java).
            let trackerConfig: string | undefined;
            try {
                const appConfig: any = await dataService.getAppConfig();
                if (appConfig?.tracker_config) trackerConfig = JSON.stringify(appConfig.tracker_config);
            } catch {
                trackerConfig = undefined;
            }
            if (cancelled) return;

            try {
                await LocationService.start({
                    userId: userId!,
                    supabaseUrl: SUPABASE_URL,
                    supabaseKey: SUPABASE_KEY,
                    trackerToken,
                    intervalSeconds: intervalSeconds,
                    distanceMeters: DISTANCE_FILTER_M,
                    trackerConfig,
                    shiftStart: shiftStart || undefined,
                    shiftEnd: shiftEnd || undefined,
                    // Visita aberta: rastreia mesmo fora do expediente. Ao abrir/fechar a
                    // visita o efeito reinicia e o serviço recebe o valor novo.
                    ignoreShift: hasOpenVisit,
                });
                // 'native' é usado como sentinela para saber que o serviço está ativo
                watcherIdRef.current = 'native';
                logClientEvent('error', 'Rastreamento: serviço nativo iniciado', {
                    extra: { stage: 'native_started', level: 'info', hasOpenVisit, isAvailable, intervalSeconds, ...networkSnapshot() },
                });
                nativeFallback = false;
                nativeRetryDelayMs = NATIVE_RETRY_MIN_MS;
                void remindBatteryOptimization();
                // O heartbeat no lado JS é desabilitado no modo nativo —
                // o Java envia heartbeat via HTTP diretamente quando o tempo esgota.
            } catch (err: any) {
                fallbackToWebWatcher('native_start', err);
            }
        };

        const startWebWatcher = () => {
            if (!navigator.geolocation) {
                console.warn('[LocationTracker] Web: geolocation not supported — tracking disabled');
                return;
            }
            const id = navigator.geolocation.watchPosition(
                async (pos) => {
                    if (cancelled) return;
                    setBlockReason(null);
                    
                    const writeDecision = shouldWrite(pos.coords.latitude, pos.coords.longitude);
                    if (!writeDecision.write) return;
                    
                    await persistLocation(
                        pos.coords.latitude,
                        pos.coords.longitude,
                        pos.coords.accuracy ?? null,
                        writeDecision.reason as 'time' | 'distance'
                    );
                },
                (err) => {
                    if (cancelled) return;
                    console.warn('[LocationTracker] Web geolocation error:', err.code, err.message);
                    if (err.code === err.PERMISSION_DENIED) {
                        // O usuário consegue resolver: mostra a tela de bloqueio.
                        setBlockReason('permission_denied');
                        return;
                    }
                    // POSITION_UNAVAILABLE / TIMEOUT são transitórios: o watch segue
                    // tentando; só registra a causa para diagnóstico.
                    logClientEvent('error', `Rastreamento web: ${err.message}`, {
                        extra: { stage: 'web_watch', code: err.code },
                    });
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 5_000,
                    timeout: 30_000
                }
            );
            webWatchIdRef.current = id;
            startHeartbeat();
        };

        /**
         * Líder no Android precisa de "Permitir o tempo todo": sem ela o app fica
         * bloqueado (LocationBlockedScreen) até a permissão ser concedida. Roda também
         * com o rastreamento já ativo — a pessoa pode retirar a permissão nas configurações.
         * Retorna true se está tudo certo.
         */
        const checkBackgroundPermission = async (): Promise<boolean> => {
            if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return true;
            try {
                const status = await LocationService.getStatus();
                if (cancelled) return true;
                if (!status.backgroundLocation) {
                    setBlockReason('background_required');
                    return false;
                }
                setBlockReason(prev => (prev === 'background_required' ? null : prev));
                return true;
            } catch {
                return true; // APK antigo sem getStatus: não bloqueia
            }
        };

        const start = async () => {
            if (cancelled || starting) return;
            starting = true;
            try {
                await startInner();
            } finally {
                starting = false;
            }
        };

        const startInner = async () => {
            if (cancelled) return;
            if (watcherIdRef.current || webWatchIdRef.current !== null) {
                await checkBackgroundPermission();
                return;
            }

            const result = await permissionService.requestLocationPermission();
            if (cancelled) return;

            if (result.locationServicesDisabled) {
                console.warn('[LocationTracker] ⛔ System location services are OFF');
                setBlockReason('location_services_disabled');
                return;
            }
            if (result.level === 'denied') {
                console.warn('[LocationTracker] ⛔ Location permission denied');
                setBlockReason('permission_denied');
                return;
            }

            setBlockReason(null);
            // Sem "o tempo todo" o app fica bloqueado, mas o rastreamento já começa
            // (com o app aberto a permissão "durante o uso" basta).
            await checkBackgroundPermission();
            if (cancelled) return;

            if (Capacitor.isNativePlatform()) {
                // Android 12+ recusa startForegroundService com o app em segundo plano
                // ("mAllowStartForeground false"). Adia: o visibilitychange chama start().
                if (document.visibilityState !== 'visible') return;
                await startNativeWatcher();
            } else {
                startWebWatcher();
            }
        };

        const watchdog = () => {
            // If we *should* have a watcher but don't, try to restart it.
            // Also detects the "tracker died silently" case after a long sleep.
            if (cancelled) return;
            const hasWatcher = !!watcherIdRef.current || webWatchIdRef.current !== null;
            if (!hasWatcher) {
                start();
            }
        };

        void start();
        watchdogRef.current = window.setInterval(watchdog, WATCHDOG_INTERVAL_MS);

        // Re-check permissions / re-arm watcher when the app comes back to foreground.
        // On Android, the system may have killed the foreground service while we were
        // backgrounded; the watchdog will only re-arm if there's a 60s+ gap, so we also
        // force a re-check on visibility change for snappier recovery.
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                if (nativeFallback) void retryNative();
                else void start();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (watchdogRef.current !== null) {
                window.clearInterval(watchdogRef.current);
                watchdogRef.current = null;
            }
            stopAll();
        };
    }, [userId, trackerIntervalSeconds, retryCount, hasOpenVisit, isAvailable, shiftStart, shiftEnd, isTeamLeader]);

    return {
        isLocationBlocked,
        blockReason,
        /** Manually request the Android 10+ "Allow all the time" background permission.
         *  Call this from a dedicated button. */
        requestBackgroundPermission: permissionService.requestBackgroundLocationPermission
    };
}
