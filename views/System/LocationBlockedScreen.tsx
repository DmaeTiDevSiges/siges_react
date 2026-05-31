
import React from 'react';
import { MdGpsFixed, MdSettings, MdRefresh } from 'react-icons/md';
import { registerPlugin } from '@capacitor/core';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
    'BackgroundGeolocation'
);

interface LocationBlockedScreenProps {
    onRetry: () => void;
}

export const LocationBlockedScreen: React.FC<LocationBlockedScreenProps> = ({ onRetry }) => {
    const handleOpenSettings = async () => {
        try {
            await BackgroundGeolocation.openSettings();
        } catch (error) {
            console.error('Error opening settings:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-10000 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 safe-area-top safe-area-bottom">
            <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center border border-gray-100 dark:border-gray-800">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <MdGpsFixed className="text-red-500 text-4xl" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    GPS Obrigatório
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    Para utilizar o Siges, é necessário que o GPS esteja ligado e que o aplicativo tenha permissão de localização "Sempre".
                </p>

                <div className="space-y-3 w-full">
                    <button
                        onClick={handleOpenSettings}
                        className="w-full flex items-center justify-center py-3.5 px-6 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <MdSettings className="mr-2 text-xl" />
                        Abrir Configurações
                    </button>

                    <button
                        onClick={onRetry}
                        className="w-full flex items-center justify-center py-3.5 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-all active:scale-95"
                    >
                        <MdRefresh className="mr-2 text-xl" />
                        Tentar Novamente
                    </button>
                </div>

                <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 italic">
                    O rastreamento em segundo plano é necessário para o registro correto das atividades de campo.
                </p>
            </div>
        </div>
    );
};
