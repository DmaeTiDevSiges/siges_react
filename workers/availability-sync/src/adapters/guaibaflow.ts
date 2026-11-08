/**
 * Adaptador GuaibaFlow → contrato canônico v1 do SIGES.
 *
 * API: GET https://guaibaflow.com.br/api-status.php (ajuda em /api-ajuda.php)
 * Contrato observado:
 *   { "versao": "v1", "gerado_em": "...-03:00", "atraso_max_min": 60,
 *     "estacoes": [{ "id": "24", "nome": "...", "status": "ON|OFF",
 *                    "motivo": null, "ultima_leitura": "...-03:00" }] }
 *
 * Regras explícitas:
 *   ON  → available
 *   OFF → unavailable, motivo externo normalizado para "INDISPONIVEL"
 *         (a integração deve mapear config.reason_map.INDISPONIVEL → id interno)
 *   ultima_leitura é o horário da fonte (exige offset)
 *   gerado_em + id compõem o source_event_id (idempotência)
 *
 * Qualquer desvio (status desconhecido, data sem offset, id duplicado, versão
 * diferente de v1) falha o lote inteiro: mudança de formato do fornecedor deve
 * ser observável e nunca gerar atualização incorreta.
 */

import type { Adapter, CanonicalItem, NormalizeResult, ObservationRow } from './types';

export const GUAIBAFLOW_URL = 'https://guaibaflow.com.br/api-status.php';

const OFFSET_PATTERN = /(Z|[+-][0-9]{2}:[0-9]{2})$/;

function isIsoWithOffset(value: unknown): value is string {
    return typeof value === 'string' && OFFSET_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

function fail(message: string): never {
    throw new Error('GuaibaFlow: ' + message);
}

export function normalizeGuaibaFlow(
    response: unknown,
    mappings: Record<string, number>,
): NormalizeResult {
    if (!response || typeof response !== 'object') {
        fail('resposta não é um objeto JSON');
    }
    const body = response as Record<string, unknown>;

    if (body.versao !== 'v1') {
        fail('versão de contrato inesperada: ' + String(body.versao).slice(0, 20));
    }
    if (!Array.isArray(body.estacoes)) {
        fail('resposta sem o array "estacoes"');
    }

    const geradoEm = body.gerado_em;
    if (!isIsoWithOffset(geradoEm)) {
        fail('gerado_em ausente ou sem offset válido');
    }

    const items: CanonicalItem[] = [];
    const observation: ObservationRow[] = [];
    const errors: string[] = [];
    const seen = new Set<string>();

    for (const raw of body.estacoes as unknown[]) {
        if (!raw || typeof raw !== 'object') {
            errors.push('estação inválida na resposta');
            continue;
        }
        const estacao = raw as Record<string, unknown>;

        const externalId =
            estacao.id !== null && estacao.id !== undefined ? String(estacao.id).trim() : '';
        if (!externalId) {
            errors.push('estação sem id');
            continue;
        }
        if (seen.has(externalId)) {
            errors.push('id ' + externalId + ' duplicado na resposta');
            continue;
        }
        seen.add(externalId);

        const externalStatus = typeof estacao.status === 'string' ? estacao.status.trim() : '';
        let status: CanonicalItem['status'];
        if (externalStatus === 'ON') {
            status = 'available';
        } else if (externalStatus === 'OFF') {
            status = 'unavailable';
        } else {
            errors.push('id ' + externalId + ': status desconhecido "' + externalStatus.slice(0, 40) + '"');
            continue;
        }

        const reportedAt = estacao.ultima_leitura;
        if (!isIsoWithOffset(reportedAt)) {
            errors.push('id ' + externalId + ': ultima_leitura inválida/sem offset');
            continue;
        }

        // Motivo externo não segue como texto livre: toda indisponibilidade usa o
        // código fixo "INDISPONIVEL", traduzido pelo reason_map da integração.
        items.push({
            external_id: externalId,
            status,
            source_reported_at: reportedAt,
            source_event_id: 'guaibaflow:' + geradoEm + ':' + externalId,
            reason: status === 'unavailable' ? 'INDISPONIVEL' : null,
        });

        observation.push({
            external_id: externalId,
            name: typeof estacao.nome === 'string' ? estacao.nome : null,
            external_status: externalStatus,
            external_reason: typeof estacao.motivo === 'string' ? estacao.motivo : null,
            source_reported_at: reportedAt,
            mapped_unit_asset_tag_id: mappings[externalId] ?? null,
        });
    }

    if (errors.length > 0) {
        fail(errors.join(' | '));
    }
    if (items.length === 0) {
        fail('nenhuma estação na resposta');
    }

    return {
        observedAt: geradoEm,
        items,
        observation,
        missingMappings: items.filter(i => mappings[i.external_id] === undefined).map(i => i.external_id),
    };
}

export const guaibaflowAdapter: Adapter = {
    code: 'guaibaflow',
    defaultUrl: GUAIBAFLOW_URL,
    allowedHosts: ['guaibaflow.com.br'],
    buildRequest(url, apiKey, userAgent) {
        return new Request(url, {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + apiKey,
                Accept: 'application/json',
                // Sem User-Agent próprio o servidor da GuaibaFlow responde 403.
                'User-Agent': userAgent,
            },
        });
    },
    normalize: normalizeGuaibaFlow,
};
