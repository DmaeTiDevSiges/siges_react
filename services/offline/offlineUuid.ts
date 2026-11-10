/**
 * Leitura do UUID offline das operações guardadas na fila (sem dependências —
 * usado também nos testes). Coluna no banco: offline_uuid (migration 20261125;
 * antes client_uuid).
 */

/**
 * UUID de uma operação guardada na fila. APKs anteriores gravavam a chave
 * `clientUuid`; os novos, `offlineUuid` — a fila do aparelho pode ter os dois.
 */
export const offlineUuidOf = (opts: unknown): string | undefined => {
    const o = (opts || {}) as { offlineUuid?: unknown; clientUuid?: unknown };
    const v = o.offlineUuid ?? o.clientUuid;
    return typeof v === 'string' && v ? v : undefined;
};

/** Idem para o veículo do líder no "Iniciar visita". */
export const vehicleOfflineUuidOf = (opts: unknown): string | undefined => {
    const o = (opts || {}) as { vehicleOfflineUuid?: unknown; vehicleClientUuid?: unknown };
    const v = o.vehicleOfflineUuid ?? o.vehicleClientUuid;
    return typeof v === 'string' && v ? v : undefined;
};
