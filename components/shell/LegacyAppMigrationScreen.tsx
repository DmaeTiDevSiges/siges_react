import React, { useCallback, useEffect, useState } from 'react';
import { MdSystemUpdate, MdSync, MdDownload, MdDeleteOutline, MdCheckCircle, MdWarning } from 'react-icons/md';
import { dataService } from '../../services/dataService';
import { isLegacyAppPackage } from '../../services/core/appIdentityService';
import { LocationService } from '../../services/core/locationServicePlugin';
import { syncNow } from '../../services/offline/offlineSync';
import { useOfflineSync } from '../../hooks/useOfflineSync';

/** "Agora não" esconde a tela por este tempo (técnico sem sinal, no meio de uma visita...). */
const SNOOZE_KEY = 'siges_legacy_migration_snooze_until';
const SNOOZE_MS = 1000 * 60 * 60 * 2;

const readSnooze = (): number => {
    try {
        return Number(localStorage.getItem(SNOOZE_KEY) || 0);
    } catch {
        return 0;
    }
};

/**
 * Migração do app antigo (com.ag.siges) para o novo (br.com.sigesapp).
 *
 * Só aparece no pacote antigo e quando cfg_app.new_apk_url está preenchido
 * (migration 20261119). Passos: 1) sincronizar a fila offline — o app novo NÃO
 * herda os dados deste; 2) instalar o novo; 3) desinstalar este (desliga o
 * rastreamento daqui para não rodarem dois).
 */
export const LegacyAppMigrationScreen: React.FC = () => {
    const [newAppUrl, setNewAppUrl] = useState<string | null>(null);
    const [hidden, setHidden] = useState(() => Date.now() < readSnooze());
    const [downloaded, setDownloaded] = useState(false);
    const sync = useOfflineSync();
    const unsent = sync.summary.total;

    const check = useCallback(async () => {
        if (!(await isLegacyAppPackage())) return;
        try {
            const config: any = await dataService.getAppConfig();
            setNewAppUrl(config?.new_apk_url || null);
        } catch {
            // sem internet: mantém o que já sabia
        }
        setHidden(Date.now() < readSnooze());
    }, []);

    useEffect(() => {
        void check();
        const onVisible = () => {
            if (document.visibilityState === 'visible') void check();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [check]);

    if (!newAppUrl || hidden) return null;

    const handleDownload = () => {
        if (unsent > 0 && !window.confirm(
            `Ainda há ${unsent} alteração(ões) não enviada(s) neste app. Elas NÃO passam para o app novo ` +
            'e só serão enviadas se você continuar com este instalado até sincronizar. Baixar mesmo assim?'
        )) return;
        window.open(newAppUrl, '_system');
        setDownloaded(true);
    };

    const handleUninstall = async () => {
        if (unsent > 0 && !window.confirm(
            `Ainda há ${unsent} alteração(ões) não enviada(s). Se desinstalar agora, elas serão PERDIDAS. Continuar?`
        )) return;
        // Desliga o rastreamento deste app (o novo assume) antes de abrir as configurações.
        try {
            await LocationService.stop();
        } catch {
            // APK sem o plugin: segue
        }
        try {
            await LocationService.openAppSettings();
        } catch {
            window.alert('Abra Configurações → Apps → Siges (o antigo) e toque em Desinstalar.');
        }
    };

    const handleSnooze = () => {
        try {
            localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
        } catch {
            // sem storage: só esconde nesta sessão
        }
        setHidden(true);
    };

    const step = 'flex items-start gap-3 text-left';
    const stepNum = 'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold';

    return (
        <div className="fixed inset-0 z-10000 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 safe-area-top safe-area-bottom overflow-y-auto">
            <div className="bg-white dark:bg-card-dark rounded-3xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center text-center border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MdSystemUpdate className="text-primary text-3xl" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">O Siges tem um app novo</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Este aplicativo será substituído. O novo é instalado à parte e <b>não leva os dados deste</b>,
                    por isso siga os passos na ordem.
                </p>

                <div className="space-y-5 w-full">
                    {/* 1. Sincronizar */}
                    <div className={step}>
                        <span className={`${stepNum} ${unsent === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>1</span>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Enviar o que está pendente</p>
                            {unsent === 0 ? (
                                <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1 mt-1">
                                    <MdCheckCircle /> Nada pendente neste aparelho.
                                </p>
                            ) : (
                                <>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1">
                                        <MdWarning /> {unsent} alteração(ões) ainda não enviada(s). Conecte-se à internet.
                                    </p>
                                    <button
                                        onClick={() => void syncNow()}
                                        disabled={sync.syncing}
                                        className="mt-2 w-full flex items-center justify-center py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
                                    >
                                        <MdSync className={`mr-2 ${sync.syncing ? 'animate-spin' : ''}`} />
                                        {sync.syncing ? 'Sincronizando...' : 'Sincronizar agora'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 2. Instalar o novo */}
                    <div className={step}>
                        <span className={`${stepNum} ${downloaded ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>2</span>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Instalar o app novo</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Depois de instalar, abra o novo Siges, faça login e permita a localização "O tempo todo".
                            </p>
                            <button
                                onClick={handleDownload}
                                className="mt-2 w-full flex items-center justify-center py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold"
                            >
                                <MdDownload className="mr-2" /> Baixar o novo Siges
                            </button>
                        </div>
                    </div>

                    {/* 3. Desinstalar este */}
                    <div className={step}>
                        <span className={`${stepNum} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`}>3</span>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Desinstalar este app</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Só depois de entrar no app novo. Na tela que abrir, toque em "Desinstalar".
                            </p>
                            <button
                                onClick={() => void handleUninstall()}
                                className="mt-2 w-full flex items-center justify-center py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold"
                            >
                                <MdDeleteOutline className="mr-2" /> Desinstalar este app
                            </button>
                        </div>
                    </div>
                </div>

                <button onClick={handleSnooze} className="mt-6 text-xs text-gray-400 dark:text-gray-500 underline">
                    Agora não (lembrar em 2 horas)
                </button>
            </div>
        </div>
    );
};
