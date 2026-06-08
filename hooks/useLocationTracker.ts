import { useEffect, useRef, useState } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';
// TEMPORARILY DISABLED - background-geolocation plugin is not working
// import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { dataService } from '../services/dataService';
import { permissionService } from '../services/permissionService';

// TEMPORARILY DISABLED - background-geolocation plugin is not working
// const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
//     'BackgroundGeolocation'
// );

/** Minimum interval between Supabase writes for the liveness heartbeat, in seconds. */
const HEARTBEAT_MIN_SECONDS = 30;
/** How often we re-check that the watcher is alive (and re-create it if not), in ms. */
const WATCHDOG_INTERVAL_MS = 60_000;
/** Distance filter in meters — primary throttle for native (saves battery). */
const NATIVE_DISTANCE_FILTER_M = 100;

type BlockReason = null | 'permission_denied' | 'location_services_disabled' | 'watcher_failed';

/**
 * Hook that tracks user location in background (works even when app is minimized/screen locked).
 * Updates users.latitude, users.longitude, users.tracker_heartbeat_at and users.tracker_accuracy
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
 */
export function useLocationTracker(
    userId: string | undefined,
    trackerIntervalSeconds: number | null | undefined,
    retryCount: number = 0
) {
    const watcherIdRef = useRef<string | null>(null);
    const webWatchIdRef = useRef<number | null>(null);
    const lastWriteAtRef = useRef<number>(0);
    const heartbeatTimerRef = useRef<number | null>(null);
    const watchdogRef = useRef<number | null>(null);
    const [blockReason, setBlockReason] = useState<BlockReason>(null);

    const isLocationBlocked = blockReason !== null;

    useEffect(() => {
        console.log('[LocationTracker] Init check:', { userId, trackerIntervalSeconds, retryCount });

        if (!userId) {
            console.warn('[LocationTracker] Not started: userId missing');
            return;
        }

        if (!trackerIntervalSeconds || trackerIntervalSeconds <= 0) {
            console.warn('[LocationTracker] Not started: trackerIntervalSeconds invalid →', trackerIntervalSeconds);
            return;
        }

        const intervalSeconds = Math.max(trackerIntervalSeconds, HEARTBEAT_MIN_SECONDS);

        let cancelled = false;

        const stopAll = async () => {
            // TEMPORARILY DISABLED - background-geolocation plugin is not working
            if (watcherIdRef.current) {
                try {
                    // await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
                    console.warn('[LocationTracker] BackgroundGeolocation watcher removal disabled');
                } catch (err) {
                    console.warn('[LocationTracker] Failed to remove native watcher:', err);
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
            accuracy: number | null
        ) => {
            await dataService.updateUserLocation(userId, latitude, longitude, accuracy);
            lastWriteAtRef.current = Date.now();
            console.log(
                `%c[LocationTracker] 📍 Location updated`,
                'color: #22c55e; font-weight: bold',
                `\nUser: ${userId}`,
                `\nLat: ${latitude}`,
                `\nLng: ${longitude}`,
                `\nAccuracy: ${accuracy ?? 'n/a'}m`,
                `\nTime: ${new Date().toLocaleTimeString('pt-BR')}`
            );
        };

        const shouldWrite = () => {
            const now = Date.now();
            const elapsed = (now - lastWriteAtRef.current) / 1000;
            return lastWriteAtRef.current === 0 || elapsed >= intervalSeconds;
        };

        const startHeartbeat = () => {
            if (heartbeatTimerRef.current !== null) return;
            heartbeatTimerRef.current = window.setInterval(async () => {
                // Heartbeat: refresh tracker_heartbeat_at even without movement so the
                // server can detect dead trackers. Only useful if we already have a fix,
                // so we read the last known position from the last write.
                if (lastWriteAtRef.current === 0) return;
                if (Date.now() - lastWriteAtRef.current < intervalSeconds * 1000) return;
                // No movement and not enough time elapsed → skip; will fire on next move.
            }, intervalSeconds * 1000);
        };

        const startNativeWatcher = async () => {
            // TEMPORARILY DISABLED - background-geolocation plugin is not working
            console.warn('[LocationTracker] startNativeWatcher is temporarily disabled');
            setBlockReason('watcher_failed');
        };

        const startWebWatcher = () => {
            if (!navigator.geolocation) {
                setBlockReason('location_services_disabled');
                return;
            }
            const id = navigator.geolocation.watchPosition(
                async (pos) => {
                    if (cancelled) return;
                    setBlockReason(null);
                    if (!shouldWrite()) return;
                    await persistLocation(
                        pos.coords.latitude,
                        pos.coords.longitude,
                        pos.coords.accuracy ?? null
                    );
                },
                (err) => {
                    console.warn('[LocationTracker] web geolocation error:', err.message);
                    if (err.code === err.PERMISSION_DENIED) {
                        setBlockReason('permission_denied');
                    } else if (err.code === err.POSITION_UNAVAILABLE) {
                        setBlockReason('location_services_disabled');
                    } else {
                        setBlockReason('watcher_failed');
                    }
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

            // TEMPORARILY DISABLED - always use web watcher since background-geolocation plugin is not working
            // if (Capacitor.isNativePlatform()) {
            //     await startNativeWatcher();
            // } else {
            //     startWebWatcher();
            // }
            startWebWatcher();
        };

        const watchdog = () => {
            // If we *should* have a watcher but don't, try to restart it.
            // Also detects the "tracker died silently" case after a long sleep.
            if (cancelled) return;
            const hasWatcher = !!watcherIdRef.current || webWatchIdRef.current !== null;
            if (!hasWatcher) {
                console.log('[LocationTracker] 🔁 Watchdog: no active watcher, restarting...');
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
                console.log('[LocationTracker] 🔄 App returned to foreground, re-checking...');
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
    }, [userId, trackerIntervalSeconds, retryCount]);

    return {
        isLocationBlocked,
        blockReason,
        /** Manually request the Android 10+ "Allow all the time" background permission.
         *  Call this from a dedicated button. */
        requestBackgroundPermission: permissionService.requestBackgroundLocationPermission
    };
}
