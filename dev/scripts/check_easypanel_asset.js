const SUPABASE_URL = 'https://services-supabase-siges.2unk5k.easypanel.host';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY1MDQ4NTY5LCJleHAiOjIwODA0MDg1Njl9.PvktH7q6oHQ7qDquTo9chZt9qXmC9m6Ze39Urit0QkU';

async function checkAsset() {
    console.log('--- Checking Asset 30996 on Easypanel Supabase ---');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/assets?code=eq.30996&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));

        if (data.length > 0 && data[0].type_id) {
            console.log('\n--- Checking Asset Type ---');
            const typeResp = await fetch(`${SUPABASE_URL}/rest/v1/cfg_assets_types?id=eq.${data[0].type_id}&select=*`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            const typeData = await typeResp.json();
            console.log(JSON.stringify(typeData, null, 2));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAsset();
