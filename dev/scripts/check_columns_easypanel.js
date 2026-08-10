const SUPABASE_URL = 'https://services-supabase-siges.2unk5k.easypanel.host';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY1MDQ4NTY5LCJleHAiOjIwODA0MDg1Njl9.PvktH7q6oHQ7qDquTo9chZt9qXmC9m6Ze39Urit0QkU';

async function listColumns() {
    console.log('--- Listing Columns of "assets" on Easypanel ---');
    try {
        // We can use the /rest/v1/assets?limit=1 to see what keys come back
        const response = await fetch(`${SUPABASE_URL}/rest/v1/assets?limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            console.log('Keys in first row:', Object.keys(data[0]).sort().join(', '));
            console.log('\nFull first row:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No assets found.');
        }

        console.log('\n--- Checking cfg_assets_types ---');
        const typesResp = await fetch(`${SUPABASE_URL}/rest/v1/cfg_assets_types?limit=5`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const typesData = await typesResp.json();
        console.log(JSON.stringify(typesData, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

listColumns();
