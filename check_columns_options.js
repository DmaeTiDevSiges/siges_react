const SUPABASE_URL = 'https://services-supabase-siges.2unk5k.easypanel.host';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY1MDQ4NTY5LCJleHAiOjIwODA0MDg1Njl9.PvktH7q6oHQ7qDquTo9chZt9qXmC9m6Ze39Urit0QkU';

async function checkColumns() {
    console.log('--- Checking Columns of "orders_visits_vehicles" ---');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_table_exists`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tname: 'orders_visits_vehicles' })
        });
        // If RPC doesn't exist, try direct query to information_schema via PostgREST (might be disabled)
        // Alternatively, just try to select and catch error
        const selectResp = await fetch(`${SUPABASE_URL}/rest/v1/orders_visits_vehicles?limit=0`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'count=exact'
            }
        });

        console.log('Select status:', selectResp.status);
        if (selectResp.status === 200) {
            console.log('Columns helper (from headers or options):');
            // We can try OPTIONS
            const optionsResp = await fetch(`${SUPABASE_URL}/rest/v1/orders_visits_vehicles`, {
                method: 'OPTIONS',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            const optionsData = await optionsResp.json();
            console.log(JSON.stringify(optionsData, null, 2));
        } else {
            console.log('Error or not found:', await selectResp.text());
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkColumns();
