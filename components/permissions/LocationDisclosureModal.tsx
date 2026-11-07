import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    LOCATION_DISCLOSURE_EVENT,
    LocationDisclosureRequest,
} from '../../services/core/locationDisclosure';

/**
 * Aviso em destaque mostrado antes do pedido de permissão de localização do
 * Android (exigência da Play Store). Fica acima de tudo, inclusive da tela
 * "Localização bloqueada" (z-10000).
 */
export const LocationDisclosureModal: React.FC = () => {
    const [open, setOpen] = useState(false);
    const requestRef = useRef<LocationDisclosureRequest | null>(null);

    useEffect(() => {
        const onRequest = (event: Event) => {
            const detail = (event as CustomEvent<LocationDisclosureRequest>).detail;
            if (!detail) return;
            requestRef.current = detail;
            setOpen(true);
        };
        window.addEventListener(LOCATION_DISCLOSURE_EVENT, onRequest);
        return () => window.removeEventListener(LOCATION_DISCLOSURE_EVENT, onRequest);
    }, []);

    const answer = (accepted: boolean) => {
        const request = requestRef.current;
        requestRef.current = null;
        setOpen(false);
        request?.resolve(accepted);
    };

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-10001 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 pad-safe-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-disclosure-title"
        >
            <div className="w-full max-w-sm max-h-modal-safe overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 shadow-2xl p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-indigo-50 dark:bg-indigo-900/20 ring-8 ring-indigo-50/50 dark:ring-indigo-900/10">
                        <span className="material-symbols-outlined text-3xl text-indigo-500">location_on</span>
                    </div>
                    <h2 id="location-disclosure-title" className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-3">
                        Uso da sua localização
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        O SIGES coleta a <strong>localização do aparelho</strong>, inclusive{' '}
                        <strong>com o app fechado ou fora de uso</strong>, durante o seu expediente
                        (quando você está disponível ou com uma visita em andamento).
                    </p>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex gap-2">
                        <span className="material-symbols-outlined text-lg text-indigo-500 shrink-0">groups</span>
                        <span>Para a coordenação acompanhar as equipes em campo e distribuir as ordens de serviço.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="material-symbols-outlined text-lg text-indigo-500 shrink-0">near_me</span>
                        <span>Para mostrar unidades e ativos próximos de você.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="material-symbols-outlined text-lg text-indigo-500 shrink-0">notifications_active</span>
                        <span>Enquanto coleta, o Android mostra uma notificação fixa do SIGES. Ao ficar indisponível sem visita aberta, a coleta para.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="material-symbols-outlined text-lg text-indigo-500 shrink-0">lock</span>
                        <span>A localização é usada só dentro do SIGES e não é vendida nem usada para publicidade.</span>
                    </li>
                </ul>

                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Em seguida o Android pedirá a permissão. Para o rastreamento funcionar com o app fechado,
                    escolha <strong>"Permitir o tempo todo"</strong> quando solicitado.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => answer(true)}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm bg-primary hover:bg-primary/90 text-white active:scale-[0.98] transition-all"
                    >
                        Continuar
                    </button>
                    <button
                        type="button"
                        onClick={() => answer(false)}
                        className="w-full py-3.5 rounded-2xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                        Agora não
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
