
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor, PermissionState } from '@capacitor/core';
import { LocationService } from './locationServicePlugin';

const isAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export type LocationPermissionLevel = 'denied' | 'foreground' | 'background';

export interface LocationPermissionResult {
    level: LocationPermissionLevel;
    /** When true, the system has full background access. */
    hasBackground: boolean;
    /** When true, system Location Services are turned off entirely (no GPS chip active). */
    locationServicesDisabled: boolean;
}

// Route keys for App Notices permissions
export const APP_NOTICES_ROUTE_KEY = 'app_notices';

const FOREGROUND_GRANTED = (s: PermissionState) => s === 'granted';

/**
 * Map a list of granted permission aliases into a coarse level.
 * The `@capacitor/geolocation` plugin's `location` alias covers FINE+COARSE on Android.
 * Background access is checked separately via Diagnostics (see below) since the plugin
 * does not expose a `backgroundLocation` alias.
 */
export const permissionService = {
    /**
     * Request Location permissions in the **2-step flow** required by Android 10+:
     *
     *   1) Request foreground (`FINE_LOCATION` / "While using the app").
     *   2) On Android 10+, request `ACCESS_BACKGROUND_LOCATION` only **after** the user
     *      has explicitly tapped a button (e.g. "Permitir sempre") — Android refuses the
     *      background prompt if shown immediately after the foreground one.
     *
     * Returns a `LocationPermissionResult` describing the final state.
     *
     * @param options.requestBackground — pass `true` ONLY when the user has just tapped
     *   the dedicated "allow all the time" button. The Android system prompt for
     *   background location must be a separate user action.
     */
    async requestLocationPermission(
        options: { requestBackground?: boolean } = {}
    ): Promise<LocationPermissionResult> {
        if (!Capacitor.isNativePlatform()) {
            return { level: 'foreground', hasBackground: true, locationServicesDisabled: false };
        }

        try {
            // --- Step 1: foreground location ---------------------------------
            let status = await Geolocation.checkPermissions();
            if (!FOREGROUND_GRANTED(status.location)) {
                status = await Geolocation.requestPermissions({ permissions: ['location'] });
            }

            if (!FOREGROUND_GRANTED(status.location)) {
                return { level: 'denied', hasBackground: false, locationServicesDisabled: false };
            }

            // --- Step 2: background location (only if explicitly requested) -
            // On Android 10+ this must be a SEPARATE user action; we expose a
            // dedicated function `requestBackgroundLocationPermission()` for that.
            if (!options.requestBackground) {
                return { level: 'foreground', hasBackground: false, locationServicesDisabled: false };
            }

            const bgGranted = await this.requestBackgroundLocationPermission();
            return {
                level: bgGranted ? 'background' : 'foreground',
                hasBackground: bgGranted,
                locationServicesDisabled: false
            };
        } catch (error) {
            // `@capacitor/geolocation` throws when **system Location Services** are off.
            const msg = (error as Error)?.message?.toLowerCase() ?? '';
            const isLocationServicesOff =
                msg.includes('location services') ||
                msg.includes('location is disabled') ||
                msg.includes('gps') ||
                msg.includes('not available');

            if (isLocationServicesOff) {
                return { level: 'denied', hasBackground: false, locationServicesDisabled: true };
            }

            console.error('Error requesting location permission:', error);
            return { level: 'denied', hasBackground: false, locationServicesDisabled: false };
        }
    },

    /**
     * Request the Android 10+ "Allow all the time" background location permission.
     * MUST be called from a dedicated user action (e.g. tapping a button) — the
     * Android system will silently reject the prompt otherwise.
     *
     * iOS handles "Always" authorization automatically through the
     * BackgroundGeolocation plugin's `addWatcher({ requestPermissions: true })`.
     */
    async requestBackgroundLocationPermission(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return true;

        try {
            if (isAndroid()) {
                const before = await LocationService.getStatus();
                if (before.backgroundLocation) return true;

                // "O tempo todo" exige a localização "durante o uso" concedida antes.
                if (!before.fineLocation) {
                    const fg = await Geolocation.requestPermissions({ permissions: ['location'] });
                    if (fg.location !== 'granted') return false;
                }

                try {
                    // Android 11+: abre DIRETO a tela "Permissões de localização" do app.
                    // Android 10: diálogo do sistema.
                    const result = await LocationService.requestBackgroundLocation();
                    if (result.granted) return true;
                    // O sistema não mostrou nada (ex.: "não perguntar novamente"):
                    // último recurso, configurações do app.
                    if (!result.shown) await LocationService.openAppSettings();
                    return false;
                } catch {
                    // APK antigo, sem o método nativo: comportamento anterior.
                    await LocationService.openAppSettings();
                    return false;
                }
            }

            const status = await Geolocation.requestPermissions({ permissions: ['location'] });
            return status.location === 'granted';
        } catch (error) {
            console.error('Error requesting background location permission:', error);
            return false;
        }
    },

    /** true quando o app tem "Permitir o tempo todo" (sempre true fora do Android). */
    async hasBackgroundLocationPermission(): Promise<boolean> {
        if (!isAndroid()) return true;
        try {
            return (await LocationService.getStatus()).backgroundLocation;
        } catch {
            return false;
        }
    },

    /**
     * Open the OS-level settings page for this app (location permission, battery, etc.).
     * Used by the "GPS Bloqueado" screen.
     */
    async openAppSettings(): Promise<void> {
        if (!isAndroid()) return;
        try {
            await LocationService.openAppSettings();
        } catch (error) {
            console.error('Error opening app settings:', error);
        }
    },

    /**
     * Pede ao Android para não otimizar a bateria do SIGES (diálogo do sistema;
     * se o aparelho não suportar, abre a lista de otimização de bateria).
     * O APK é distribuído fora da Play Store, então o uso de
     * REQUEST_IGNORE_BATTERY_OPTIMIZATIONS não sofre a restrição de política da loja.
     * Fabricantes como Xiaomi/Samsung têm ajustes extras — ver utils/manufacturerGuide.
     */
    async openBatteryOptimizationSettings(): Promise<void> {
        if (!isAndroid()) return;
        try {
            await LocationService.requestIgnoreBatteryOptimizations();
        } catch (error) {
            console.error('Error opening battery optimization settings:', error);
        }
    },

    /**
     * Request Camera permissions
     */
    async requestCameraPermission(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return true;

        try {
            const status = await Camera.checkPermissions();

            if (status.camera === 'granted' || status.photos === 'granted') {
                return true;
            }

            const requestStatus = await Camera.requestPermissions();
            return requestStatus.camera === 'granted' || requestStatus.photos === 'granted';
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            return false;
        }
    },

    /**
     * Request all main permissions
     */
    async requestAllPermissions(): Promise<{ location: boolean; camera: boolean }> {
        const locationResult = await this.requestLocationPermission();
        const location = locationResult.level !== 'denied';
        const camera = await this.requestCameraPermission();

        return { location, camera };
    }
};
