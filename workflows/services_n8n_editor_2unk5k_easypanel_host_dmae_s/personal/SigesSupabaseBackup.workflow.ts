import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SigesSupabaseBackup
// Nodes   : 7  |  Connections: 6
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ScheduleTrigger                    scheduleTrigger
// ExecutePgdump                      executeCommand
// CheckSuccess                       if
// ReadBackupFile                     readWriteFile
// UploadToGoogleDrive                googleDrive                [creds]
// EmailSuccess                       emailSend                  [creds]
// EmailError                         emailSend                  [creds]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ScheduleTrigger
//    → ExecutePgdump
//      → CheckSuccess
//        → ReadBackupFile
//          → UploadToGoogleDrive
//            → EmailSuccess
//       .out(1) → EmailError
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'LCm5BpA7wSANijWF',
    name: 'SigesSupabaseBackup',
    active: false,
    isArchived: false,
    projectId: '9g2PRDfYwAMYBotF',
    settings: { executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', availableInMCP: false },
})
export class SigessupabasebackupWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'e55de666-224f-4d9f-bbb8-e5fc909fd038',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [0, 0],
    })
    ScheduleTrigger = {
        rule: {
            interval: [
                {
                    field: 'cronExpression',
                    expression: '0 2 * * *',
                },
            ],
        },
    };

    @node({
        id: 'd6f24f64-26d9-42b9-b05e-7f40460c913c',
        name: 'Execute PgDump',
        type: 'n8n-nodes-base.executeCommand',
        version: 1,
        position: [250, 0],
    })
    ExecutePgdump = {
        command: `BACKUP_DIR="/tmp/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="siges_backup_\${TIMESTAMP}.sql.gz"
mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$FILENAME" 2>&1
echo "$BACKUP_DIR/$FILENAME"`,
        executeOnce: true,
    };

    @node({
        id: '46b330c5-34c4-42ee-a0b9-b607021c2c8e',
        name: 'Check Success',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [500, 0],
    })
    CheckSuccess = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
            },
            conditions: [
                {
                    id: 'exit-code-check',
                    leftValue: '={{ $json.exitCode }}',
                    rightValue: 0,
                    operator: {
                        type: 'number',
                        operation: 'equals',
                    },
                },
            ],
            combinator: 'and',
        },
    };

    @node({
        id: 'aa0e4b6a-a522-4ed7-9fc4-5db05d87f6c2',
        name: 'Read Backup File',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [750, -100],
    })
    ReadBackupFile = {
        operation: 'read',
        fileSelector: '={{ $json.stdout.trim() }}',
        dataPropertyName: 'data',
    };

    @node({
        id: '7e0f2f11-b0f7-4576-9ed5-aff0bceb3353',
        name: 'Upload to Google Drive',
        type: 'n8n-nodes-base.googleDrive',
        version: 3,
        position: [1000, -100],
        credentials: { googleDriveOAuth2Api: { id: '', name: 'Google Drive account' } },
    })
    UploadToGoogleDrive = {
        name: '=siges_backup_{{ $now.format("yyyyMMdd_HHmmss") }}.sql.gz',
        driveId: {
            __rl: true,
            mode: 'list',
            value: 'My Drive',
        },
        folderId: {
            __rl: true,
            mode: 'list',
            value: '',
            cachedResultName: 'siges/backup',
        },
        inputDataFieldName: '=data',
        options: {},
    };

    @node({
        id: 'fb9fefbc-23a2-47b0-a216-6718abdcada9',
        name: 'Email Success',
        type: 'n8n-nodes-base.emailSend',
        version: 2.1,
        position: [1250, -100],
        credentials: { smtp: { id: '', name: 'SMTP' } },
    })
    EmailSuccess = {
        resource: 'email',
        operation: 'send',
        fromEmail: 'SIGES Backup <dmae.tidev.siges@gmail.com>',
        toEmail: 'dmae.tidev.siges@gmail.com',
        subject: '=[SIGES] Backup do banco concluído - {{ $now.format("dd/MM/yyyy HH:mm") }}',
        message: `<h2>Backup do SIGES concluído com sucesso</h2>
<p><strong>Data/Hora:</strong> {{ $now.format("dd/MM/yyyy HH:mm:ss") }}</p>
<p><strong>Arquivo:</strong> siges_backup_{{ $now.format("yyyyMMdd_HHmmss") }}.sql.gz</p>
<p><strong>Status:</strong> Enviado para Google Drive (siges/backup)</p>
<hr>
<p><em>Backup automático gerado pelo workflow SigesSupabaseBackup</em></p>`,
        emailFormat: 'html',
    };

    @node({
        id: '2ac8fbd2-c7c8-426e-b1a6-23421c9b59e8',
        name: 'Email Error',
        type: 'n8n-nodes-base.emailSend',
        version: 2.1,
        position: [750, 150],
        credentials: { smtp: { id: '', name: 'SMTP' } },
    })
    EmailError = {
        resource: 'email',
        operation: 'send',
        fromEmail: 'SIGES Backup <dmae.tidev.siges@gmail.com>',
        toEmail: 'dmae.tidev.siges@gmail.com',
        subject: '=[SIGES] FALHA no backup do banco - {{ $now.format("dd/MM/yyyy HH:mm") }}',
        message: `<h2>Falha no backup do SIGES</h2>
<p><strong>Data/Hora:</strong> {{ $now.format("dd/MM/yyyy HH:mm:ss") }}</p>
<p><strong>Exit Code:</strong> {{ $json.exitCode }}</p>
<p><strong>Erro:</strong></p>
<pre>{{ $json.stderr || $json.stdout }}</pre>
<hr>
<p><em>Verifique o servidor n8n e a variável de ambiente DATABASE_URL</em></p>`,
        emailFormat: 'html',
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ScheduleTrigger.out(0).to(this.ExecutePgdump.in(0));
        this.ExecutePgdump.out(0).to(this.CheckSuccess.in(0));
        this.CheckSuccess.out(0).to(this.ReadBackupFile.in(0));
        this.CheckSuccess.out(1).to(this.EmailError.in(0));
        this.ReadBackupFile.out(0).to(this.UploadToGoogleDrive.in(0));
        this.UploadToGoogleDrive.out(0).to(this.EmailSuccess.in(0));
    }
}
