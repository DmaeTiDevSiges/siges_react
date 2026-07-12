import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SigesImpersonateUser
// Nodes   : 5  |  Connections: 4
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// GetARow                            supabase                   [creds]
// If_                                if
// AdminNaoEncontrado                 set
// GerarMagicLink                     postgres                   [creds]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → GetARow
//      → If_
//        → GerarMagicLink
//       .out(1) → AdminNaoEncontrado
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'ao8MeMRo7cDv9C3D',
    name: 'SigesImpersonateUser',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1', availableInMCP: false, callerPolicy: 'workflowsFromSameOwner' },
})
export class SigesimpersonateuserWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '28385647-3114-433c-9ac0-6370fec3e9cf',
        webhookId: 'bbc07d81-756a-4e15-932d-072ccc777954',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2,
        position: [-400, 0],
    })
    Webhook = {
        httpMethod: 'POST',
        path: 'siges-impersonate-user',
        options: {
            rawBody: false,
        },
        responseMode: 'lastNode',
    };

    @node({
        id: 'c4219fd9-c5de-47f7-b4bf-f2911f235a17',
        name: 'Get a row',
        type: 'n8n-nodes-base.supabase',
        version: 1,
        position: [-112, 80],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetARow = {
        operation: 'get',
        tableId: 'v_users',
        filters: {
            conditions: [
                {
                    keyName: 'id',
                    keyValue: '={{ $json.body.requesterUserId }}',
                },
                {
                    keyName: 'is_admin_super',
                    keyValue: 'true',
                },
            ],
        },
    };

    @node({
        id: '45e0b8a7-4fa9-42bb-992e-3d648be102ab',
        name: 'If',
        type: 'n8n-nodes-base.if',
        version: 2.2,
        position: [96, 80],
    })
    If_ = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 2,
            },
            conditions: [
                {
                    id: '8539a012-429a-4675-a091-e15d2a817e74',
                    leftValue: '={{ $input.all().length }}',
                    rightValue: 0,
                    operator: {
                        type: 'number',
                        operation: 'gt',
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
        name: 'Admin não encontrado',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [96, 240],
    })
    AdminNaoEncontrado = {
        mode: 'manual',
        duplicateItem: false,
        assignments: {
            assignments: [
                {
                    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                    name: 'error',
                    value: 'Apenas super admins podem impersonar usuários',
                    type: 'string',
                },
                {
                    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                    name: 'message',
                    value: 'Permissão negada',
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'bf017224-c56e-41ff-9ad8-2c7e2bec298f',
        name: 'Gerar Magic Link',
        type: 'n8n-nodes-base.postgres',
        version: 2.4,
        position: [350, 0],
        credentials: { postgres: { id: 'saGmJEgCsB02w78r', name: 'SIGES Postgres' } },
    })
    GerarMagicLink = {
        operation: 'executeQuery',
        query: "SELECT public.generate_impersonation_link({{ $('Webhook').first().json.body.targetUserId }}::bigint, '{{ $('Webhook').first().json.body.supabaseUrl }}') AS result;",
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.GetARow.in(0));
        this.GetARow.out(0).to(this.If_.in(0));
        this.If_.out(0).to(this.GerarMagicLink.in(0));
        this.If_.out(1).to(this.AdminNaoEncontrado.in(0));
    }
}
