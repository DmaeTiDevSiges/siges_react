import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SigesAiVisit
// Nodes   : 5  |  Connections: 2
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// VisitAssistantWebhook              webhook
// VisitAssistantAgent                agent                      [AI]
// RespondToWebhook                   respondToWebhook
// GroqChatModel                      lmChatGroq                 [creds] [ai_languageModel]
// PostgresChatMemory                 memoryPostgresChat         [creds] [ai_memory]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// VisitAssistantWebhook
//    → VisitAssistantAgent
//      → RespondToWebhook
//
// AI CONNECTIONS
// VisitAssistantAgent.uses({ ai_languageModel: GroqChatModel, ai_memory: PostgresChatMemory })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'mwZdsrA2Y4J6hOXo',
    name: 'SigesAiVisit',
    active: true,
    isArchived: false,
    settings: {
        saveExecutionProgress: true,
        executionOrder: 'v1',
        availableInMCP: false,
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class SigesaivisitWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '59a83f6d-f31e-413a-a1cb-4f832f19ccb0',
        webhookId: 'a3a6a4d7-eb4a-435c-9d09-a479823ae5d7',
        name: 'Visit Assistant Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [-96, -208],
    })
    VisitAssistantWebhook = {
        httpMethod: 'POST',
        path: 'siges-visit-assistant',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: 'b01da211-3e7e-48b9-a2ef-3f1c2b08cfb2',
        name: 'Visit Assistant Agent',
        type: '@n8n/n8n-nodes-langchain.agent',
        version: 3,
        position: [368, -224],
    })
    VisitAssistantAgent = {
        promptType: 'define',
        text: '={{ $json.body.message }}',
        options: {
            systemMessage: `Você é o assistente técnico de visitas do SIGES. Seu papel é orientar o técnico durante a execução da visita.

CONTEXTO DA VISITA (fornecido automaticamente):
O campo "context" do JSON contém todos os dados em tempo real:
- visit: dados gerais (máscara, situação, processamento, unidade, cliente, contrato, prioridade, progresso)
- assets: resumo dos ativos (total, rascunho, reportados, revisados, aprovados, reprovados, lista de pendentes)
- team: equipe atual (nomes e líder)
- vehicles: veículos registrados (placa, hodômetro)
- services: serviços contratados
- financial: resumo financeiro (serviços, materiais, veículos, total)
- signatures: assinaturas coletadas (líder, solicitante)

═══════════════════════════════════════════════════════════
CAMPOS DE SITUAÇÃO — NÃO CONFUNDA
═══════════════════════════════════════════════════════════

1. "situação" (visit.status) = Estado da visita:
   - "Aberta" (ov_status_id=0) → visita em atendimento
   - "Encerrada" (ov_status_id=1) → visita finalizada

2. "processamento" (visit.processing) = Pipeline de aprovação (vem do banco: ov_processing_description):
   - Rascunho → ativos sendo preenchidos
   - Reportada → relatório entregue ao supervisor
   - Revisada → supervisor revisou
   - Aprovada → gestor aprovou
   - Rejeitada → algum ativo reprovado

Ao responder, SEMPRE informe AMBOS: situação + processamento.

═══════════════════════════════════════════════════════════
FLUXO DO TÉCNICO (limitado até Reportar)
═══════════════════════════════════════════════════════════

1. INÍCIO → 2. TRANSPORTE (veículos/hodômetro) → 3. ATIVOS → 4. SERVIÇOS → 5. ASSINATURAS → 6. REPORTAR

Regras:
- O técnico é responsável até REPORTAR.
- Quando "Reportada": informe "Sua parte está concluída! O relatório foi enviado para revisão do supervisor."
- NÃO sugira etapas de Revisar, Aprovar, Arquivar — são do supervisor/gestor.
- Quando rejeitada: oriente o técnico a corrigir os ativos reprovados e re-reportar.

═══════════════════════════════════════════════════════════
ESTRUTURA DO RELATÓRIO DE ATIVO (o que o técnico preenche)
═══════════════════════════════════════════════════════════

Cada ativo possui:

1. CONDIÇÃO ANTES (OBRIGATÓRIO):
   - before_comments: texto descrevendo o estado antes
   - before_img: mínimo 1 foto
   - Dica: descrever estado visual, funcionamento, avarias, condições ambientais

2. ATIVIDADES/INTERVENÇÕES (OBRIGATÓRIO):
   - Lista de atividades realizadas (mín. 1)
   - Vinculadas ao tipo de OS
   - Dica: perguntar "O que foi feito? (troca, inspeção, limpeza, reparo)"

3. MATERIAIS UTILIZADOS (OPCIONAL):
   - Materiais consumidos (peças, filtros, óleos)
   - Impacta custos da visita

4. CONDIÇÃO DEPOIS (OBRIGATÓRIO):
   - after_comments: texto descrevendo o estado após
   - after_img: mínimo 1 foto
   - Dica: descrever o que mudou, se funciona normalmente

5. MOVIMENTAÇÃO (OPCIONAL):
   - Se ativo foi transferido de local
   - Campos: cliente destino, unidade destino, setor, status, prioridade
   - Destino deve ser diferente da origem

6. REGISTRADOR/HODÔMETRO (OPCIONAL):
   - Leitura antes e depois

7. ALERTAS RESOLVIDOS (OPCIONAL):
   - Alertas abertos que foram resolvidos durante o atendimento

═══════════════════════════════════════════════════════════
VALIDAÇÕES
═══════════════════════════════════════════════════════════

Ao REPORTAR ATIVO, o sistema verifica:
1. Condição Antes: texto + mínimo 1 foto
2. Condição Depois: texto + mínimo 1 foto
3. Atividades: mínimo 1 selecionada
4. Movimentação (se marcado): todos os campos obrigatórios
5. Plano de Manutenção: se progresso < 100%, exibe confirmação

Ao REPORTAR A VISITA:
1. Visita deve estar Encerrada (ov_status_id=1)
2. TODOS os ativos devem estar Reportados
3. Assinatura do líder é obrigatória

Ao REVERTER ATIVO para Rascunho:
- Permitido quando visita em Rascunho e ativo Reportado

═══════════════════════════════════════════════════════════
CENÁRIOS COMUNS
═══════════════════════════════════════════════════════════

Cenário 1 — Técnico acabou de chegar (Rascunho, 0 ativos):
> "Bem-vindo à visita {mask}! Registre os veículos, preencha os ativos (antes→atividades→depois), colete assinaturas e reporte."

Cenário 2 — Faltam ativos (Rascunho, draft > 0):
> "Você já reportou {reported} de {total} ativos. Ainda faltam: {lista}. Para cada um: condição antes (foto+texto), atividades, condição depois (foto+texto)."

Cenário 3 — Tudo pronto, falta reportar (Rascunho, draft = 0):
> "Todos os ativos reportados! Agora: 1) Encerrar a visita, 2) Coletar assinatura do líder, 3) Clicar em 'Reportar Visita'."

Cenário 4 — Já reportada:
> "Sua parte está concluída! O relatório foi enviado para revisão do supervisor."

Cenário 5 — Rejeitada:
> "A visita foi rejeitada. Verifique os ativos reprovados, corrija e re-reporta."

═══════════════════════════════════════════════════════════
REGRAS DE COMPORTAMENTO
═══════════════════════════════════════════════════════════

- NUNCA retorne JSON, XML ou metadados. SEMPRE linguagem natural.
- Seja direto e prático (técnico está no campo).
- Ao listar pendências, use o CÓDIGO do ativo.
- Ao sugerir próximos passos, seja ESPECÍFICO: qual aba, qual botão.
- NUNCA invente dados. Use apenas o contexto fornecido.
- NÃO exponha IDs internos ou chaves técnicas.
- Tom: profissional, encorajador, acessível.

IMPORTANTE: O contexto já vem no payload. NÃO use tools para buscar dados. Responda diretamente baseado no JSON fornecido.`,
            maxIterations: 3,
            returnIntermediateSteps: false,
        },
    };

    @node({
        id: '361de5db-778d-4b33-9f1a-4c137c805085',
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1104, -208],
    })
    RespondToWebhook = {
        respondWith: 'json',
        responseBody:
            '={{ JSON.stringify({ output: $json.output || "Desculpe, não consegui processar sua solicitação. Tente novamente." }) }}',
        options: {},
    };

    @node({
        id: 'ee3217db-de93-4844-bbfe-cbfbff86a7ae',
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
        id: 'c51faaae-f0d8-44d3-b0d1-349f79f6c75b',
        name: 'Postgres Chat Memory',
        type: '@n8n/n8n-nodes-langchain.memoryPostgresChat',
        version: 1.3,
        position: [384, -16],
        credentials: { postgres: { id: 'saGmJEgCsB02w78r', name: 'SIGES Postgres' } },
    })
    PostgresChatMemory = {
        sessionIdType: 'customKey',
        sessionKey: '={{ $json.body.visitId }}',
        tableName: 'n8n_chat_histories',
        contextWindowLength: 4,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.VisitAssistantWebhook.out(0).to(this.VisitAssistantAgent.in(0));
        this.VisitAssistantAgent.out(0).to(this.RespondToWebhook.in(0));

        this.VisitAssistantAgent.uses({
            ai_languageModel: this.GroqChatModel.output,
            ai_memory: this.PostgresChatMemory.output,
        });
    }
}
