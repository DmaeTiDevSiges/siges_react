const SUPABASE_URL = 'https://services-supabase-siges.2unk5k.easypanel.host';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY1MDQ4NTY5LCJleHAiOjIwODA0MDg1Njl9.PvktH7q6oHQ7qDquTo9chZt9qXmC9m6Ze39Urit0QkU';

async function listColumns() {
    console.log('--- Listing Columns of "v_orders_visits_assets" view ---');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/v_orders_visits_assets?limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            console.log('Columns in "v_orders_visits_assets":');
            console.log(Object.keys(data[0]).sort().join(', '));
            console.log('\nSample data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data found in "v_orders_visits_assets".');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listColumns();
