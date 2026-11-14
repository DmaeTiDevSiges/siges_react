import type { OrderVisitAssetView } from '../types';

/**
 * Regras do relatório do ativo na visita (OrderVisitAssetReport), sem React:
 * quando a movimentação está completa, quando o destino é igual à origem,
 * o que falta para reportar/revisar/aprovar e os itens do indicador de progresso.
 */

export interface MovementDestination {
    afterClientId: string;
    afterUnitId: string;
    afterUnitAssetTagId: string;
    afterPriorityId?: number;
    afterStatusId: string;
    afterLocation: string;
}

/** Todos os campos obrigatórios do destino foram preenchidos (local é opcional). */
export const isMovementComplete = (d: Pick<MovementDestination, 'afterClientId' | 'afterUnitId' | 'afterUnitAssetTagId' | 'afterPriorityId' | 'afterStatusId'>): boolean =>
    !!(d.afterClientId && d.afterUnitId && d.afterUnitAssetTagId && d.afterPriorityId && d.afterStatusId);

/** Marcou "movido", mas o destino é exatamente a origem. */
export const isSameMovementDestination = (asset: OrderVisitAssetView | null | undefined, d: MovementDestination): boolean =>
    d.afterClientId === (asset?.clientId || '') &&
    d.afterUnitId === (asset?.beforeUnitId || '') &&
    d.afterUnitAssetTagId === (asset?.beforeUnitAssetTagId || '') &&
    d.afterPriorityId === asset?.beforePriorityId &&
    d.afterStatusId === (asset?.beforeStatusId || '') &&
    d.afterLocation === (asset?.beforeLocation || '');

/** Plano de manutenção escolhido ('' e '0' significam nenhum). */
export const hasMaintenancePlan = (planId: string | null | undefined): boolean => !!planId && planId !== '0';

export type ReportProblem = 'uploading' | 'incomplete' | 'no-activity' | 'movement-incomplete' | 'same-destination';

/** `ok: true` = pode seguir; senão `problem`, `level` (info/erro) e `message` dizem o que falta. */
export interface ReportCheck {
    ok: boolean;
    problem?: ReportProblem;
    level?: 'info' | 'error';
    message?: string;
}

export interface ReportCheckInput {
    /** Fotos ainda sendo enviadas. */
    uploadingCount: number;
    beforeDone: boolean;
    afterDone: boolean;
    activitiesCount: number;
    isMoved: boolean;
    movementComplete: boolean;
    /** Só consultado quando `isMoved` e a movimentação está completa. */
    sameDestination: () => boolean;
    verb: 'reportar' | 'confirmar';
}

/** Regras para reportar, revisar e aprovar (mesmas nos três caminhos), na ordem em que são cobradas. */
export const checkReport = (i: ReportCheckInput): ReportCheck => {
    if (i.uploadingCount > 0) {
        return { ok: false, problem: 'uploading', level: 'info', message: 'Aguarde o envio das fotos terminar' };
    }
    if (!i.beforeDone || !i.afterDone) {
        return { ok: false, problem: 'incomplete', level: 'error', message: `Preencha as condições e adicione fotos antes de ${i.verb}` };
    }
    if (i.activitiesCount === 0) {
        return { ok: false, problem: 'no-activity', level: 'error', message: 'É necessário selecionar ao menos uma intervenção realizada' };
    }
    if (i.isMoved) {
        if (!i.movementComplete) {
            return { ok: false, problem: 'movement-incomplete', level: 'error', message: 'Preencha todos os campos obrigatórios da movimentação' };
        }
        if (i.sameDestination()) {
            return { ok: false, problem: 'same-destination', level: 'error', message: '' };
        }
    }
    return { ok: true };
};

export type ProgressSection = 'before' | 'checklist' | 'activities' | 'movement' | 'after';

export interface ProgressSpec {
    key: string;
    label: string;
    done: boolean;
    section: ProgressSection;
}

export interface ProgressInput {
    beforeDone: boolean;
    afterDone: boolean;
    hasPlan: boolean;
    maintenanceProgress: number;
    activitiesCount: number;
    isMoved: boolean;
    movementComplete: boolean;
}

/** Itens do indicador de progresso, na ordem do trabalho em campo. */
export const buildProgressSpecs = (i: ProgressInput): ProgressSpec[] => [
    { key: 'before', label: 'Condição antes', done: i.beforeDone, section: 'before' },
    ...(i.hasPlan ? [{ key: 'checklist', label: `Checklist ${i.maintenanceProgress}%`, done: i.maintenanceProgress >= 100, section: 'checklist' as const }] : []),
    { key: 'activities', label: 'Atividades', done: i.activitiesCount > 0, section: 'activities' },
    ...(i.isMoved ? [{ key: 'movement', label: 'Movimentação', done: i.movementComplete, section: 'movement' as const }] : []),
    { key: 'after', label: 'Condição depois', done: i.afterDone, section: 'after' },
];
