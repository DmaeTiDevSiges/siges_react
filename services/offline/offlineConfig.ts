import { Capacitor } from '@capacitor/core';
import { isOfflineModeEnabled } from '../../features';
import { networkService } from '../core/networkService';
import type { OfflineStore } from './store/offlineStore';
import { createFilesystemStore } from './store/filesystemStore';
import { createLocalStorageStore } from './store/localStorageStore';
import { createMemoryStore } from './store/memoryStore';

/**
 * Modo offline disponível neste build/plataforma:
 *   flag VITE_FEATURE_OFFLINE_MODE=true  E  (APK  OU  navegador em `npm run dev`)
 * Na web de produção fica desligado (decisão do plano: offline só no APK).
 */
export const isOfflineSupported = (): boolean =>
    isOfflineModeEnabled() && (Capacitor.isNativePlatform() || import.meta.env.DEV);

/**
 * Plataforma onde o modo offline pode rodar (APK ou `npm run dev`), com ou
 * sem a flag. A sincronização roda aqui mesmo com a flag DESLIGADA: um APK
 * novo com a flag em false ainda envia a fila que ficou no aparelho.
 */
export const isOfflinePlatform = (): boolean => Capacitor.isNativePlatform() || import.meta.env.DEV;

/**
 * Há rede? Antes do networkService inicializar (primeiros ms do app), o status
 * dele é um valor padrão "desconectado" — usa navigator.onLine nesse intervalo.
 */
export const isOnline = (): boolean => {
    if (networkService.isInitialized()) return networkService.isConnected();
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
};

/**
 * Limite das leituras REST com o modo offline ligado: "conectado" sem internet
 * real penduraria a tela. 30 s para não cortar consultas lentas legítimas
 * (dashboards/exportações também passam pelo mesmo fetch). Sem sinal nenhum,
 * isOnline() já é false e a leitura nem sai do aparelho.
 */
export const OFFLINE_READ_TIMEOUT_MS = 30_000;

let store: OfflineStore | null = null;

export const getOfflineStore = (): OfflineStore => {
    if (!store) {
        try {
            store = Capacitor.isNativePlatform() ? createFilesystemStore() : createLocalStorageStore();
        } catch {
            store = createMemoryStore();
        }
    }
    return store;
};
