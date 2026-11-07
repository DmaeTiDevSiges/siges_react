import { AssetLoanRecordType } from '../../types';

// Rótulos por tipo de registro (assets_loans.record_type).
// Recebimento e Cedência têm o mesmo formulário/relatório; só os textos mudam.

interface RecordTypeConfig {
    label: string;
    /** Rótulo do campo borrower_name para este tipo. */
    personLabel: string;
    personPlaceholder: string;
    icon: string;
    reportTitle: string;
    /** Vistoria única (sem devolução). */
    isSingle: boolean;
}

export const RECORD_TYPE_CONFIG: Record<AssetLoanRecordType, RecordTypeConfig> = {
    loan: {
        label: 'Empréstimo',
        personLabel: 'Solicitante',
        personPlaceholder: 'Nome de quem está pegando o ativo emprestado',
        icon: 'handshake',
        reportTitle: 'Relatório de Empréstimo de Ativo',
        isSingle: false,
    },
    receipt: {
        label: 'Recebimento',
        personLabel: 'Entregue por',
        personPlaceholder: 'Nome de quem está entregando o ativo',
        icon: 'move_to_inbox',
        reportTitle: 'Relatório de Vistoria de Recebimento de Ativo',
        isSingle: true,
    },
    cedencia: {
        label: 'Cedência',
        personLabel: 'Cedido para',
        personPlaceholder: 'Nome de quem está recebendo o ativo cedido',
        icon: 'outbox',
        reportTitle: 'Relatório de Vistoria de Cedência de Ativo',
        isSingle: true,
    },
};

export const RECORD_TYPES: AssetLoanRecordType[] = ['loan', 'receipt', 'cedencia'];

export const getRecordTypeConfig = (type?: string): RecordTypeConfig =>
    RECORD_TYPE_CONFIG[(type as AssetLoanRecordType) || 'loan'] || RECORD_TYPE_CONFIG.loan;

export const isSingleInspection = (type?: string): boolean => getRecordTypeConfig(type).isSingle;
