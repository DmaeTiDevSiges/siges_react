import { useCallback, useRef, useState } from 'react';

/**
 * Registro (OS, ativo…) pedido pela URL — voltar/avançar, recarregar, link —
 * para telas que recebem o objeto pronto por prop e não sabem buscá-lo sozinhas
 * (etapa 1b do PLANO_MELHORIAS_FRONTEND.md).
 *
 * `load(id)`: se o registro em memória já é esse, nada a fazer; senão busca
 * pelo id. Enquanto busca, `pendingId` fica preenchido: a tela mostra
 * "Carregando..." e o App mantém esse id na URL. Não achou ou deu erro:
 * `onFail` (avisar e cair no painel). `cancel()`: o usuário escolheu outro
 * registro antes da busca terminar — a resposta atrasada é descartada.
 */
export const useRouteEntity = <T extends { id?: unknown }>(
    current: T | null,
    setCurrent: (value: T) => void,
    fetchById: (id: string) => Promise<T | null>,
    onFail: () => void,
) => {
    const [pendingId, setPendingId] = useState<string | null>(null);
    const req = useRef<string | null>(null);
    const latest = useRef({ current, setCurrent, fetchById, onFail });
    latest.current = { current, setCurrent, fetchById, onFail };

    const cancel = useCallback(() => {
        req.current = null;
        setPendingId(null);
    }, []);

    const load = useCallback((id: string) => {
        const { current: now, fetchById: fetch } = latest.current;
        if (now?.id != null && String(now.id) === id) { cancel(); return; }
        req.current = id;
        setPendingId(id);
        const fail = () => {
            if (req.current !== id) return;
            cancel();
            latest.current.onFail();
        };
        fetch(id).then(value => {
            if (req.current !== id) return;
            if (!value) { fail(); return; }
            req.current = null;
            latest.current.setCurrent(value);
            setPendingId(null);
        }).catch(fail);
    }, [cancel]);

    return { pendingId, load, cancel };
};
