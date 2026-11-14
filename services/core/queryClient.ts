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
 *  - `gcTime: 0`: o cache só vive ENQUANTO a tela está aberta. Fechou, some;
 *    abrir de novo mostra "Carregando" e já vem atualizado, como antes da
 *    migração. Sem isso, depois de salvar/excluir a lista reabriria mostrando
 *    por um instante o dado antigo (e criar um contrato, por ex., muda a
 *    contagem exibida na lista de empresas — não dá para amarrar caso a caso).
 *    Tela que quiser "mostrar o antigo na hora" opta por `gcTime` próprio E
 *    passa a invalidar suas chaves nas gravações.
 *    Dentro da tela aberta, o dado se mantém em dia por tempo real
 *    (`useLiveInvalidation`) e pelo fim da fila offline (`invalidateOnSyncEnd`).
 *  - sem retry quando o dado nunca foi baixado (`OfflineCacheMissError`).
 */
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean =>
    !(error instanceof OfflineCacheMissError) && failureCount < 1;

export const createQueryClient = (): QueryClient =>
    new QueryClient({
        defaultOptions: {
            queries: {
                networkMode: 'always',
                gcTime: 0,
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
