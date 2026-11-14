import { useEffect, useRef } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

type Subscription = { unsubscribe: () => void };
type Subscribe = (callback: () => void) => unknown;

interface Options {
    /** Chaves (por prefixo) que ficam velhas quando algo muda: ex. [['orders'], ['visits']]. */
    keys: QueryKey[];
    /** Assinaturas em tempo real (`dataService.subscribeToOrders`...). */
    subscribe?: Subscribe[];
    /** Evento do `window` que também pede atualização (ex.: 'refresh_dashboard'). */
    event?: string;
    enabled?: boolean;
    /** Como encerrar uma assinatura. Padrão: `.unsubscribe()`; canais do Supabase: `supabase.removeChannel`. */
    release?: (subscription: unknown) => void;
}

/**
 * Mantém as consultas da tela em dia com o tempo real (etapa 2 do
 * PLANO_MELHORIAS_FRONTEND.md): cada mudança nas assinaturas (ou o evento)
 * invalida as chaves; as consultas ativas rebuscam em segundo plano, sem
 * piscar o "carregando" (que fica só para a primeira busca).
 */
const unsubscribeDefault = (subscription: unknown) => (subscription as Subscription | null | undefined)?.unsubscribe?.();

export const useLiveInvalidation = ({ keys, subscribe = [], event, enabled = true, release = unsubscribeDefault }: Options): void => {
    const client = useQueryClient();
    const latest = useRef({ keys, subscribe, release });
    latest.current = { keys, subscribe, release };

    useEffect(() => {
        if (!enabled) return;
        const refresh = () => latest.current.keys.forEach(queryKey => { void client.invalidateQueries({ queryKey }); });
        const subs = latest.current.subscribe.map(sub => sub(refresh));
        if (event) window.addEventListener(event, refresh);
        return () => {
            if (event) window.removeEventListener(event, refresh);
            subs.forEach(s => latest.current.release(s));
        };
    }, [client, enabled, event]);
};
