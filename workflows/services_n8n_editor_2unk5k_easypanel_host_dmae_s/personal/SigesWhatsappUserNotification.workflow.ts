import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SigesWhatsappUserNotification
// Nodes   : 4  |  Connections: 3
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// EnviarTexto                        evolutionApi               [creds] [retry]
// WhenClickingExecuteWorkflow        manualTrigger
// EditFields                         set                        [alwaysOutput]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → EditFields
//      → EnviarTexto
// WhenClickingExecuteWorkflow
//    → EditFields (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'PD4JYm7wRsypmIDV',
    name: 'SigesWhatsappUserNotification',
    active: true,
    settings: { executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', availableInMCP: false },
})
export class SigeswhatsappusernotificationWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '170c16ec-2b10-4c08-a6b1-a1a2db81b75a',
        webhookId: '89bb094d-322d-4aa1-9c53-94f38ab3798c',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2,
        position: [-368, -64],
    })
    Webhook = {
        httpMethod: 'POST',
        path: 'whatsappUserNotification',
        options: {},
    };

    @node({
        id: 'd665e788-eb5d-4163-afeb-e054b6d41171',
        name: 'Enviar texto',
        type: 'n8n-nodes-evolution-api.evolutionApi',
        version: 1,
        position: [288, -112],
        credentials: { evolutionApi: { id: 'L9NGnOBfKW7Jkuq8', name: 'Evolution account' } },
        retryOnFail: true,
    })
    EnviarTexto = {
        resource: 'messages-api',
        instanceName: 'SIGES',
        remoteJid: '={{ $json.number }}',
        messageText: '={{ $json.msg }}',
        options_message: {},
    };

    @node({
        id: '57b5c42d-97dc-4d36-b4a4-10942c9cc229',
        name: 'When clicking ‘Execute workflow’',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [-176, 112],
    })
    WhenClickingExecuteWorkflow = {};

    @node({
        id: '04a50ca5-d361-4be6-809c-9e2b2963186c',
        name: 'Edit Fields',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-16, -16],
        alwaysOutputData: true,
    })
    EditFields = {
        assignments: {
            assignments: [
                {
                    id: 'b7ea371a-f73b-4b60-bfbc-b41fedef999f',
                    name: 'number',
                    value: '={{ $json.body.record.user_to_whatsapp }}',
                    type: 'string',
                },
                {
                    id: 'e026bce8-1c29-4d47-aff0-8e59872ccf1c',
                    name: 'msg',
                    value: '={{ $json.body.record.body }}',
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.EditFields.in(0));
        this.WhenClickingExecuteWorkflow.out(0).to(this.EditFields.in(0));
        this.EditFields.out(0).to(this.EnviarTexto.in(0));
    }
}
