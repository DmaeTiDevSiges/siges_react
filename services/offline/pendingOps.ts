import type { OutboxOp, OutboxStatus } from './outbox';

/**
 * Tela de pendências (F5, item 5.1) — regras sem interface (testáveis).
 *
 *   OP_LABELS        nome em português de cada operação da fila
 *   statusInfo       como mostrar pendente / erro / recusada
 *   dependentsOf     o que precisa ser descartado junto (ex.: alterações de um
 *                    material criado offline, se a inclusão for descartada)
 *   groupByVisit     agrupa por visita para a tela
 */

export const OP_LABELS: Record<string, string> = {
    // Relatório do ativo
    updateOrderVisitAsset: 'Dados do relatório do ativo',
    updateOrderVisitAssetPlan: 'Plano de manutenção do ativo',
    updateOrderVisitAssetProgress: 'Progresso do checklist',
    toggleOrderVisitAssetActivity: 'Atividade do ativo',
    upsertMaintenanceChecklistItem: 'Item do checklist',
    deleteMaintenanceChecklistItem: 'Item do checklist (limpar)',
    updateAssetAlert: 'Alerta do ativo',
    reportedOrderVisitAsset: 'Relatar ativo',
    // Fotos e assinaturas
    uploadOrderVisitAssetPhoto: 'Foto do ativo',
    removeOrderVisitAssetPhoto: 'Remover foto do ativo',
    uploadChecklistImage: 'Foto do checklist',
    removeChecklistImage: 'Remover foto do checklist',
    saveOrderVisitSignature: 'Assinatura',
    deleteOrderVisitSignature: 'Remover assinatura',
    // Materiais, serviços, veículos, equipe, ativos
    addMaterialToAsset: 'Incluir material',
    updateMaterialInAsset: 'Quantidade de material',
    removeMaterialFromAsset: 'Remover material',
    addServiceToOrderVisit: 'Incluir serviço',
    updateOrderVisitService: 'Quantidade de serviço',
    removeServiceFromOrderVisit: 'Remover serviço',
    addVehicleToOrderVisit: 'Incluir veículo',
    updateVehicleKm: 'Km do veículo',
    removeVehicleFromOrderVisit: 'Remover veículo',
    addTeamMember: 'Incluir membro da equipe',
    removeTeamMember: 'Remover membro da equipe',
    addAssetToOrderVisit: 'Incluir ativo na visita',
    removeAssetFromOrderVisit: 'Remover ativo da visita',
    // Visita
    startOrderVisit: 'Iniciar visita',
    reportOrderVisit: 'Relatar visita',
    closeOrderVisit: 'Encerrar visita',
};

export const opLabel = (method: string): string => OP_LABELS[method] ?? method;

export const statusInfo = (status: OutboxStatus): { label: string; tone: 'pending' | 'error' | 'conflict' } =>
    status === 'error'
        ? { label: 'Não enviada (erro)', tone: 'error' }
        : status === 'conflict'
            ? { label: 'Recusada', tone: 'conflict' }
            : { label: 'Aguardando envio', tone: 'pending' };

/** Mensagem do servidor/app em linguagem do técnico. */
export const friendlyError = (op: Pick<OutboxOp, 'status' | 'lastError'>): string | undefined => {
    const raw = op.lastError?.trim();
    if (op.status === 'conflict') {
        return raw || 'Outra pessoa alterou isto enquanto você estava sem internet. Esta alteração não foi enviada.';
    }
    if (!raw) return undefined;
    if (/permission denied|42501|row-level security/i.test(raw)) return 'Sem permissão para esta alteração no servidor.';
    if (/ainda não chegou ao servidor/i.test(raw)) return raw;
    return raw;
};

/** UUIDs de linhas criadas por esta operação (options.offlineUuid; fila antiga: clientUuid) → ids "tmp:<uuid>". */
const createdTmpIds = (op: Pick<OutboxOp, 'args'>): string[] => {
    const out: string[] = [];
    const walk = (v: unknown) => {
        if (!v || typeof v !== 'object') return;
        if (Array.isArray(v)) return v.forEach(walk);
        const rec = v as Record<string, unknown>;
        // offlineUuid (item/ativo/visita) e outros *OfflineUuid (ex.: vehicleOfflineUuid do "Iniciar visita").
        // Fila de APK anterior: mesmas chaves com "ClientUuid".
        for (const [k, val] of Object.entries(rec)) {
            if (/(offline|client)uuid$/i.test(k) && typeof val === 'string' && val) out.push(`tmp:${val}`);
        }
        Object.values(rec).forEach(walk);
    };
    walk(op.args);
    return out;
};

/**
 * Operações que deixam de fazer sentido se `op` for descartada: as que citam
 * um id "tmp:" criado por ela (em qualquer argumento ou como ovaId), em cadeia
 * (ativo criado offline → material incluído nele → quantidade do material).
 */
export const dependentsOf = (op: OutboxOp, all: OutboxOp[]): OutboxOp[] => {
    const result: OutboxOp[] = [];
    const seen = new Set<string>([op.id]);
    let frontier = [op];
    while (frontier.length) {
        const tmpIds = frontier.flatMap(createdTmpIds);
        frontier = [];
        if (!tmpIds.length) break;
        for (const other of all) {
            if (seen.has(other.id)) continue;
            const json = JSON.stringify(other.args ?? []);
            if (tmpIds.some(t => json.includes(`"${t}"`) || other.ovaId === t || other.visitId === t)) {
                seen.add(other.id);
                result.push(other);
                frontier.push(other);
            }
        }
    }
    return result.sort((a, b) => a.seq - b.seq);
};

export interface PendingGroup {
    visitId: string | null;
    ops: OutboxOp[];
}

/** Agrupa por visita (na ordem da 1ª operação de cada uma); sem visita vai no fim. */
export const groupByVisit = (ops: OutboxOp[]): PendingGroup[] => {
    const sorted = [...ops].sort((a, b) => a.seq - b.seq);
    const groups = new Map<string, PendingGroup>();
    for (const op of sorted) {
        const key = op.visitId ?? '';
        if (!groups.has(key)) groups.set(key, { visitId: op.visitId ?? null, ops: [] });
        groups.get(key)!.ops.push(op);
    }
    const list = Array.from(groups.values());
    return [...list.filter(g => g.visitId), ...list.filter(g => !g.visitId)];
};
