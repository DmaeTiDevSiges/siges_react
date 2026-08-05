const SUPABASE_URL = 'https://services-supabase-siges.2unk5k.easypanel.host';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY1MDQ4NTY5LCJleHAiOjIwODA0MDg1Njl9.PvktH7q6oHQ7qDquTo9chZt9qXmC9m6Ze39Urit0QkU';

async function listTableColumns() {
    console.log('--- Listing Columns of "orders_visits_vehicles" table ---');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders_visits_vehicles?limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            console.log('Columns in "orders_visits_vehicles":');
            console.log(Object.keys(data[0]).sort().join(', '));
        } else if (response.status === 404) {
            console.log('Table "orders_visits_vehicles" does not exist (404).');
        } else {
            console.log('Table exists but is empty or response status is ' + response.status);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listTableColumns();
