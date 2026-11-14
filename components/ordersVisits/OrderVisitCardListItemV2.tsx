import React from 'react';
import { OrderVisit } from '../../types';
import { formatDateTime, formatCurrency, getStatusConfig } from '../../utils/formatters';
import { VisitReportPDFButton } from '../reports/VisitReportPDFButton';

/**
 * Cartão de visita da lista — visual novo (v2, F4 do PLANO_DESIGN_ESTILO_NUBANK.md).
 * Só tokens do design system (nada de slate/white/hex), texto em caixa normal e a partir
 * de 12 px, sem borda nem sombra; status em chips suaves. O número da visita é um botão
 * de verdade (teclado/leitor de tela); o resto do cartão também abre com o mouse/toque.
 * O PDF fica fora do botão (não pode haver controle dentro de controle) e mantém o
 * vermelho do projeto.
 */
interface Props {
    visit: OrderVisit;
    onClick?: () => void;
}

const SUSPENDED = 6;
const OS_HIDDEN = 8;

export const OrderVisitCardListItemV2: React.FC<Props> = ({ visit, onClick }) => {
    const where = [visit.clientName, visit.unitDescription || 'N/A'].filter(Boolean).join(' · ');
    const osLabel = visit.ovOStatusDescription || (visit.ovOStatusId ? getStatusConfig(visit.ovOStatusId).label : '');
    const processing = visit.processingDescription || visit.statusDescription;
    const suspended = visit.ovOStatusId === SUSPENDED;

    return (
        <div
            id={`visit-item-${visit.id}`}
            onClick={onClick}
            className={`bg-surface rounded-card p-4 ${onClick ? 'cursor-pointer transition-transform duration-150 active:scale-[0.99]' : ''}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    {onClick ? (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onClick(); }}
                            className="block max-w-full truncate rounded text-left text-headline text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                            {visit.ovMask}
                        </button>
                    ) : (
                        <h3 className="truncate text-headline text-fg">{visit.ovMask}</h3>
                    )}
                    <p className="mt-0.5 truncate text-label font-normal text-fg-muted">{where}</p>
                    <p className="mt-1 text-caption text-fg-muted">
                        {formatDateTime(visit.ovStartedAt)} - {formatDateTime(visit.ovEndedAt)}
                    </p>
                    <p className="mt-1 truncate text-caption text-fg-muted">
                        {visit.teamCode || '---'}{visit.teamLeaderName ? ` · ${visit.teamLeaderName}` : ''}
                    </p>
                    {visit.planDescription && (
                        <p className="mt-1 truncate text-caption text-fg-subtle">{visit.planDescription}</p>
                    )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {processing && (
                        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-caption font-medium text-fg-muted">{processing}</span>
                    )}
                    {visit.ovOStatusId !== OS_HIDDEN && osLabel && (
                        <span className={`rounded-full px-2.5 py-1 text-caption font-medium ${suspended ? 'bg-warning-soft text-warning' : 'bg-info-soft text-info'}`}>
                            {osLabel}
                        </span>
                    )}
                    {suspended && visit.ovOSuspendedReasonDescription && (
                        <span className="line-clamp-1 max-w-[140px] text-caption text-fg-muted" title={visit.ovOSuspendedReasonDescription}>
                            {visit.ovOSuspendedReasonDescription}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
                {visit.progress !== undefined && (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div
                            role="progressbar"
                            aria-label="Progresso da visita"
                            aria-valuenow={visit.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
                        >
                            <div className="h-full bg-brand" style={{ width: `${visit.progress}%` }} />
                        </div>
                        <span className="text-caption font-medium text-fg">{visit.progress}%</span>
                    </div>
                )}
                {visit.progress === undefined && <div className="flex-1" />}
                {visit.totalValue !== undefined && visit.totalValue > 0 && (
                    <span className="rounded-full bg-success-soft px-2.5 py-1 text-caption font-semibold text-success">
                        {formatCurrency(visit.totalValue)}
                    </span>
                )}
                <div onClick={(e) => e.stopPropagation()}>
                    <VisitReportPDFButton visitId={visit.id} visitMask={visit.ovMask} variant="action" />
                </div>
            </div>
        </div>
    );
};
