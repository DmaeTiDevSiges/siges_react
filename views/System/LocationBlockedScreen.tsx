
import React, { useState } from 'react';
import { MdGpsFixed, MdSettings, MdRefresh, MdBatteryChargingFull, MdLocationOn } from 'react-icons/md';
import { Capacitor } from '@capacitor/core';
import { permissionService } from '../../services/permissionService';
import { detectManufacturer, getManufacturerGuide } from '../../utils/manufacturerGuide';

interface LocationBlockedScreenProps {
    onRetry: () => void;
    /**
     * Optional: a more specific reason for being blocked, coming from useLocationTracker.
     * If absent, the screen falls back to its general message.
     */
    blockReason?: 'permission_denied' | 'location_services_disabled' | 'watcher_failed' | null;
}

export const LocationBlockedScreen: React.FC<LocationBlockedScreenProps> = ({ onRetry, blockReason }) => {
    const [busy, setBusy] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    const guide = getManufacturerGuide();

    const handleOpenSettings = async () => {
        setBusy(true);
        try {
            await permissionService.openAppSettings();
        } finally {
            setBusy(false);
        }
    };

    const handleOpenBattery = async () => {
        setBusy(true);
        try {
            await permissionService.openBatteryOptimizationSettings();
        } finally {
            setBusy(false);
        }
    };

    const handleRequestBackground = async () => {
        setBusy(true);
        try {
            const granted = await permissionService.requestBackgroundLocationPermission();
            if (granted) {
                onRetry();
            }
        } finally {
            setBusy(false);
        }
    };

    const title = (() => {
        if (blockReason === 'location_services_disabled') return 'GPS desligado';
        if (blockReason === 'permission_denied') return 'Permissão de localização negada';
        if (blockReason === 'watcher_failed') return 'Rastreamento inativo';
        return 'GPS Obrigatório';
    })();

    const description = (() => {
        if (blockReason === 'location_services_disabled') {
            return 'O serviço de localização do aparelho está desligado. Ative o GPS nas configurações rápidas do Android e toque em "Tentar Novamente".';
        }
        if (blockReason === 'permission_denied') {
            return 'Para utilizar o Siges, é necessário permitir o acesso à localização "O tempo todo" nas configurações do app.';
        }
        return 'Para utilizar o Siges, é necessário que o GPS esteja ligado e que o aplicativo tenha permissão de localização "Sempre".';
    })();

    return (
        <div className="fixed inset-0 z-10000 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 safe-area-top safe-area-bottom overflow-y-auto">
            <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center border border-gray-100 dark:border-gray-800">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <MdGpsFixed className="text-red-500 text-4xl" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {title}
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {description}
                </p>

                <div className="space-y-3 w-full">
                    {/* Step 1 (Android 10+ only): request the "Allow all the time" prompt.
                        Must be a dedicated user action — Android refuses the prompt otherwise. */}
                    {isAndroid && (
                        <button
                            onClick={handleRequestBackground}
                            disabled={busy}
                            className="w-full flex items-center justify-center py-3.5 px-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95"
                        >
                            <MdLocationOn className="mr-2 text-xl" />
                            Permitir localização "O tempo todo"
                        </button>
                    )}

                    <button
                        onClick={handleOpenSettings}
                        disabled={busy}
                        className="w-full flex items-center justify-center py-3.5 px-6 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl font-semibold transition-all active:scale-95"
                    >
                        <MdSettings className="mr-2 text-xl" />
                        Abrir Configurações do App
                    </button>

                    {isAndroid && guide.isAggressive && (
                        <button
                            onClick={() => setShowGuide(v => !v)}
                            className="w-full flex items-center justify-center py-3.5 px-6 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-xl font-semibold transition-all active:scale-95"
                        >
                            <MdBatteryChargingFull className="mr-2 text-xl" />
                            Desbloquear no {guide.label}
                        </button>
                    )}

                    <button
                        onClick={onRetry}
                        disabled={busy}
                        className="w-full flex items-center justify-center py-3.5 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-all active:scale-95"
                    >
                        <MdRefresh className="mr-2 text-xl" />
                        Tentar Novamente
                    </button>
                </div>

                {showGuide && (
                    <div className="mt-6 w-full text-left bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                            {guide.label} — {guide.path}
                        </p>
                        <ol className="text-sm text-amber-800 dark:text-amber-300 space-y-1 list-decimal list-inside">
                            {guide.steps.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ol>
                        <button
                            onClick={handleOpenBattery}
                            disabled={busy}
                            className="mt-4 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all active:scale-95"
                        >
                            Abrir configurações de bateria
                        </button>
                    </div>
                )}

                <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 italic">
                    O rastreamento em segundo plano é necessário para o registro correto das atividades de campo.
                </p>
            </div>
        </div>
    );
};
