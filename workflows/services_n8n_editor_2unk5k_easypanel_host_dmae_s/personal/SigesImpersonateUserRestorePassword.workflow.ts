import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SigesImpersonateUserRestorePassword
// Nodes   : 2  |  Connections: 1
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// RestorePassword                    postgres                   [creds]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → RestorePassword
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: '7lrGbfjnID8E2Cik',
    name: 'SigesImpersonateUserRestorePassword',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1', availableInMCP: false, callerPolicy: 'workflowsFromSameOwner' },
})
export class SigesimpersonateuserrestorepasswordWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '828537c8-1456-4671-bd45-085a03bbf5d3',
        webhookId: 'restore-impersonation',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2,
        position: [-400, 0],
    })
    Webhook = {
        httpMethod: 'POST',
        path: 'siges-restore-password',
        options: {
            rawBody: false,
        },
        responseMode: 'lastNode',
    };

    @node({
        id: '2db43eb8-3db5-45cd-85e4-ed1109e9ce8f',
        name: 'Restore Password',
        type: 'n8n-nodes-base.postgres',
        version: 2.4,
        position: [-100, 0],
        credentials: { postgres: { id: 'saGmJEgCsB02w78r', name: 'SIGES Postgres' } },
    })
    RestorePassword = {
        operation: 'executeQuery',
        query: "SELECT public.restore_original_password('{{ $('Webhook').first().json.body.userUuid }}'::uuid) AS result;",
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.RestorePassword.in(0));
    }
}
