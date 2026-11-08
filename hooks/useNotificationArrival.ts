import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Efeito de chegada de notificação no botão de notificações do cabeçalho:
 * o logo do SIGES dá lugar ao avatar do remetente por 3 s; sem foto do
 * remetente (ou notificação do sistema), o badge pulsa.
 *
 * App.tsx anuncia a chegada (announceNotificationArrival) e o Header consome
 * (useNotificationArrival) — evento de janela, sem prop drilling.
 */

export const NOTIFICATION_ARRIVAL_EVENT = 'siges:notification-arrival';
export const ARRIVAL_DURATION_MS = 3000;
const PRELOAD_TIMEOUT_MS = 800;
const MAX_QUEUE = 3;

export interface NotificationArrival {
    /** id da notificação (users_notifications.id) */
    id: string;
    /** users.id do remetente; null = notificação do sistema */
    senderId: string | null;
    /** Foto do remetente; null = efeito no badge */
    avatarUrl: string | null;
}

export interface ArrivalShow {
    /** Muda a cada exibição: reinicia a animação mesmo com o mesmo avatar. */
    key: string;
    avatarUrl: string | null;
}

/**
 * Regras da fila: ignora id já exibido/enfileirado; notificação seguida do mesmo
 * remetente substitui a anterior (um efeito por rajada); no máximo 3 na fila,
 * descartando as mais antigas.
 */
export function enqueueArrival(
    queue: NotificationArrival[],
    item: NotificationArrival,
    seen: ReadonlySet<string>,
    max = MAX_QUEUE,
): NotificationArrival[] {
    if (seen.has(item.id) || queue.some(q => q.id === item.id)) return queue;
    const last = queue.at(-1);
    if (last && item.senderId && last.senderId === item.senderId) {
        return [...queue.slice(0, -1), item];
    }
    const next = [...queue, item];
    return next.length > max ? next.slice(next.length - max) : next;
}

export function announceNotificationArrival(item: NotificationArrival): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<NotificationArrival>(NOTIFICATION_ARRIVAL_EVENT, { detail: item }));
}

/** Carrega a imagem antes de exibir (não surge pela metade); false se falhar ou demorar. */
function preloadImage(url: string, timeoutMs = PRELOAD_TIMEOUT_MS): Promise<boolean> {
    return new Promise(resolve => {
        const img = new Image();
        const timer = setTimeout(() => resolve(false), timeoutMs);
        img.onload = () => { clearTimeout(timer); resolve(true); };
        img.onerror = () => { clearTimeout(timer); resolve(false); };
        img.src = url;
    });
}

export function useNotificationArrival(): ArrivalShow | null {
    const [current, setCurrent] = useState<ArrivalShow | null>(null);
    const queueRef = useRef<NotificationArrival[]>([]);
    const seenRef = useRef<Set<string>>(new Set());
    const busyRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);

    const showNext = useCallback(async () => {
        if (busyRef.current) return;
        const item = queueRef.current.shift();
        if (!item) return;
        busyRef.current = true;

        if (seenRef.current.size > 200) seenRef.current.clear();
        seenRef.current.add(item.id);

        const avatarUrl = item.avatarUrl && (await preloadImage(item.avatarUrl)) ? item.avatarUrl : null;
        if (!mountedRef.current) return;

        setCurrent({ key: `${item.id}-${Date.now()}`, avatarUrl });
        timerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setCurrent(null);
            busyRef.current = false;
            void showNext();
        }, ARRIVAL_DURATION_MS);
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        const onArrival = (event: Event) => {
            const detail = (event as CustomEvent<NotificationArrival>).detail;
            if (!detail?.id) return;
            queueRef.current = enqueueArrival(queueRef.current, detail, seenRef.current);
            void showNext();
        };
        window.addEventListener(NOTIFICATION_ARRIVAL_EVENT, onArrival);
        return () => {
            mountedRef.current = false;
            window.removeEventListener(NOTIFICATION_ARRIVAL_EVENT, onArrival);
            if (timerRef.current) clearTimeout(timerRef.current);
            busyRef.current = false;
        };
    }, [showNext]);

    return current;
}
