import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SigesWhatsAppVisitReminder
// Nodes   : 5  |  Connections: 4
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ScheduleTrigger                    scheduleTrigger
// GetUsersWithVisit                  supabase                   [creds]
// PrepareItems                       code
// SendWhatsapp                       evolutionApi               [creds] [retry]
// ClearFlags                         code
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ScheduleTrigger
//    → GetUsersWithVisit
//      → PrepareItems
//        → SendWhatsapp
//          → ClearFlags
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: '4s7Mr2NjC84tAHYd',
    name: 'SigesWhatsAppVisitReminder',
    active: false,
    isArchived: false,
    settings: { executionOrder: 'v1', availableInMCP: false, callerPolicy: 'workflowsFromSameOwner' },
})
export class SigeswhatsappvisitreminderWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'a1b2c3d4-0001-4000-8000-000000000001',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [0, 0],
    })
    ScheduleTrigger = {
        rule: {
            interval: [
                {
                    field: 'minutes',
                    minutesInterval: 15,
                },
            ],
        },
    };

    @node({
        id: 'a1b2c3d4-0001-4000-8000-000000000002',
        name: 'Get Users With Visit',
        type: 'n8n-nodes-base.supabase',
        version: 1,
        position: [240, 0],
        credentials: { supabaseApi: { id: '3e1v0m7ap64TE24A', name: 'SIGES Supabase' } },
    })
    GetUsersWithVisit = {
        operation: 'getAll',
        tableId: 'users',
        returnAll: true,
        matchType: 'allFilters',
        filters: {
            conditions: [
                {
                    keyName: 'is_logged_out_with_visit',
                    condition: 'is',
                    keyValue: 'true',
                },
                {
                    keyName: 'is_ov_in_progress',
                    condition: 'is',
                    keyValue: 'true',
                },
            ],
        },
    };

    @node({
        id: 'a1b2c3d4-0001-4000-8000-000000000004',
        name: 'Prepare Items',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [480, 0],
    })
    PrepareItems = {
        mode: 'runOnceForAllItems',
        jsCode: `const raw = $input.all();

// Supabase node may wrap data in { data: [...] } or return items directly
let users = [];
if (raw.length > 0) {
    const first = raw[0].json;
    if (first && Array.isArray(first.data)) {
        users = first.data;
    } else if (Array.isArray(first)) {
        users = first;
    } else {
        users = raw.map(r => r.json);
    }
}

if (!users || users.length === 0) {
    return [];
}

const results = [];
for (const user of users) {
    const phone = user.mobile_whatsapp;
    const name = user.name_full || '';
    const uuid = user.uuid || '';
    const visitMask = user.ov_id_in_progress_mask || user.ov_id_in_progress || '';

    if (!phone) continue;

    const msg = 'Olá, ' + name + '! Você possui uma visita em andamento (' + visitMask + '). Abra o SIGES para retomar ou encerrar a visita.';

    results.push({
        json: {
            number: phone,
            msg: msg,
            userId: uuid,
        }
    });
}

return results;`,
    };

    @node({
        id: 'a1b2c3d4-0001-4000-8000-000000000006',
        name: 'Send WhatsApp',
        type: 'n8n-nodes-evolution-api.evolutionApi',
        version: 1,
        position: [720, 0],
        credentials: { evolutionApi: { id: 'L9NGnOBfKW7Jkuq8', name: 'Evolution account' } },
        retryOnFail: true,
    })
    SendWhatsapp = {
        resource: 'messages-api',
        instanceName: 'SIGES',
        remoteJid: '={{ $json.number }}',
        messageText: '={{ $json.msg }}',
        options_message: {},
    };

    @node({
        id: 'a1b2c3d4-0001-4000-8000-000000000007',
        name: 'Clear Flags',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [960, 0],
    })
    ClearFlags = {
        mode: 'runOnceForAllItems',
        jsCode: `const items = $input.all();
const results = [];

for (const item of items) {
    const userId = item.json.userId;
    if (!userId) continue;

    try {
        const resp = await fetch(
            '{{ $env.SUPABASE_URL }}/rest/v1/users?uuid=eq.' + userId,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': '{{ $env.SUPABASE_ANON_KEY }}',
                    'Authorization': 'Bearer {{ $env.SUPABASE_ANON_KEY }}',
                },
                body: JSON.stringify({ is_logged_out_with_visit: false }),
            }
        );
        results.push({ json: { userId, cleared: resp.ok } });
    } catch (err) {
        results.push({ json: { userId, cleared: false, error: err.message } });
    }
}

return results.length > 0 ? results : [{ json: { success: true, message: 'Nothing to clear' } }];`,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ScheduleTrigger.out(0).to(this.GetUsersWithVisit.in(0));
        this.GetUsersWithVisit.out(0).to(this.PrepareItems.in(0));
        this.PrepareItems.out(0).to(this.SendWhatsapp.in(0));
        this.SendWhatsapp.out(0).to(this.ClearFlags.in(0));
    }
}
