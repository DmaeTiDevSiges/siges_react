const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';

async function listVisitColumns() {
    console.log('--- Listing Columns of "v_orders_visits" ---');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/v_orders_visits?limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            console.log('Keys in "v_orders_visits":');
            console.log(Object.keys(data[0]).sort().join('\n'));
            // console.log('\nSample Row:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data found in "v_orders_visits".');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listVisitColumns();
