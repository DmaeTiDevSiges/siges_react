import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Modal } from './ui/Modal';
import { dataService } from '../services/dataService';
import {
    getUpdateModalState,
    recordUpdateAttempt,
    resetUpdateAttempts
} from '../utils/updateAppVersionReminder';

const CHECK_INTERVAL = 1000 * 60 * 5; // 5 minutes

interface AppConfig {
    version_app: string;
    version_app_mask: string | null;
    apk_url: string;
}

const UpdateNotifier: React.FC = () => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isMandatory, setIsMandatory] = useState(false);

    useEffect(() => {
        // Only run in production
        if (import.meta.env.DEV) return;

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
                    setShowModal(true);
                } else {
                    setShowModal(false);
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

    const handleUpdate = () => {
        if (Capacitor.isNativePlatform()) {
            if (config?.apk_url) {
                window.open(config.apk_url, '_system');
            } else {
                console.warn('No APK URL available in config');
            }
        } else {
            // For web, just reload to fetch the new version
            resetUpdateAttempts();
            window.location.reload();
        }
    };

    const handleLater = () => {
        if (!config?.version_app) return;
        recordUpdateAttempt(config.version_app);
        setShowModal(false);
    };

    const versionLabel = config?.version_app_mask || config?.version_app || '';
    const versionSuffix = versionLabel ? ` (v${versionLabel})` : '';

    return (
        <Modal
            isOpen={showModal}
            onClose={isMandatory ? () => {} : handleLater} // Block closing if mandatory
            title={`Nova versão disponível${versionSuffix}!`}
            message={isMandatory 
                ? `Uma atualização importante e obrigatória${versionSuffix} está disponível. Para continuar usando o aplicativo, é necessário baixar e instalar a nova versão agora.`
                : `Uma atualização${versionSuffix} foi detectada. Deseja atualizar agora para ter acesso às melhorias mais recentes?`}
            confirmLabel={Capacitor.isNativePlatform() ? "Baixar e instalar" : "Atualizar agora"}
            cancelLabel={isMandatory ? undefined : "Depois"}
            onConfirm={handleUpdate}
            type="info"
            hideHeader={isMandatory} // Hide header (including 'X' button) if mandatory
            hideCancelButton={isMandatory} // Hide the "Depois" / "Fechar" button if mandatory
            draggable={!isMandatory} // Allow dragging/swiping only if not mandatory
        />
    );
};

export default UpdateNotifier;
