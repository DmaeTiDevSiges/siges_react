const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';

async function run() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/v_orders_visits?o_unit_description=ilike.*EBAP POLICIA FEDERAL*&order=ov_started_at.desc&limit=1`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    const data = await response.json();
    if (!data || data.length === 0) {
        console.log('No visit found');
        return;
    }
    const visit = data[0];
    console.log('--- Visit Details ---');
    console.log('ID:', visit.id);
    console.log('Unit Description:', visit.o_unit_description);
    console.log('Processing ID:', visit.ov_processing_id);

    // Fetch counters from table
    const tResp = await fetch(`${SUPABASE_URL}/rest/v1/orders_visits?id=eq.${visit.id}`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    const tableData = await tResp.json();
    console.log('Counters in table:', {
        amount: tableData[0].ov_assets_amount,
        approved_filed: tableData[0].ov_assets_approved_filed_amount,
        approved_no_filed: tableData[0].ov_assets_approved_no_filed_amount
    });

    const aResp = await fetch(`${SUPABASE_URL}/rest/v1/orders_visits_assets?ov_id=eq.${visit.id}`, {
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
