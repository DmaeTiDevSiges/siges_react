// Script para verificar o tipo da coluna before_img_files_names no banco
// Execute: node check_ova_col_type.mjs

const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';

async function checkColumnType() {
    // Buscar uma linha onde before_img_files_names não é null
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders_visits_assets?select=id,before_img_files_names,after_img_files_names,before_img_file_name&before_img_files_names=not.is.null&limit=3`,
        {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    const data = await response.json();
    console.log('Status:', response.status);
    
    if (!data || data.length === 0) {
        console.log('Nenhuma linha com before_img_files_names preenchido encontrada.');
        return;
    }

    data.forEach((row, i) => {
        const val = row.before_img_files_names;
        console.log(`\n--- Row ${i+1} (id=${row.id}) ---`);
        console.log('before_img_files_names:', JSON.stringify(val));
        console.log('typeof:', typeof val);
        console.log('isArray:', Array.isArray(val));
        console.log('before_img_file_name:', row.before_img_file_name);
    });
}

checkColumnType().catch(console.error);
