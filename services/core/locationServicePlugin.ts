import { registerPlugin } from '@capacitor/core';

// Plugin nativo (android/.../LocationServicePlugin.java) que controla o
// LocationForegroundService. Registrado uma única vez e compartilhado pelo
// hook de rastreamento e pelo permissionService.

export interface LocationServiceStatus {
    fineLocation: boolean;
    /** "Permitir o tempo todo" (Android 10+). */
    backgroundLocation: boolean;
    ignoringBatteryOptimizations: boolean;
    trackingEnabled: boolean;
    manufacturer: string;
    sdkInt: number;
}

export interface LocationServicePlugin {
    start(opts: {
        userId: string;
        supabaseUrl: string;
        supabaseKey: string;
        /** Token do aparelho emitido por fn_tracker_issue_token. */
        trackerToken: string;
        intervalSeconds: number;
        distanceMeters: number;
    }): Promise<void>;
    stop(): Promise<void>;
    getStatus(): Promise<LocationServiceStatus>;
    requestIgnoreBatteryOptimizations(): Promise<{ ignoringBatteryOptimizations: boolean }>;
    /**
     * Pede "Permitir o tempo todo". Android 11+: abre direto a tela
     * "Permissões de localização" do app. `shown=false` = o sistema não exibiu nada.
     */
    requestBackgroundLocation(): Promise<{ granted: boolean; shown: boolean; needsForeground?: boolean }>;
    openAppSettings(): Promise<void>;
}

export const LocationService = registerPlugin<LocationServicePlugin>('LocationService');
