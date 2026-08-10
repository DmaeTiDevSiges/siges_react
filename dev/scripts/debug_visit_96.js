const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';

async function run() {
    // ID 96
    const tResp = await fetch(`${SUPABASE_URL}/rest/v1/orders_visits?id=eq.96`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    const tableData = await tResp.json();
    console.log('Counters in table for ID 96:', tableData[0]);

    const aResp = await fetch(`${SUPABASE_URL}/rest/v1/orders_visits_assets?ov_id=eq.96`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    const assets = await aResp.json();
    console.log('Total Assets in table:', assets.length);
    console.log('Status breakdown:');
    const breakdown = {};
    assets.forEach(a => { breakdown[a.processing_id] = (breakdown[a.processing_id] || 0) + 1; });
    console.log(breakdown);
}
run();
