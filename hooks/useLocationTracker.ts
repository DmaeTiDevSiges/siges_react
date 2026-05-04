import { useEffect, useRef, useState } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { dataService } from '../services/dataService';
import { permissionService } from '../services/permissionService';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
    'BackgroundGeolocation'
);

/**
 * Hook that tracks user location in background (works even when app is minimized/screen locked).
 * Updates users.latitude, users.longitude and users.tracker_at at each position update.
 *
 * @param userId - Internal user ID (BigInt string from users.id)
 * @param trackerIntervalSeconds - Interval in seconds (from users.tracker_interval_seconds). Pass 0 or null to disable.
 */
export function useLocationTracker(
    userId: string | undefined,
    trackerIntervalSeconds: number | null | undefined,
    retryCount: number = 0
) {
    const watcherIdRef = useRef<string | null>(null);
    const [isLocationBlocked, setIsLocationBlocked] = useState(false);

    useEffect(() => {
        console.log('[LocationTracker] 🔍 Init check:', { userId, trackerIntervalSeconds, retryCount });

        if (!userId) {
            console.warn('[LocationTracker] ⛔ Não iniciado: userId ausente');
            setIsLocationBlocked(false);
            return;
        }

        if (!trackerIntervalSeconds || trackerIntervalSeconds <= 0) {
            console.warn('[LocationTracker] ⛔ Não iniciado: trackerIntervalSeconds inválido →', trackerIntervalSeconds);
            setIsLocationBlocked(false);
            return;
        }

        console.log(`[LocationTracker] ✅ Iniciando tracker para user ${userId} — intervalo: ${trackerIntervalSeconds}s`);
        let cancelled = false;

        const checkAndStart = async () => {
            if (cancelled) return;

            const granted = await permissionService.requestLocationPermission();
            if (!granted) {
                if (Capacitor.isNativePlatform() && !cancelled) {
                    setIsLocationBlocked(true);
                }
                console.warn('[LocationTracker] ⛔ Permissão de localização negada');
                return;
            }

            if (cancelled) return;
            setIsLocationBlocked(false);

            if (watcherIdRef.current) return; // Alreay running

            if (Capacitor.isNativePlatform()) {
                // Native: OS-level watcher survives app minimization and screen lock.
                // The watcher fires on every GPS update (can be every second),
                // so we throttle the Supabase write using trackerIntervalSeconds.
                let lastUpdateTime = 0;

                try {
                    const id = await BackgroundGeolocation.addWatcher(
                        {
                            backgroundMessage: 'Atualizando sua localização...',
                            backgroundTitle: 'Siges — Rastreamento ativo',
                            requestPermissions: true,
                            stale: false,
                            distanceFilter: 0
                        },
                        async (position, error) => {
                            if (error || !position) {
                                console.warn('[LocationTracker] watcher error:', error?.message);
                                // If it's a permission error, block access
                                if (error?.message?.toLowerCase().includes('permission')) {
                                    setIsLocationBlocked(true);
                                }
                                return;
                            }

                            const now = Date.now();
                            const elapsed = (now - lastUpdateTime) / 1000;
                            if (lastUpdateTime > 0 && elapsed < trackerIntervalSeconds) {
                                // Interval not reached yet — skip this GPS tick
                                return;
                            }
                            lastUpdateTime = now;

                            await dataService.updateUserLocation(
                                userId,
                                position.latitude,
                                position.longitude
                            );
                            console.log(
                                `%c[LocationTracker] 📍 Localização atualizada`,
                                'color: #22c55e; font-weight: bold',
                                `\nUsuário: ${userId}`,
                                `\nLatitude: ${position.latitude}`,
                                `\nLongitude: ${position.longitude}`,
                                `\nPrecisão: ${position.accuracy}m`,
                                `\nHorário: ${new Date().toLocaleTimeString('pt-BR')}`,
                                `\nPróxima em: ${trackerIntervalSeconds}s`
                            );
                        }
                    );

                    if (!cancelled) {
                        watcherIdRef.current = id;
                    } else {
                        await BackgroundGeolocation.removeWatcher({ id });
                    }
                } catch (err) {
                    console.error('[LocationTracker] Failed to start watcher:', err);
                }
            } else {
                // Web fallback: setInterval + browser Geolocation API
                const intervalId = window.setInterval(() => {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            await dataService.updateUserLocation(
                                userId,
                                pos.coords.latitude,
                                pos.coords.longitude
                            );
                            console.log(
                                `%c[LocationTracker] 📍 Localização atualizada (web)`,
                                'color: #22c55e; font-weight: bold',
                                `\nUsuário: ${userId}`,
                                `\nLatitude: ${pos.coords.latitude}`,
                                `\nLongitude: ${pos.coords.longitude}`,
                                `\nPrecisão: ${pos.coords.accuracy}m`,
                                `\nHorário: ${new Date().toLocaleTimeString('pt-BR')}`
                            );
                        },
                        (err) => {
                            console.warn('[LocationTracker] geolocation error:', err.message);
                            if (err.message.toLowerCase().includes('permission')) {
                                setIsLocationBlocked(true);
                            }
                        }
                    );
                }, trackerIntervalSeconds * 1000);

                watcherIdRef.current = String(intervalId);
            }
        };

        checkAndStart();

        // Reactive re-check when returning to app
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[LocationTracker] 🔄 App returned to foreground, re-checking permissions...');
                checkAndStart();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (watcherIdRef.current) {
                if (Capacitor.isNativePlatform()) {
                    BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current }).catch(
                        (err) => console.warn('[LocationTracker] Failed to remove watcher:', err)
                    );
                } else {
                    window.clearInterval(Number(watcherIdRef.current));
                }
                watcherIdRef.current = null;
            }
        };
    }, [userId, trackerIntervalSeconds, retryCount]);

    return { isLocationBlocked };
}
