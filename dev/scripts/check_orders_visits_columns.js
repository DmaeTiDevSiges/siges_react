const SUPABASE_URL = 'https://services-supabase-siges.2unk5k.easypanel.host';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY1MDQ4NTY5LCJleHAiOjIwODA0MDg1Njl9.PvktH7q6oHQ7qDquTo9chZt9qXmC9m6Ze39Urit0QkU';

async function listTableColumns() {
    console.log('--- Listing Columns of "orders_visits" table ---');
    try {
        // Fetch one row to get column names
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders_visits?limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            console.log('Columns in "orders_visits":');
            console.log(Object.keys(data[0]).sort().join(', '));
        } else {
            console.log('No data found in "orders_visits" to determine columns.');
            // Fallback: try to select from a view or check if the table is empty
            const schemaResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_table_columns`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ table_name: 'orders_visits' })
            });
            // Note: rpc/get_table_columns might not exist, but let's try a direct query if possible
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listTableColumns();
