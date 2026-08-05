const SUPABASE_URL = 'https://services-supabase-siges.2unk5k.easypanel.host';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY1MDQ4NTY5LCJleHAiOjIwODA0MDg1Njl9.PvktH7q6oHQ7qDquTo9chZt9qXmC9m6Ze39Urit0QkU';

async function checkAssetData() {
    console.log('--- Fetching asset 21985 data from v_orders_visits_assets ---');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/v_orders_visits_assets?code=eq.21985`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        console.log('Records count:', data.length);
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAssetData();
