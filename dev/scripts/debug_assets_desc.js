const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';

async function run() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/v_orders_visits_assets?o_unit_description=ilike.*EBAP POLICIA FEDERAL*&limit=10`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    const data = await response.json();
    if (!data || data.length === 0) {
        console.log('No assets found');
        return;
    }
    console.log('Found', data.length, 'assets');
    data.forEach(a => {
        console.log(`OVA ID: ${a.id}, Visit ID: ${a.ov_id}, Status: ${a.processing_id}, Tag: ${a.tag_description}`);
    });
}
run();
