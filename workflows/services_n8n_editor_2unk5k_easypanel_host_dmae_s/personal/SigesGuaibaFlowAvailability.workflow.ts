import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SigesGuaibaFlowAvailability
// Nodes   : 9  |  Connections: 8
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ScheduleTrigger                  scheduleTrigger
// Settings                         set
// GetGuaibaFlowStatus              httpRequest                [creds] [retry]
// GetIntegration                   postgres                   [creds]
// NormalizeStations                code
// DryRunCheck                      if
// ObservationOnly                  code
// IngestAvailability               postgres                   [creds]
// CheckIngestResults               code
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ScheduleTrigger
//   → Settings
//     → GetGuaibaFlowStatus
//       → GetIntegration
//         → NormalizeStations
//           → DryRunCheck
//             .out(0) → ObservationOnly
//             .out(1) → IngestAvailability → CheckIngestResults
// </workflow-map>
//
// Adaptador do provedor GuaibaFlow (https://guaibaflow.com.br/api-status.php).
// Contrato observado:
//   { "versao": "v1", "gerado_em": "...-03:00",
//     "estacoes": [{ "id": "24", "nome": "...", "status": "ON|OFF",
//                    "motivo": null, "ultima_leitura": "...-03:00" }] }
// Regras explícitas:
//   ON  → available
//   OFF → unavailable, motivo externo normalizado para "INDISPONIVEL"
//         (a integração deve mapear reason_map.INDISPONIVEL = 35)
//   ultima_leitura é o timestamp da fonte (exige offset)
//   gerado_em identifica a leitura para idempotência
//
// MODO DE OBSERVAÇÃO: Settings.dryRun = true por padrão. Nesse modo o
// workflow apenas normaliza e mostra estações/mapeamentos; não chama a RPC.
// Trocar para false somente após revisar uma execução real.

@workflow({
    name: 'SigesGuaibaFlowAvailability',
    active: false,
    settings: { executionOrder: 'v1' },
})
export class SigesGuaibaFlowAvailabilityWorkflow {
    @node({
        id: 'b43873f4-d032-441c-a24e-55240134d1a3',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.4,
        position: [0, 0],
    })
    ScheduleTrigger = {
        rule: {
            interval: [
                {
                    field: 'minutes',
                    minutesInterval: 5,
                },
            ],
        },
    };

    // Liga/desliga a escrita e permite reutilizar o arquivo por provedor.
    @node({
        id: '96f31f08-0da5-4c94-adf3-2f2aaf7d791c',
        name: 'Settings',
        type: 'n8n-nodes-base.set',
        version: 3.5,
        position: [220, 0],
    })
    Settings = {
        mode: 'manual',
        includeOtherFields: false,
        assignments: [
            {
                name: 'dryRun',
                value: true,
                type: 'boolean',
            },
            {
                name: 'providerCode',
                value: 'guaibaflow',
                type: 'string',
            },
        ],
    };

    // Credential "Bearer Auth" (httpBearerAuth) chamada "GuaibaFlow API".
    // O token não fica no workflow.
    @node({
        id: '4d0ddce5-c3c4-44a1-8fc7-8f0f382e70ad',
        name: 'Get GuaibaFlow Status',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.5,
        position: [440, 0],
        credentials: { httpBearerAuth: { id: '', name: 'GuaibaFlow API' } },
        retryOnFail: true,
    })
    GetGuaibaFlowStatus = {
        method: 'GET',
        url: 'https://guaibaflow.com.br/api-status.php',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBearerAuth',
        options: {
            timeout: 30000,
        },
    };

    // Credencial Postgres existente do SIGES (mesmo padrão dos demais workflows).
    @node({
        id: 'ab01ac79-b107-4954-a43a-b4058ffa4874',
        name: 'Get Integration',
        type: 'n8n-nodes-base.postgres',
        version: 2.7,
        position: [660, 0],
        credentials: { postgres: { id: 'saGmJEgCsB02w78r', name: 'SIGES Postgres' } },
        alwaysOutputData: true,
    })
    GetIntegration = {
        operation: 'executeQuery',
        query: `SELECT
    i.id AS integration_id,
    i.name,
    i.company_id,
    i.config,
    COALESCE(
        (
            SELECT jsonb_object_agg(m.external_id, m.unit_asset_tag_id)
            FROM public.cfg_assets_available_integrations_mappings m
            WHERE m.integration_id = i.id
              AND m.is_active IS TRUE
        ),
        '{}'::jsonb
    ) AS mappings
FROM public.cfg_assets_available_integrations i
WHERE i.provider_code = '{{ $json.providerCode }}'
  AND i.is_active IS TRUE
ORDER BY i.id
LIMIT 1;`,
        options: {},
    };

    @node({
        id: 'a537817f-4252-430f-8a9e-93cf81381764',
        name: 'Normalize Stations',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [880, 0],
    })
    NormalizeStations = {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
        jsCode: `// Adaptador GuaibaFlow → contrato canônico v1 do SIGES.
const settings = $('Settings').first().json;
const integration = $input.first().json;
const response = $('Get GuaibaFlow Status').first().json;

function fail(message) {
    throw new Error('GuaibaFlow: ' + message);
}

const integrationId = Number(integration.integration_id);
if (!Number.isInteger(integrationId)) {
    fail('integração ativa com provider_code "' + settings.providerCode + '" não encontrada');
}

if (!response || !Array.isArray(response.estacoes)) {
    fail('resposta sem o array "estacoes"');
}

const geradoEm = response.gerado_em;
const offsetPattern = /(Z|[+-][0-9]{2}:[0-9]{2})$/;
if (
    typeof geradoEm !== 'string' ||
    !offsetPattern.test(geradoEm) ||
    Number.isNaN(Date.parse(geradoEm))
) {
    fail('gerado_em ausente ou sem offset válido');
}

const mappings = integration.mappings || {};
const items = [];
const observation = [];
const errors = [];
const seen = new Set();

for (const estacao of response.estacoes) {
    if (!estacao || typeof estacao !== 'object') {
        errors.push('estação inválida na resposta');
        continue;
    }

    const externalId = estacao.id !== null && estacao.id !== undefined
        ? String(estacao.id).trim()
        : '';
    if (!externalId) {
        errors.push('estação sem id');
        continue;
    }
    if (seen.has(externalId)) {
        errors.push('id ' + externalId + ' duplicado na resposta');
        continue;
    }
    seen.add(externalId);

    const externalStatus = typeof estacao.status === 'string'
        ? estacao.status.trim()
        : '';
    let canonicalStatus = null;
    if (externalStatus === 'ON') {
        canonicalStatus = 'available';
    } else if (externalStatus === 'OFF') {
        canonicalStatus = 'unavailable';
    } else {
        errors.push('id ' + externalId + ': status desconhecido "' + externalStatus + '"');
        continue;
    }

    const reportedAt = estacao.ultima_leitura;
    if (
        typeof reportedAt !== 'string' ||
        !offsetPattern.test(reportedAt) ||
        Number.isNaN(Date.parse(reportedAt))
    ) {
        errors.push('id ' + externalId + ': ultima_leitura inválida/sem offset');
        continue;
    }

    // Motivo externo não é enviado como texto livre. A regra explícita é:
    // qualquer indisponibilidade usa o motivo interno 35 via reason_map.
    const reason = canonicalStatus === 'unavailable' ? 'INDISPONIVEL' : null;

    items.push({
        external_id: externalId,
        status: canonicalStatus,
        source_reported_at: reportedAt,
        source_event_id: 'guaibaflow:' + geradoEm + ':' + externalId,
        reason,
    });

    observation.push({
        external_id: externalId,
        name: estacao.nome || null,
        external_status: externalStatus,
        source_reported_at: reportedAt,
        mapped_unit_asset_tag_id: mappings[externalId] !== undefined
            ? mappings[externalId]
            : null,
    });
}

if (errors.length > 0) {
    fail(errors.join(' | '));
}
if (items.length === 0) {
    fail('nenhuma estação válida na resposta');
}

const missingMappings = items
    .filter(item => mappings[item.external_id] === undefined)
    .map(item => item.external_id);

return [
    {
        json: {
            providerCode: settings.providerCode,
            integrationId,
            dryRun: settings.dryRun === true,
            observedAt: geradoEm,
            stationCount: items.length,
            items,
            observation,
            missingMappings,
        },
    },
];`,
    };

    @node({
        id: '770079cc-3012-4b1a-8da6-1ddd9946f901',
        name: 'Dry Run?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1100, 0],
    })
    DryRunCheck = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
            },
            conditions: [
                {
                    id: 'dry-run-check',
                    leftValue: '={{ $json.dryRun }}',
                    rightValue: true,
                    operator: {
                        type: 'boolean',
                        operation: 'equals',
                    },
                },
            ],
            combinator: 'and',
        },
        looseTypeValidation: false,
    };

    @node({
        id: '6b8b23e9-9930-4f7c-befd-25c3ac59c73f',
        name: 'Observation Only',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1320, -120],
    })
    ObservationOnly = {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
        jsCode: `const payload = $input.first().json;

return [
    {
        json: {
            mode: 'observation',
            providerCode: payload.providerCode,
            integrationId: payload.integrationId,
            observedAt: payload.observedAt,
            stationCount: payload.stationCount,
            missingMappings: payload.missingMappings,
            observation: payload.observation,
            canonicalItems: payload.items,
        },
    },
];`,
    };

    @node({
        id: 'e56facc8-4123-460f-abb2-63b3707239f6',
        name: 'Ingest Availability',
        type: 'n8n-nodes-base.postgres',
        version: 2.7,
        position: [1320, 120],
        credentials: { postgres: { id: 'saGmJEgCsB02w78r', name: 'SIGES Postgres' } },
    })
    IngestAvailability = {
        operation: 'executeQuery',
        query: `SELECT *
FROM public.fn_ingest_asset_availability(
    {{ $json.integrationId }}::bigint,
    {{ JSON.stringify($json.items) }}::jsonb
);`,
        options: {},
    };

    @node({
        id: '0616e28a-ef5d-423f-80ed-1c84026c4a79',
        name: 'Check Ingest Results',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1540, 120],
    })
    CheckIngestResults = {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
        jsCode: `const rows = $input.all().map(item => item.json);

const count = result => rows.filter(row => row.result === result).length;
const errors = rows.filter(row => row.result === 'error');

const summary = {
    total: rows.length,
    applied: count('applied'),
    unchanged: count('unchanged'),
    duplicate: count('duplicate'),
    pendingMapping: count('pending_mapping'),
    rejected: count('rejected'),
    error: errors.length,
    results: rows,
};

if (errors.length > 0) {
    throw new Error(
        'Ingestão com ' + errors.length + ' erro(s): ' +
        errors
            .map(row => String(row.external_id) + ': ' + String(row.message))
            .join(' | ')
    );
}

return [{ json: summary }];`,
    };

    @links()
    defineRouting() {
        this.ScheduleTrigger.out(0).to(this.Settings.in(0));
        this.Settings.out(0).to(this.GetGuaibaFlowStatus.in(0));
        this.GetGuaibaFlowStatus.out(0).to(this.GetIntegration.in(0));
        this.GetIntegration.out(0).to(this.NormalizeStations.in(0));
        this.NormalizeStations.out(0).to(this.DryRunCheck.in(0));
        this.DryRunCheck.out(0).to(this.ObservationOnly.in(0));
        this.DryRunCheck.out(1).to(this.IngestAvailability.in(0));
        this.IngestAvailability.out(0).to(this.CheckIngestResults.in(0));
    }
}
