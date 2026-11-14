import { QueryClient } from '@tanstack/react-query';
import { OfflineCacheMissError } from '../offline/readCache';
import { subscribeOfflineSync } from '../offline/offlineSync';

/**
 * Camada de dados das telas de leitura (etapa 2 do PLANO_MELHORIAS_FRONTEND.md).
 *
 * O cache offline (`readCache`, rede primeiro → cache como reserva) continua
 * DENTRO do `dataService`: o `queryFn` só chama `dataService.getX(...)` e herda
 * o comportamento offline. O TanStack Query cuida do que as telas faziam à mão
 * (`useEffect` + `loading`/`error`): estado de carregamento, erro, cache em
 * memória entre telas e refetch.
 *
 * Decisões:
 *  - `networkMode: 'always'`: por padrão a lib PAUSA consultas sem internet,
 *    mas aqui o `dataService` sabe responder do cache offline — tem que rodar.
 *  - `refetchOnWindowFocus: false`: no celular/Electron o foco muda toda hora.
 *  - `staleTime: 0` (padrão): ao abrir a tela mostra os dados em memória na
 *    hora e rebusca em segundo plano, igual ao comportamento antigo.
 *  - sem retry quando o dado nunca foi baixado (`OfflineCacheMissError`).
 */
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean =>
    !(error instanceof OfflineCacheMissError) && failureCount < 1;

export const createQueryClient = (): QueryClient =>
    new QueryClient({
        defaultOptions: {
            queries: {
                networkMode: 'always',
                refetchOnWindowFocus: false,
                retry: shouldRetryQuery,
            },
            mutations: { networkMode: 'always' },
        },
    });

export const queryClient = createQueryClient();

/**
 * Depois que a fila offline termina de enviar (syncing: true → false), o que
 * está em memória pode estar velho: invalida tudo. As consultas ativas rebuscam
 * na hora; as demais, na próxima vez que a tela abrir.
 */
export const invalidateOnSyncEnd = (
    client: QueryClient,
    subscribe: typeof subscribeOfflineSync = subscribeOfflineSync,
): (() => void) => {
    let wasSyncing = false;
    return subscribe(state => {
        if (wasSyncing && !state.syncing) void client.invalidateQueries();
        wasSyncing = state.syncing;
    });
};
