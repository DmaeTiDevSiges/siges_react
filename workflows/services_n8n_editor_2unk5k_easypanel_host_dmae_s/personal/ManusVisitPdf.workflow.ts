import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : ManusVisitPdf
// Nodes   : 3  |  Connections: 2
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// WebhookTrigger                   webhook
// HttpRequest                      httpRequest
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WebhookTrigger
//   → HttpRequest
//
// AI CONNECTIONS
// </workflow-map>

@workflow({
    name: 'ManusVisitPdf',
    active: false,
})
export class ManusVisitPdfWorkflow {

    @node({
        name: 'Bubble Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 1,
        position: [0, 0],
    })
    BubbleWebhook = {};

    @node({
        name: 'Generate PDF',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.5,
        position: [250, 0],
        credentials: { httpApi: { id: '', name: 'CraftMyPDF API' } },
    })
    GeneratePDF = {
        method: 'POST',
        url: 'https://api.craftmypdf.com/v1/create',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpApi',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: {
            template_id: '{{ $json.templateId }}',
            data: '{{ $json.data }}',
        },
        sendHeaders: true,
        specifyHeaders: 'keypair',
        headerParameters: {
            parameters: [
                {
                    name: 'X-API-KEY',
                    value: '{{ $credentials["httpApi"].apiKey }}',
                    type: 'string',
                },
            ],
        },
        options: {
            timeout: 120000,
        },
    };

    @links()
    defineRouting() {
        this.BubbleWebhook.out(0).to(this.GeneratePDF.in(0));
    }
}