/**
 * Script para migrar arquivos de technical-manuals do Supabase Storage para Cloudflare R2
 * 
 * Uso: node scripts/migrate-technical-manuals-to-r2.mjs
 * 
 * Requer variáveis de ambiente (já existentes no .env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   VITE_R2_ACCOUNT_ID
 *   VITE_R2_ACCESS_KEY_ID
 *   VITE_R2_SECRET_ACCESS_KEY
 *   VITE_R2_BUCKET_NAME
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

// Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';

// R2
const r2AccountId = process.env.VITE_R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.VITE_R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.VITE_R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.VITE_R2_BUCKET_NAME;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias.');
    process.exit(1);
}

if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName) {
    console.error('❌ Variáveis do R2 não configuradas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
});

async function main() {
    console.log(` Bucket Supabase: ${BUCKET}`);
    console.log(` Bucket R2:       ${r2BucketName}`);
    console.log('');

    // 1. Buscar todos os registros de arquivos
    console.log(' Buscando registros de technicals_manuals_files...');
    const { data: files, error } = await supabase
        .from('technicals_manuals_files')
        .select('id, tm_id, doc_file_path, doc_file_name, file_type');

    if (error) {
        console.error('❌ Erro ao buscar arquivos:', error.message);
        process.exit(1);
    }

    if (!files || files.length === 0) {
        console.log(' Nenhum arquivo encontrado na tabela.');
        return;
    }

    console.log(` Encontrados ${files.length} registro(s)\n`);

    // 2. Para cada arquivo: baixar do Supabase Storage e subir no R2
    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of files) {
        const supabasePath = `technicals_manuals/${file.tm_id}/${file.doc_file_name}`;
        const r2Key = `companies/1/technicals-manuals/${file.tm_id}/${file.doc_file_name}`;

        process.stdout.write(` [${file.id}] ${file.doc_file_name} (${supabasePath})... `);

        process.stdout.write(` [${file.id}] ${file.doc_file_name} (${supabasePath})... `);

        try {
            // Download do Supabase Storage
            const { data: downloadData, error: downloadError } = await supabase
                .storage
                .from(BUCKET)
                .download(supabasePath);

            if (downloadError) {
                console.log(`FAIL download: ${JSON.stringify(downloadError)}`);
                failed++;
                continue;
            }

            // Upload para R2
            const buffer = Buffer.from(await downloadData.arrayBuffer());

            // Detectar content type
            const ext = file.doc_file_name.split('.').pop()?.toLowerCase() || '';
            const contentTypes = {
                pdf: 'application/pdf',
                jpg: 'image/jpeg', jpeg: 'image/jpeg',
                png: 'image/png', webp: 'image/webp', gif: 'image/gif',
                doc: 'application/msword',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                xls: 'application/vnd.ms-excel',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
            const contentType = contentTypes[ext] || 'application/octet-stream';

            await s3.send(new PutObjectCommand({
                Bucket: r2BucketName,
                Key: r2Key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000, immutable',
            }));

            // Atualizar doc_file_path no banco
            const correctPath = `companies/1/technicals-manuals/${file.tm_id}`;
            if (correctPath !== file.doc_file_path) {
                await supabase
                    .from('technicals_manuals_files')
                    .update({ doc_file_path: correctPath })
                    .eq('id', file.id);
                console.log(`OK (path corrigido: ${correctPath})`);
            } else {
                console.log('OK');
            }
            migrated++;
        } catch (err) {
            console.log(`FAIL (${err.message})`);
            failed++;
        }
    }

    console.log('\n─── Resumo ───');
    console.log(` Migrados: ${migrated}`);
    console.log(` Pulados:  ${skipped}`);
    console.log(` Falhas:   ${failed}`);
    console.log(` Total:    ${files.length}`);
}

main().catch(err => {
    console.error(' Erro fatal:', err.message);
    process.exit(1);
});
