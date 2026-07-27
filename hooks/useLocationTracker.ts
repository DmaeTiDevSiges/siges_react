import { useEffect, useRef, useState } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { permissionService } from '../services/permissionService';
import { dataService } from '../services/dataService';
import { haversineDistance } from '../utils/geo';

/**
 * Plugin nativo Capacitor que controla o LocationForegroundService.java
 * Funciona mesmo com app minimizado ou fechado (verdadeiro Foreground Service Android).
 */
const LocationService = registerPlugin<{
    start(opts: {
        userId: string;
        supabaseUrl: string;
        supabaseKey: string;
        intervalSeconds: number;
        distanceMeters: number;
        hasOpenVisit: boolean;
    }): Promise<void>;
    stop(): Promise<void>;
}>('LocationService');


/** Minimum interval between Supabase writes for the liveness heartbeat, in seconds. */
const HEARTBEAT_MIN_SECONDS = 30;
/** How often we re-check that the watcher is alive (and re-create it if not), in ms. */
const WATCHDOG_INTERVAL_MS = 60_000;
/** Distance filter in meters — triggers a location write if user moves this much. */
const DISTANCE_FILTER_M = 50;

/** URL base do Supabase (lida das variáveis de ambiente em build-time) */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type BlockReason = null | 'permission_denied' | 'location_services_disabled' | 'watcher_failed';

/**
 * Hook that tracks user location in background (works even when app is minimized/screen locked).
 * Updates users.latitude, users.longitude, users.tracker_heartbeat_at, users.tracked_at 
 * and users.tracker_accuracy on each accepted position update.
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
 */
export function useLocationTracker(
    userId: string | undefined,
    trackerIntervalSeconds: number | null | undefined,
    retryCount: number = 0,
    hasOpenVisit: boolean = false,
    isAvailable: boolean = true
) {
    const watcherIdRef = useRef<string | null>(null);
    const webWatchIdRef = useRef<number | null>(null);
    const lastWriteAtRef = useRef<number>(0);
    const lastPosRef = useRef<{lat: number, lng: number} | null>(null);
    const heartbeatTimerRef = useRef<number | null>(null);
    const watchdogRef = useRef<number | null>(null);
    const [blockReason, setBlockReason] = useState<BlockReason>(null);

    const isLocationBlocked = blockReason !== null;

    useEffect(() => {


        if (!userId) {
            console.warn('[LocationTracker] Not started: userId missing');
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

        const stopAll = async () => {
            if (watcherIdRef.current === 'native') {
                try {
                    await LocationService.stop();

                } catch (err) {
                    console.warn('[LocationTracker] Failed to stop native service:', err);
                }
                watcherIdRef.current = null;
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
            await dataService.updateUserLocation(userId, latitude, longitude, accuracy);
            lastWriteAtRef.current = Date.now();
            lastPosRef.current = { lat: latitude, lng: longitude };
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

        const startNativeWatcher = async () => {
            try {
                await LocationService.start({
                    userId: userId!,
                    supabaseUrl: SUPABASE_URL,
                    supabaseKey: SUPABASE_KEY,
                    intervalSeconds: intervalSeconds,
                    distanceMeters: DISTANCE_FILTER_M,
                    hasOpenVisit: hasOpenVisit,
                });
                // 'native' é usado como sentinela para saber que o serviço está ativo
                watcherIdRef.current = 'native';
                // O heartbeat no lado JS é desabilitado no modo nativo —
                // o Java envia heartbeat via HTTP diretamente quando o tempo esgota.
            } catch (err: any) {
                console.error('[LocationTracker] Failed to start native service:', err);
                setBlockReason('watcher_failed');
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
                    console.warn('[LocationTracker] Web geolocation error (non-blocking):', err.message);
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

        const start = async () => {
            if (cancelled) return;
            if (watcherIdRef.current || webWatchIdRef.current !== null) return;

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

            if (Capacitor.isNativePlatform()) {
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

        start();
        watchdogRef.current = window.setInterval(watchdog, WATCHDOG_INTERVAL_MS);

        // Re-check permissions / re-arm watcher when the app comes back to foreground.
        // On Android, the system may have killed the foreground service while we were
        // backgrounded; the watchdog will only re-arm if there's a 60s+ gap, so we also
        // force a re-check on visibility change for snappier recovery.
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                start();
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
    }, [userId, trackerIntervalSeconds, retryCount, hasOpenVisit, isAvailable]);

    return {
        isLocationBlocked,
        blockReason,
        /** Manually request the Android 10+ "Allow all the time" background permission.
         *  Call this from a dedicated button. */
        requestBackgroundPermission: permissionService.requestBackgroundLocationPermission
    };
}
