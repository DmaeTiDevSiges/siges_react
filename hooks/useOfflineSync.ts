import { useEffect, useState } from 'react';
import {
    getOfflineSyncState,
    subscribeOfflineSync,
    type OfflineSyncState,
} from '../services/offline/offlineSync';

/** Estado da fila offline (pendentes, erros, conflitos, sincronizando). */
export const useOfflineSync = (): OfflineSyncState => {
    const [state, setState] = useState<OfflineSyncState>(getOfflineSyncState());
    useEffect(() => subscribeOfflineSync(setState), []);
    return state;
};
