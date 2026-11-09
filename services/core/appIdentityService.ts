import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Identificador do app Android (applicationId).
 * Nov/2026: com.ag.siges → br.com.sigesapp. Pacotes diferentes são apps diferentes
 * para o Android: o antigo continua instalado até a pessoa desinstalar, e a versão
 * de transição dele mostra a tela de migração (LegacyAppMigrationScreen).
 */
export const CURRENT_APP_ID = 'br.com.sigesapp';
export const LEGACY_APP_ID = 'com.ag.siges';

let cachedId: Promise<string | null> | null = null;

/** applicationId em execução (null fora do Android nativo ou se não for possível ler). */
export const getRunningAppId = (): Promise<string | null> => {
    if (!cachedId) {
        cachedId = (async () => {
            if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return null;
            try {
                return (await App.getInfo()).id || null;
            } catch {
                return null;
            }
        })();
    }
    return cachedId;
};

/** true quando o app em execução é o pacote antigo (com.ag.siges). */
export const isLegacyAppPackage = async (): Promise<boolean> => (await getRunningAppId()) === LEGACY_APP_ID;
