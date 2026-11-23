import type {
    AssetAlert, AssetAttribute, AssetActivityEntry, AssetLoan, AssetMaterial, TechnicalManualFile,
} from '../types';
import type { AssetTabSection } from '../components/reports/AssetTabReportDocument';
import { formatCurrency, formatDate, formatDateTime } from './formatters';
import { ACTIVITY_MONTH_LABELS, buildAssetActivityMatrix } from './assetActivityMatrix';
import { getRecordTypeConfig } from '../components/assetLoans/assetLoanRecordTypes';

/**
 * Montagem das seções de PDF de cada aba do Detalhe do Ativo.
 * Funções puras (sem React/rede) para o conteúdo do PDF ficar testável.
 */

/** Valor de um atributo dinâmico como aparece na tela (rótulo do select, R$, data). */
export const formatAttributeDisplayValue = (
    attr: AssetAttribute,
    value: string | undefined,
    groupOptions: Record<string, { value: string; label: string }[]> = {},
): string => {
    if (!value) return '-';
    if (attr.dataType === 'boolean') return value === 'true' ? 'Sim' : 'Não';
    if (attr.dataType === 'select') {
        let options = attr.selectOptions || [];
        if (attr.selectOptionsGroupId && groupOptions[attr.selectOptionsGroupId]) {
            options = groupOptions[attr.selectOptionsGroupId];
        }
        return options.find(opt => opt.value === value)?.label ?? value;
    }
    if (attr.fieldKey === 'acquisition_value') return formatCurrency(Number(value));
    if (attr.fieldKey === 'acquisition_at') return formatDate(value);
    return value;
};

const LOAN_STATUS_LABELS: Record<string, string> = {
    analysis: 'Em análise',
    pending: 'Pendente',
    closed: 'Encerrado',
    overdue: 'Atrasado',
};

export const buildAlertsSections = (alerts: AssetAlert[]): AssetTabSection[] => [{
    columns: [
        { label: 'Prioridade', flex: 1 },
        { label: 'Tipo', flex: 1.2 },
        { label: 'Descrição', flex: 3 },
        { label: 'Criado em', flex: 1.3 },
        { label: 'Situação', flex: 1.3 },
        { label: 'OS', flex: 1 },
    ],
    rows: alerts.map(a => [
        a.priorityName || '-',
        a.orderTypeName || '-',
        a.description || '-',
        a.createdAt ? formatDateTime(a.createdAt) : '-',
        a.isDone ? `Resolvido${a.resolvedAt ? ` em ${formatDate(a.resolvedAt)}` : ''}` : 'Aberto',
        a.orderMask || '-',
    ]),
    emptyText: 'Nenhum alerta.',
}];

export const buildLoansSections = (loans: AssetLoan[]): AssetTabSection[] => [{
    columns: [
        { label: 'Tipo', flex: 1.2 },
        { label: 'Pessoa', flex: 2 },
        { label: 'Responsável', flex: 2 },
        { label: 'Registro', flex: 1.4 },
        { label: 'Prev. devolução', flex: 1.2 },
        { label: 'Devolução', flex: 1.2 },
        { label: 'Situação', flex: 1 },
    ],
    rows: loans.map(l => {
        const status = l.computedStatus || l.status;
        return [
            getRecordTypeConfig(l.recordType).label,
            l.borrowerName || '-',
            l.lenderNameShort || l.lenderName || '-',
            l.createdAt ? formatDateTime(l.createdAt) : '-',
            l.expectedReturnDate ? formatDate(l.expectedReturnDate) : '-',
            l.actualReturnDate ? formatDate(l.actualReturnDate) : '-',
            LOAN_STATUS_LABELS[status] || status,
        ];
    }),
    emptyText: 'Nenhum empréstimo, recebimento ou cedência.',
}];

export const buildActivitiesSections = (entries: AssetActivityEntry[], year: number): AssetTabSection[] => {
    const matrix = buildAssetActivityMatrix(entries, year);
    return [{
        columns: [
            { label: 'Unidade / Setor / Posição', flex: 4 },
            { label: 'Atividade', flex: 4 },
            ...ACTIVITY_MONTH_LABELS.map(label => ({ label, flex: 0.9, align: 'center' as const })),
            { label: 'Total', flex: 1.2, align: 'center' as const },
        ],
        rows: matrix.rows.map(r => [
            [r.unitDescription || 'Unidade não informada', r.tagDescription || 'Setor não informado', r.tagSubDescription || 'Posição não informada'].join(' / '),
            r.activityDescription,
            ...r.months.map(String),
            String(r.total),
        ]),
        footerRow: ['Total do ano', '', ...matrix.monthTotals.map(String), String(matrix.total)],
        emptyText: `Nenhuma atividade em visitas aprovadas em ${year}.`,
    }];
};

const FILE_TYPE_LABELS: Record<string, string> = { image: 'Imagem', pdf: 'PDF', doc: 'Documento', excel: 'Planilha' };

export const buildManualsSections = (
    manuals: { id: string; code?: string; description: string; files?: TechnicalManualFile[] }[],
): AssetTabSection[] => [{
    columns: [
        { label: 'Manual', flex: 3 },
        { label: 'Arquivo', flex: 3 },
        { label: 'Tipo', flex: 1 },
        { label: 'Categoria', flex: 1.5 },
    ],
    rows: manuals.flatMap(m => {
        const name = [m.code, m.description].filter(Boolean).join(' - ');
        if (!m.files || m.files.length === 0) return [[name, 'Sem arquivos', '-', '-']];
        return m.files.map(f => [
            name,
            f.docFileName,
            FILE_TYPE_LABELS[f.fileType] || f.fileType || '-',
            f.tmCategoryDescription || '-',
        ]);
    }),
    emptyText: 'Nenhum manual técnico associado a este ativo.',
}];

export const buildComponentsSections = (components: AssetMaterial[]): AssetTabSection[] => [{
    columns: [
        { label: 'Código', flex: 1.2 },
        { label: 'Descrição', flex: 3 },
        { label: 'Qtd', flex: 0.7, align: 'center' },
        { label: 'Un', flex: 0.6, align: 'center' },
        { label: 'Marca / Modelo', flex: 1.6 },
        { label: 'Série', flex: 1.3 },
        { label: 'Local', flex: 1.3 },
        { label: 'Original', flex: 0.9, align: 'center' },
    ],
    rows: components.map(c => [
        c.materialCode || '-',
        c.materialDescription || '-',
        String(c.amount ?? '-'),
        c.materialUnit || '-',
        c.brandModel || '-',
        c.serial || '-',
        c.location || '-',
        c.isOriginal ? 'Sim' : 'Não',
    ]),
    emptyText: 'Nenhum componente cadastrado.',
}];
