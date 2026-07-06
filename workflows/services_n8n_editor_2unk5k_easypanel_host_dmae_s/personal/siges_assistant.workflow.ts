import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SIGES Assistant Orchestrator
// Nodes   : 15  |  Connections: 2
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ChatWebhook                        webhook
// AiAgent                            agent                      [AI]
// GetClients                         supabaseTool               [creds] [ai_tool]
// GetUnits                           supabaseTool               [creds] [ai_tool]
// GetOrderTypes                      supabaseTool               [creds] [ai_tool]
// GetContracts                       supabaseTool               [creds] [ai_tool]
// GetPriorities                      supabaseTool               [creds] [ai_tool]
// RespondToWebhook                   respondToWebhook
// GetAssets                          supabaseTool               [creds] [ai_tool]
// GetOrders                          supabaseTool               [creds] [ai_tool]
// GetVisits                          supabaseTool               [creds] [ai_tool]
// GetAssetsActivities                supabaseTool               [creds] [ai_tool]
// GetAssetMovements                  supabaseTool               [creds] [ai_tool]
// GroqChatModel                      lmChatGroq                 [creds] [ai_languageModel]
// PostgresChatMemory                 memoryPostgresChat         [creds] [ai_memory]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ChatWebhook
//    → AiAgent
//      → RespondToWebhook
//
// AI CONNECTIONS
// AiAgent.uses({ ai_languageModel: GroqChatModel, ai_memory: PostgresChatMemory, ai_tool: [GetClients, GetUnits, GetOrderTypes, GetContracts, GetPriorities, GetAssets, GetOrders, GetVisits, GetAssetsActivities, GetAssetMovements] })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'X3YuuywO3VuOKZ1S',
    name: 'SIGES Assistant Orchestrator',
    active: true,
    isArchived: false,
    settings: {
        saveExecutionProgress: true,
        executionOrder: 'v1',
        callerPolicy: 'workflowsFromSameOwner',
        availableInMCP: false,
    },
})
export class SigesAssistantOrchestratorWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'c07e3374-d233-4aaf-9480-d4c3a13c046c',
        webhookId: 'b52f23f5-245f-4260-979f-5fbd116aee97',
        name: 'Chat Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [-96, -208],
    })
    ChatWebhook = {
        httpMethod: 'POST',
        path: 'siges-ai-assistant',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: '7923fa3f-04e4-42d5-8856-05b7bca650e8',
        name: 'AI Agent',
        type: '@n8n/n8n-nodes-langchain.agent',
        version: 3,
        position: [368, -224],
    })
    AiAgent = {
        promptType: 'define',
        text: '={{ $json.body.message }}',
        options: {
            systemMessage: `Você é o assistente virtual do SIGES (Sistema Integrado de Gestão de Serviços).

SUAS RESPONSABILIDADES:
- Responder perguntas sobre clientes, unidades, contratos, ordens de serviço, prioridades, ativos, histórico de manutenções e visitas técnicas
- Buscar dados do sistema quando o usuário solicitar informações
- Responder em português brasileiro de forma clara, objetiva e profissional

REGRAS CRÍTICAS DE FORMATAÇÃO:
- NUNCA retorne JSON bruto, XML ou qualquer formato técnico ao usuário
- NUNCA mostre o conteúdo original das tools (IDs, chaves técnicas, timestamps completos)
- NUNCA inclua "Used tools:", "Result:", ou qualquer metadado de execução
- SEMPRE processe os dados e apresente em linguagem natural, amigável
- Ao listar registros, use uma lista numerada ou com marcadores

REGRAS DE COMPORTAMENTO:
1. Use as tools disponíveis para buscar informações reais do sistema. NUNCA invente dados.
2. Ao listar múltiplos registros, formate como lista para facilitar a leitura.
3. Se o usuário pedir uma quantidade específica (ex: "10 primeiros"), retorne apenas essa quantidade.
4. Se não encontrar a informação ou não souber a resposta, diga claramente que não dispõe dessa informação.
5. Não execute ações de criação, edição ou exclusão. Apenas consultas.
6. Seja conciso mas completo nas respostas.
7. Para ativos: use o campo "code" (ex: "21925") para buscas. Se o code for "0", o ativo não possui código registrado — informe ao usuário.
8. CONSULTA DE MOVIMENTAÇÃO DE ATIVOS (RELEVANTE):
   - Para qualquer pergunta sobre transferências, mudanças de local ou movimentações de um ativo, use EXCLUSIVAMENTE a tool "Get Asset Movements".
   - NÃO confunda o serviço solicitado na descrição da OS (campo "activities_description") com a movimentação real que de fato ocorreu.
   - A informação da movimentação que foi REALMENTE REALIZADA está no campo "moved_comments" (comentários da movimentação) e na transição física das unidades ("before_unit_code" -> "after_unit_code"). Apresente esses dados e o nome do usuário que aprovou ("approved_user_name_short").
   - Se o campo "moved_comments" estiver preenchido, use-o como a descrição oficial do que foi realizado na movimentação.
9. CONSULTA DE ATIVIDADES DE MANUTENÇÃO:
   - Para histórico de manutenção ou outras atividades gerais de manutenção, use "Get Assets Activities".
   - Explique que o campo "activities_description" representa os serviços que foram solicitados na OS, enquanto o campo "after_comments" ou as observações do checklist representam o que foi realmente realizado.
10. Se uma tool retornar erro, informe ao usuário que não foi possível obter essa informação específica e sugira uma consulta mais simples.
11. Para consultas sobre tipos de OS e prioridades, GetOrderTypes e GetPriorities retornam listas pequenas — chame diretamente.
12. Para consultas sobre clientes, unidades, contratos — GetClients, GetUnits, GetContracts são ideais.`,
            maxIterations: 5,
            returnIntermediateSteps: false,
        },
    };

    @node({
        id: '6337be65-fe2b-4e64-ada3-503e484617e4',
        name: 'Get Clients',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [576, 160],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetClients = {
        operation: 'getAll',
        tableId: 'clients',
        returnAll: false,
        limit: 20,
        toolDescription: 'Buscar clientes. Use quando o usuário perguntar sobre clientes, empresas ou contratantes.',
    };

    @node({
        id: '3951635c-4963-47e2-b908-e0dfeab3f2c4',
        name: 'Get Units',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [432, 160],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetUnits = {
        operation: 'getAll',
        tableId: 'v_units',
        returnAll: false,
        limit: 20,
        toolDescription:
            'Buscar unidades/locais. Use quando o usuário perguntar sobre unidades, filiais, endereços ou localizações.',
    };

    @node({
        id: '274678cc-e9b1-493d-85ff-6e57b8999d47',
        name: 'Get Order Types',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [640, 16],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetOrderTypes = {
        operation: 'getAll',
        tableId: 'cfg_orders_types',
        returnAll: false,
        limit: 20,
        toolDescription:
            'Buscar tipos de ordem de serviço. Use quando o usuário perguntar sobre categorias, classificações ou tipos de OS.',
    };

    @node({
        id: 'c668327c-903f-4032-a144-e9db398a6f94',
        name: 'Get Contracts',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [768, 16],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetContracts = {
        operation: 'getAll',
        tableId: 'contracts',
        returnAll: false,
        limit: 20,
        toolDescription:
            'Buscar contratos. Use quando o usuário perguntar sobre contratos vigentes, valores ou prazos.',
    };

    @node({
        id: '07aaa029-51be-4812-91a5-dfc086b0540f',
        name: 'Get Priorities',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [896, 16],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetPriorities = {
        operation: 'getAll',
        tableId: 'cfg_orders_priorities',
        returnAll: false,
        limit: 20,
        toolDescription:
            'Buscar prioridades de ordem de serviço. Use quando o usuário perguntar sobre níveis de prioridade ou urgência.',
    };

    @node({
        id: '3bd310d2-774e-40a9-b9fb-184f4e8a1a2d',
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1104, -208],
    })
    RespondToWebhook = {
        respondWith: 'json',
        responseBody:
            '={{ JSON.stringify({ output: $json.output || "Desculpe, não consegui processar sua solicitação. Tente novamente mais tarde." }) }}',
        options: {},
    };

    @node({
        id: 'a1b2c3d4-0001-4000-8000-000000000001',
        name: 'Get Assets',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [800, -96],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetAssets = {
        operation: 'getAll',
        tableId: 'v_assets',
        returnAll: false,
        limit: 5,
        toolDescription:
            'Buscar ativos/equipamentos. Use quando o usuário perguntar sobre equipamentos, patrimônio, manutenção de ativos ou inventário. Retorna id, code, description e outros campos.',
    };

    @node({
        id: 'a1b2c3d4-0002-4000-8000-000000000002',
        name: 'Get Orders',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [800, 0],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetOrders = {
        operation: 'getAll',
        tableId: 'v_orders',
        returnAll: false,
        limit: 10,
        matchType: 'allFilters',
        filters: {
            conditions: [
                {
                    keyName: 'order_mask',
                    condition: 'eq',
                    keyValue:
                        "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('conditions0_Field_Value', ``, 'string') }}",
                },
            ],
        },
        toolDescription:
            'Buscar ordens de serviço pelo número da OS (order_mask, ex: "OS-2026/1234"). Use quando o usuário perguntar sobre uma OS específica.',
    };

    @node({
        id: 'a1b2c3d4-0003-4000-8000-000000000003',
        name: 'Get Visits',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [256, 160],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetVisits = {
        operation: 'getAll',
        tableId: 'v_orders_visits',
        returnAll: false,
        limit: 10,
        toolDescription:
            'Buscar visitas técnicas. Use quando o usuário perguntar sobre visitas, inspeções, atendimentos presenciais ou round.',
    };

    @node({
        id: 'a1b2c3d4-0004-4000-8000-000000000004',
        name: 'Get Assets Activities',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [800, 208],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetAssetsActivities = {
        operation: 'getAll',
        tableId: 'v_orders_visits_assets',
        returnAll: false,
        limit: 5,
        matchType: 'allFilters',
        filters: {
            conditions: [
                {
                    keyName: 'code',
                    condition: 'eq',
                    keyValue:
                        "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('conditions0_Field_Value', ``, 'string') }}",
                },
            ],
        },
        toolDescription:
            'Buscar atividades de manutenção de um ativo pelo CÓDIGO do ativo (ex: "21925"). Use quando o usuário perguntar sobre histórico de manutenção ou atividades de um equipamento que tenha código.',
    };

    @node({
        id: 'a1b2c3d4-0005-4000-8000-000000000005',
        name: 'Get Asset Movements',
        type: 'n8n-nodes-base.supabaseTool',
        version: 1,
        position: [800, 320],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetAssetMovements = {
        operation: 'getAll',
        tableId: 'v_orders_visits_assets',
        returnAll: false,
        limit: 5,
        matchType: 'allFilters',
        filters: {
            conditions: [
                {
                    keyName: 'is_moved',
                    condition: 'eq',
                    keyValue: 'true',
                },
                {
                    keyName: 'code',
                    condition: 'eq',
                    keyValue:
                        "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('conditions1_Field_Value', ``, 'string') }}",
                },
            ],
        },
        toolDescription:
            'Buscar movimentações de um ativo (transferências entre unidades) pelo CÓDIGO do ativo (ex: "21925"). Use quando o usuário perguntar sobre transferências, mudanças de local ou movimentações de equipamentos.',
    };

    @node({
        id: 'a07b8418-415d-4ecd-98df-981eccc39097',
        name: 'Groq Chat Model',
        type: '@n8n/n8n-nodes-langchain.lmChatGroq',
        version: 1,
        position: [240, -16],
        credentials: { groqApi: { id: 'tzO5MqoXWeGDpCJt', name: 'Groq account' } },
    })
    GroqChatModel = {
        model: 'llama-3.1-8b-instant',
        options: {},
    };

    @node({
        id: '68982ca1-2404-40bc-9eaf-8f9b51946e17',
        name: 'Postgres Chat Memory',
        type: '@n8n/n8n-nodes-langchain.memoryPostgresChat',
        version: 1.3,
        position: [384, -16],
        credentials: { postgres: { id: 'saGmJEgCsB02w78r', name: 'SIGES Postgres' } },
    })
    PostgresChatMemory = {
        sessionIdType: 'customKey',
        sessionKey: '={{ $json.body.sessionId }}',
        tableName: 'n8n_chat_histories',
        contextWindowLength: 2,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ChatWebhook.out(0).to(this.AiAgent.in(0));
        this.AiAgent.out(0).to(this.RespondToWebhook.in(0));

        this.AiAgent.uses({
            ai_languageModel: this.GroqChatModel.output,
            ai_memory: this.PostgresChatMemory.output,
            ai_tool: [
                this.GetClients.output,
                this.GetUnits.output,
                this.GetOrderTypes.output,
                this.GetContracts.output,
                this.GetPriorities.output,
                this.GetAssets.output,
                this.GetOrders.output,
                this.GetVisits.output,
                this.GetAssetsActivities.output,
                this.GetAssetMovements.output,
            ],
        });
    }
}
