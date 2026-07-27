/// <reference types="vite/client" />

import React, { useEffect, useState } from 'react';

declare const __BUILD_ID__: string;
import { Capacitor } from '@capacitor/core';
import { Modal } from './ui/Modal';
import { dataService } from '../services/dataService';
import {
    getUpdateModalState,
    recordUpdateAttempt,
    resetUpdateAttempts,
    getUpdateAttemptCount
} from '../utils/updateAppVersionReminder';

const CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes
const BANNER_AUTO_HIDE_MS = 1000 * 60 * 5; // 5 minutes auto-hide

interface AppConfig {
    version_app: string;
    version_app_mask: string | null;
    apk_url: string;
}

const UpdateNotifier: React.FC = () => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isMandatory, setIsMandatory] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [reminderCount, setReminderCount] = useState<number>(() => getUpdateAttemptCount());

    const forceRefresh = async () => {
        resetUpdateAttempts();

        // 1. Limpar completamente o localStorage
        try {
            localStorage.clear();
        } catch (e) {
            console.error('Failed to clear localStorage:', e);
        }

        // 2. Desregistrar Service Workers
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            } catch (e) {
                console.error('Failed to unregister service workers:', e);
            }
        }

        // 3. Limpar cache storage do navegador
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                for (const key of keys) {
                    await caches.delete(key);
                }
            } catch (e) {
                console.error('Failed to clear cache storage:', e);
            }
        }

        // 4. Navigate with cache-busting. Use replace() to avoid back-button loops.
        //    index.html has Cache-Control: no-cache meta tags to prevent disk caching.
        //    Vite hashed asset filenames ensure new JS/CSS chunks are fetched.
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('t', Date.now().toString());
            url.searchParams.set('skipUpdateCheck', 'true');
            window.location.replace(url.toString());
        } catch (e) {
            window.location.replace(window.location.pathname + '?t=' + Date.now() + '&skipUpdateCheck=true');
        }
    };

    useEffect(() => {
        // Only run in production
        if (import.meta.env.DEV) return;

        // Verificar se o usuário quer pular a verificação de atualizações (após refresh)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('skipUpdateCheck') === 'true') {
            // Limpar o parâmetro de URL para evitar comportamento estranho em navegações futuras
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('skipUpdateCheck');
            window.history.replaceState({}, '', newUrl);
            return;
        }

        // Register a lightweight service worker for PWA update flows (non-blocking)
        if ('serviceWorker' in navigator) {
            try {
                navigator.serviceWorker.register('/sw-update.js').catch(() => {});
            } catch (e) {
                // ignore
            }
        }

        const checkVersion = async () => {
            try {
                // Fetch the config from the database
                const remoteConfig = await dataService.getAppConfig();
                if (!remoteConfig || !remoteConfig.version_app) return;

                setConfig({
                    version_app: remoteConfig.version_app,
                    version_app_mask: remoteConfig.version_app_mask ?? null,
                    apk_url: remoteConfig.apk_url
                });

                // Compare with the hardcoded __BUILD_ID__ from Vite define
                const { show, mandatory } = getUpdateModalState(remoteConfig.version_app, __BUILD_ID__);
                
                if (show) {
                    setIsMandatory(mandatory);
                    // Always show the modal for both native and web to ensure visibility
                    setShowModal(true);
                    setShowBanner(false);
                } else {
                    setShowModal(false);
                    setShowBanner(false);
                    // Se a versão atual for igual ou mais nova, limpa todos os contadores
                    resetUpdateAttempts();
                    setReminderCount(0);
                }
            } catch (error) {
                console.warn('Failed to check for updates:', error);
            }
        };

        // Check initially after boot
        const initialTimer = setTimeout(checkVersion, 5000);

        // Then check periodically
        const interval = setInterval(checkVersion, CHECK_INTERVAL);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, []);

    // Auto-hide banner and increment reminder counter
    useEffect(() => {
        if (!showBanner || !config?.version_app) return;
        const t = setTimeout(() => {
            setShowBanner(false);
            try {
                recordUpdateAttempt(config.version_app);
                setReminderCount(getUpdateAttemptCount());
            } catch (e) {
                // ignore
            }
        }, BANNER_AUTO_HIDE_MS);

        return () => clearTimeout(t);
    }, [showBanner, config]);

    const showBannerFromReminder = async () => {
        // Limpar os contadores quando o usuário clicar no lembrete
        resetUpdateAttempts();
        setReminderCount(0);
        setShowBanner(true);
        if (!config) {
            try {
                const remoteConfig = await dataService.getAppConfig();
                if (remoteConfig && remoteConfig.version_app) {
                    setConfig({
                        version_app: remoteConfig.version_app,
                        version_app_mask: remoteConfig.version_app_mask ?? null,
                        apk_url: remoteConfig.apk_url
                    });
                }
            } catch (e) {
                console.warn('Failed to load config on reminder click:', e);
            }
        }
    };

    const handleUpdate = () => {
        if (Capacitor.isNativePlatform()) {
            if (config?.apk_url) {
                window.open(config.apk_url, '_system');
            } else {
                console.warn('No APK URL available in config');
            }
            return;
        }

        // Web flow: force clean refresh e limpar contadores antes
        resetUpdateAttempts();
        forceRefresh();
    };

    const handleLater = () => {
        if (!config?.version_app) return;
        recordUpdateAttempt(config.version_app);
        setReminderCount(getUpdateAttemptCount());
        setShowModal(false);
        setShowBanner(false);
    };

    const versionLabel = config?.version_app_mask || config?.version_app || '';
    const versionSuffix = versionLabel ? ` (v${versionLabel})` : '';

    return (
        <>
            <Modal
                isOpen={showModal}
                onClose={isMandatory ? () => {} : handleLater} // Block closing if mandatory
                title={`Nova versão disponível${versionSuffix}!`}
                message={isMandatory 
                    ? `Uma atualização importante e obrigatória${versionSuffix} está disponível. Para continuar usando o aplicativo, é necessário ${Capacitor.isNativePlatform() ? 'baixar e instalar a nova versão' : 'atualizar a página'} agora.`
                    : `Uma atualização${versionSuffix} foi detectada. Deseja atualizar agora para ter acesso às melhorias mais recentes?`}
                confirmLabel={Capacitor.isNativePlatform() ? "Baixar e instalar" : "Atualizar agora"}
                cancelLabel={isMandatory ? undefined : "Depois"}
                onConfirm={handleUpdate}
                type="info"
                hideHeader={isMandatory} // Hide header (including 'X' button) if mandatory
                hideCancelButton={isMandatory} // Hide the "Depois" / "Fechar" button if mandatory
                draggable={!isMandatory} // Allow dragging/swiping only if not mandatory
            />

            {showBanner && (
                <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 text-white rounded-lg shadow-lg border border-white/10 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <div className="font-black">Nova versão disponível{versionSuffix}!</div>
                            <div className="text-sm text-slate-200 mt-1">Uma atualização foi detectada. Deseja atualizar agora?</div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleUpdate} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md font-semibold">Atualizar</button>
                            {!isMandatory && (
                                <button onClick={handleLater} className="text-slate-300 hover:text-white text-sm">Depois</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {!showBanner && reminderCount > 0 && (
                <button
                    onClick={showBannerFromReminder}
                    className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 z-60 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center font-bold"
                    title={`Você tem ${reminderCount} lembretes de atualização`}
                >
                    {reminderCount}
                </button>
            )}
        </>
    );
};

export default UpdateNotifier;
