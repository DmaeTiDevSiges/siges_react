import { useEffect, useState } from 'react';
import { getAutoSyncStatus, subscribeAutoSync, type AutoSyncStatus } from '../services/offline/offlineAutoSync';

/** Estado do download automático dos dados offline (barra de progresso). */
export const useOfflineAutoSync = (): AutoSyncStatus => {
    const [status, setStatus] = useState<AutoSyncStatus>(getAutoSyncStatus());
    useEffect(() => subscribeAutoSync(setStatus), []);
    return status;
};
