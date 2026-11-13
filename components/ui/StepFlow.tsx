import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

/**
 * Fluxo guiado "uma pergunta por tela" (visual novo / v2).
 * Barra de progresso fina, pergunta grande, conteúdo livre e botão redondo "→"
 * flutuante. O botão voltar (tela e Android) volta um passo; no primeiro, cancela.
 *
 * Exemplo:
 *   <StepFlow
 *     steps={[
 *       { key: 'unit', title: 'Qual a unidade?', content: <Input variant="underline" … />, canAdvance: !!unit },
 *       { key: 'problem', title: 'O que está acontecendo?', content: …, canAdvance: problem.length > 3 },
 *     ]}
 *     onFinish={save} onCancel={close} finishLabel="Enviar"
 *   />
 */

export interface StepFlowStep {
    key: string;
    /** Pergunta do passo (título grande). */
    title: React.ReactNode;
    description?: React.ReactNode;
    content: React.ReactNode;
    /** Libera o "→". Padrão true. */
    canAdvance?: boolean;
}

interface StepFlowProps {
    steps: StepFlowStep[];
    onFinish: () => void | Promise<void>;
    onCancel: () => void;
    /** Rótulo acessível do botão no último passo. */
    finishLabel?: string;
    /** Avisado a cada troca de passo. */
    onStepChange?: (index: number) => void;
    className?: string;
}

export const StepFlow: React.FC<StepFlowProps> = ({
    steps,
    onFinish,
    onCancel,
    finishLabel = 'Concluir',
    onStepChange,
    className = '',
}) => {
    const [index, setIndex] = useState(0);
    const [finishing, setFinishing] = useState(false);
    const step = steps[Math.min(index, steps.length - 1)];
    const isLast = index >= steps.length - 1;
    const canAdvance = step?.canAdvance !== false && !finishing;

    const goBack = () => {
        if (index === 0) onCancel();
        else setIndex(i => i - 1);
    };

    const goNext = async () => {
        if (!canAdvance) return;
        if (!isLast) {
            setIndex(i => i + 1);
            return;
        }
        setFinishing(true);
        try { await onFinish(); } finally { setFinishing(false); }
    };

    useEffect(() => { onStepChange?.(index); }, [index, onStepChange]);

    // Botão voltar do Android = voltar um passo.
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let remove: (() => void) | undefined;
        CapApp.addListener('backButton', goBack)
            .then(h => { remove = () => h.remove(); })
            .catch(() => undefined);
        return () => remove?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    if (!step) return null;
    const progress = ((index + 1) / steps.length) * 100;

    return (
        <div className={`relative flex flex-col h-full bg-surface ${className}`}>
            <div className="shrink-0 flex items-center px-2 pt-2">
                <button
                    type="button"
                    onClick={goBack}
                    className="w-11 h-11 flex items-center justify-center rounded-full text-fg cursor-pointer hover:bg-surface-2 transition-colors"
                    aria-label={index === 0 ? 'Cancelar' : 'Voltar'}
                >
                    <span className="material-symbols-outlined text-[24px]">{index === 0 ? 'close' : 'chevron_left'}</span>
                </button>
                <span className="ml-auto mr-3 text-caption text-fg-muted">{index + 1} de {steps.length}</span>
            </div>

            <div className="shrink-0 mx-4 h-1 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={steps.length}>
                <div className="h-full bg-brand rounded-full transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
            </div>

            <div key={step.key} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 pt-8 pb-28 ui-step-enter">
                <h2 className="text-title text-fg">{step.title}</h2>
                {step.description && <p className="mt-2 text-body text-fg-muted">{step.description}</p>}
                <div className="mt-8">{step.content}</div>
            </div>

            <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                aria-label={isLast ? finishLabel : 'Avançar'}
                title={isLast ? finishLabel : 'Avançar'}
                className="absolute right-5 w-14 h-14 rounded-full bg-brand text-on-brand flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-brand-strong active:scale-95 disabled:bg-surface-2 disabled:text-fg-subtle disabled:cursor-not-allowed"
                style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
            >
                <span className={`material-symbols-outlined text-[26px] ${finishing ? 'animate-spin' : ''}`}>
                    {finishing ? 'progress_activity' : isLast ? 'check' : 'arrow_forward'}
                </span>
            </button>
        </div>
    );
};
