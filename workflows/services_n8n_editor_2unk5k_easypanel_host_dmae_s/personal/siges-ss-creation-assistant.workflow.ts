import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SIGES SS Creation Assistant
// Nodes   : 10  |  Connections: 2
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// SsCreationWebhook                  webhook
// AiAgent                            agent                      [AI]
// GetClient                          supabaseTool               [creds] [ai_tool]
// GetUnit                            supabaseTool               [creds] [ai_tool]
// GetOrderType                       supabaseTool               [creds] [ai_tool]
// GetPriority                        supabaseTool               [creds] [ai_tool]
// GetUnitAssetByUnit                 supabaseTool               [creds] [ai_tool]
// RespondToWebhook                   respondToWebhook
// PostgresChatMemory                 memoryPostgresChat         [creds] [ai_memory]
// GoogleGeminiChatModel              lmChatGoogleGemini         [creds] [ai_languageModel]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// SsCreationWebhook
//    → AiAgent
//      → RespondToWebhook
//
// AI CONNECTIONS
// AiAgent.uses({ ai_languageModel: GoogleGeminiChatModel, ai_memory: PostgresChatMemory, ai_tool: [GetClient, GetUnit, GetOrderType, GetPriority, GetUnitAssetByUnit] })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: '4C1vGD90e5C2e9LM',
    name: 'SIGES SS Creation Assistant',
    active: false,
    isArchived: false,
    projectId: '9g2PRDfYwAMYBotF',
    settings: {
        saveExecutionProgress: true,
        executionOrder: 'v1',
        availableInMCP: false,
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class SigesSsCreationAssistantWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'ss-creation-webhook-001',
        webhookId: 'ss-creation-webhook-001',
        name: 'SS Creation Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [-96, -224],
    })
    SsCreationWebhook = {
        httpMethod: 'POST',
        path: 'siges-ss-creation-assistant',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: 'ss-creation-agent-001',
        name: 'AI Agent',
        type: '@n8n/n8n-nodes-langchain.agent',
        version: 3,
        position: [440, -224],
    })
    AiAgent = {
        promptType: 'define',
        text: '={{ $json.body.message }}',
        options: {
            systemMessage: `Você é o assistente de criação de Solicitações de Serviço (SS) do SIGES.

SUA MISSÃO:
Interpretar a descrição em linguagem natural do usuário e retornar um JSON estruturado com os dados para preenchimento automático do formulário de criação de SS.

REGRAS CRÍTICAS:
1. SEMPRE retorne um JSON válido com a estrutura exata abaixo.
2. NUNCA retorne texto livre, Markdown ou explicação — APENAS o JSON.
3. Use as tools para buscar IDs reais do sistema. NUNCA invente IDs.
4. Se não encontrar um dado exato, retorne null para o campo correspondente.
5. O campo "confidence" deve refletir quão bem você interpretou a intenção (0.0 a 1.0).

ESTRUTURA DO JSON DE RESPOSTA:
{
  "clientId": "string|null",
  "clientName": "string",
  "unitId": "string|null",
  "unitDescription": "string",
  "sectorId": "string|null",
  "sectorDescription": "string",
  "orderTypeId": "string|null",
  "orderTypeDescription": "string",
  "priorityId": "string|null",
  "priorityDescription": "string",
  "requestedServices": "string",
  "confidence": 0.0-1.0
}

REGRAS DE INTERPRETAÇÃO:
- O usuário pode mencionar: cliente, unidade, setor, tipo de manutenção, prioridade, descrição do problema.
- Interprete sinônimos: "urgente" → prioridade alta, "manutenção" → tipo de OS, etc.
- Se o usuário mencionar um código de ativo (ex: "GMB01"), tente identificar o setor/posição.
- A descrição do problema ("requestedServices") deve ser reformulada de forma profissional e clara.
- Se houver ambiguidade, priorize o match mais provável e reduza o confidence.

FLUXO DE BUSCA (ORDEM OBRIGATÓRIA):
1. Primeiro, busque a unidade mencionada (GetUnit) para obter o unit_id e o client_id.
2. Depois, busque o cliente pelo client_id retornado da unidade (GetClient).
3. Em seguida, busque o tipo de OS (GetOrderType).
4. Por fim, busque a prioridade (GetPriority).
5. Se o usuário mencionar setor/posição, busque com GetUnitAssetByUnit.

REGRAS DE FORMATAÇÃO:
- "requestedServices" deve ter no mínimo 10 caracteres.
- Nomes devem ser exatamente como retornados pelas tools.
-confidence: 0.9+ = match claro, 0.5-0.8 = interpretação razoável, <0.5 = baixa confiança.`,
            maxIterations: 8,
            returnIntermediateSteps: false,
        },
    };

    @node({
        id: 'ss-creation-get-clients-001',
        name: 'Get Client',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [384, 0],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetClient = {
        descriptionType: 'manual',
        toolDescription:
            'Buscar um cliente pelo nome. Use para encontrar o ID do cliente mencionado pelo usuário. Retorna id, name, status.',
        operation: 'getAll',
        tableId: 'clients',
        filterType: 'manual',
        matchType: 'allFilters',
        returnAll: false,
        limit: 1,
        filters: {
            conditions: [
                {
                    keyName: 'name',
                    condition: 'ilike',
                    keyValue: "={{ $fromAI('name', 'Nome do cliente para buscar', 'string') }}",
                },
            ],
        },
    };

    @node({
        id: 'ss-creation-get-units-001',
        name: 'Get Unit',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [512, 0],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetUnit = {
        descriptionType: 'manual',
        toolDescription:
            'Buscar uma unidade pelo nome e client_id. Use para encontrar a unidade mencionada pelo usuário. Retorna id, description, client_id, description_full.',
        operation: 'getAll',
        tableId: 'v_units',
        filterType: 'manual',
        matchType: 'allFilters',
        returnAll: false,
        limit: 1,
        filters: {
            conditions: [
                {
                    keyName: 'client_id',
                    condition: 'eq',
                    keyValue: "={{ $fromAI('client_id', 'ID do cliente para filtrar unidades', 'string') }}",
                },
                {
                    keyName: 'description',
                    condition: 'ilike',
                    keyValue: "={{ $fromAI('description', 'Nome da unidade para buscar', 'string') }}",
                },
            ],
        },
    };

    @node({
        id: 'ss-creation-get-order-types-001',
        name: 'Get Order Type',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [640, 0],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetOrderType = {
        descriptionType: 'manual',
        toolDescription:
            'Buscar um tipo de ordem de serviço pela descrição. Use para encontrar o tipo de manutenção/serviço mencionado. Retorna id, description, status.',
        resource: 'row',
        operation: 'get',
        tableId: 'cfg_orders_types',
        filters: {
            conditions: [
                {
                    keyName: 'description',
                    condition: 'ilike',
                    keyValue: "={{ $fromAI('description', 'Descrição do tipo de OS para buscar', 'string') }}",
                },
            ],
        },
    };

    @node({
        id: 'ss-creation-get-priorities-001',
        name: 'Get Priority',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [768, 0],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetPriority = {
        descriptionType: 'manual',
        toolDescription:
            'Buscar uma prioridade de ordem de serviço pela descrição. Use para encontrar o nível de urgência mencionado. Retorna id, description, status.',
        resource: 'row',
        operation: 'get',
        tableId: 'cfg_orders_priorities',
        filters: {
            conditions: [
                {
                    keyName: 'description',
                    condition: 'ilike',
                    keyValue: "={{ $fromAI('description', 'Descrição da prioridade para buscar', 'string') }}",
                },
            ],
        },
    };

    @node({
        id: 'ss-creation-get-unit-assets-001',
        name: 'Get Unit Asset By Unit',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [896, 0],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetUnitAssetByUnit = {
        descriptionType: 'manual',
        toolDescription:
            'Buscar um setor/posição de uma unidade pelo ID da unidade e descrição. Use quando o usuário mencionar um setor, posição ou local específico dentro da unidade. Retorna id, description, asset_tag_id, asset_tag_sub_id.',
        resource: 'row',
        operation: 'get',
        tableId: 'cfg_units_assets_tags',
        filters: {
            conditions: [
                {
                    keyName: 'unit_id',
                    condition: 'eq',
                    keyValue: "={{ $fromAI('unit_id', 'ID da unidade para buscar setores/posições', 'string') }}",
                },
                {
                    keyName: 'description',
                    condition: 'ilike',
                    keyValue: "={{ $fromAI('description', 'Descrição do setor/posição para buscar', 'string') }}",
                },
            ],
        },
    };

    @node({
        id: 'ss-creation-respond-001',
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1104, -224],
    })
    RespondToWebhook = {
        respondWith: 'json',
        responseBody:
            '={{ (() => { try { const parsed = JSON.parse($json.output); return JSON.stringify({ suggestion: parsed }); } catch(e) { return JSON.stringify({ suggestion: { clientId: null, clientName: "", unitId: null, unitDescription: "", sectorId: null, sectorDescription: "", orderTypeId: null, orderTypeDescription: "", priorityId: null, priorityDescription: "", requestedServices: $json.output || "", confidence: 0.1 } }); } })() }}',
        options: {},
    };

    @node({
        id: 'ss-creation-memory-001',
        name: 'Postgres Chat Memory',
        type: '@n8n/n8n-nodes-langchain.memoryPostgresChat',
        version: 1.3,
        position: [256, 0],
        credentials: { postgres: { id: 'saGmJEgCsB02w78r', name: 'SIGES Postgres' } },
    })
    PostgresChatMemory = {
        sessionIdType: 'customKey',
        sessionKey: '={{ $json.body.sessionId || "ss-creation-" + $json.body.userId }}',
        contextWindowLength: 2,
    };

    @node({
        id: '3a11e33e-e0cc-434f-8714-3a4450d30990',
        name: 'Google Gemini Chat Model',
        type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
        version: 1,
        position: [128, 0],
        credentials: { googlePalmApi: { id: 'dbYHbMOI7Nqe9oyt', name: 'Google Gemini(PaLM) Api account' } },
    })
    GoogleGeminiChatModel = {
        modelName: 'models/gemini-pro-latest',
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.SsCreationWebhook.out(0).to(this.AiAgent.in(0));
        this.AiAgent.out(0).to(this.RespondToWebhook.in(0));

        this.AiAgent.uses({
            ai_languageModel: this.GoogleGeminiChatModel.output,
            ai_memory: this.PostgresChatMemory.output,
            ai_tool: [
                this.GetClient.output,
                this.GetUnit.output,
                this.GetOrderType.output,
                this.GetPriority.output,
                this.GetUnitAssetByUnit.output,
            ],
        });
    }
}
