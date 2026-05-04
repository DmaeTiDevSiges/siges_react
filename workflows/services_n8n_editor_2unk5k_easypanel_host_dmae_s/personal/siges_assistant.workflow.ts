import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SIGES Assistant Orchestrator
// Nodes   : 12  |  Connections: 2
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ChatWebhook                        webhook                    
// SigesAiAgent                       agent                      
// Gemini15Flash                      lmChatGoogleGemini         [creds]
// SupabaseHistoryMemory              memoryBufferWindow         
// GetClients                         supabase                   [creds]
// GetUnits                           supabase                   [creds]
// GetOrderTypes                      supabase                   [creds]
// GetOrderSubTypes                   supabase                   [creds]
// GetOrderObjects                    supabase                   [creds]
// GetContracts                       supabase                   [creds]
// GetPriorities                      supabase                   [creds]
// SaveMessage                        supabase                   [creds]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ChatWebhook
//    → SigesAiAgent
//      → SaveMessage
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "X3YuuywO3VuOKZ1S",
    name: "SIGES Assistant Orchestrator",
    active: false,
    settings: { saveExecutionProgress: true, executionOrder: "v1", callerPolicy: "workflowsFromSameOwner", availableInMCP: false }
})
export class SigesAssistantOrchestratorWorkflow {

    // =====================================================================
// CONFIGURATION DES NOEUDS
// =====================================================================

    @node({
        id: "c07e3374-d233-4aaf-9480-d4c3a13c046c",
        webhookId: "b52f23f5-245f-4260-979f-5fbd116aee97",
        name: "Chat Webhook",
        type: "n8n-nodes-base.webhook",
        version: 1,
        position: [0, 0]
    })
    ChatWebhook = {};

    @node({
        id: "5554c42f-064b-434d-90d4-eb366c46bf85",
        name: "SIGES AI Agent",
        type: "@n8n/n8n-nodes-langchain.agent",
        version: 1.6,
        position: [400, 0]
    })
    SigesAiAgent = {};

    @node({
        id: "7a7fb50c-7aa5-4c21-87f7-f446da6a34f9",
        name: "Gemini 1.5 Flash",
        type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
        version: 1,
        position: [400, 200],
        credentials: {googlePalmApi:{id:"{{GOOGLE_GEMINI_CRED_ID}}",name:"Gemini Key"}}
    })
    Gemini15Flash = {};

    @node({
        id: "7a7fca2f-92da-47b4-b3b0-a61b98318f1e",
        name: "Supabase History Memory",
        type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
        version: 1.2,
        position: [550, 200]
    })
    SupabaseHistoryMemory = {};

    @node({
        id: "6337be65-fe2b-4e64-ada3-503e484617e4",
        name: "get_clients",
        type: "n8n-nodes-base.supabase",
        version: 1,
        position: [800, -200],
        credentials: {supabaseApi:{id:"{{SUPABASE_CRED_ID}}",name:"Supabase"}}
    })
    GetClients = {};

    @node({
        id: "3951635c-4963-47e2-b908-e0dfeab3f2c4",
        name: "get_units",
        type: "n8n-nodes-base.supabase",
        version: 1,
        position: [800, -100],
        credentials: {supabaseApi:{id:"{{SUPABASE_CRED_ID}}",name:"Supabase"}}
    })
    GetUnits = {};

    @node({
        id: "274678cc-e9b1-493d-85ff-6e57b8999d47",
        name: "get_order_types",
        type: "n8n-nodes-base.supabase",
        version: 1,
        position: [800, 0],
        credentials: {supabaseApi:{id:"{{SUPABASE_CRED_ID}}",name:"Supabase"}}
    })
    GetOrderTypes = {};

    @node({
        id: "31b83e0e-f0fc-4bad-8024-7def4939d228",
        name: "get_order_sub_types",
        type: "n8n-nodes-base.supabase",
        version: 1,
        position: [800, 100],
        credentials: {supabaseApi:{id:"{{SUPABASE_CRED_ID}}",name:"Supabase"}}
    })
    GetOrderSubTypes = {};

    @node({
        id: "add36615-51c3-4cd5-b26d-97751ba456ae",
        name: "get_order_objects",
        type: "n8n-nodes-base.supabase",
        version: 1,
        position: [800, 200],
        credentials: {supabaseApi:{id:"{{SUPABASE_CRED_ID}}",name:"Supabase"}}
    })
    GetOrderObjects = {};

    @node({
        id: "c668327c-903f-4032-a144-e9db398a6f94",
        name: "get_contracts",
        type: "n8n-nodes-base.supabase",
        version: 1,
        position: [800, 300],
        credentials: {supabaseApi:{id:"{{SUPABASE_CRED_ID}}",name:"Supabase"}}
    })
    GetContracts = {};

    @node({
        id: "07aaa029-51be-4812-91a5-dfc086b0540f",
        name: "get_priorities",
        type: "n8n-nodes-base.supabase",
        version: 1,
        position: [800, 400],
        credentials: {supabaseApi:{id:"{{SUPABASE_CRED_ID}}",name:"Supabase"}}
    })
    GetPriorities = {};

    @node({
        id: "3bd310d2-774e-40a9-b9fb-184f4e8a1a2d",
        name: "save_message",
        type: "n8n-nodes-base.supabase",
        version: 1,
        position: [1100, 0],
        credentials: {supabaseApi:{id:"{{SUPABASE_CRED_ID}}",name:"Supabase"}}
    })
    SaveMessage = {};


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.ChatWebhook.out(0).to(this.SigesAiAgent.in(0));
        this.SigesAiAgent.out(0).to(this.SaveMessage.in(0));
    }
}