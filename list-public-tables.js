const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';

async function listPublicTables() {
    try {
        console.log('🔍 Querying public schema tables...\n');
        
        // Try different API endpoints
        const endpoints = [
            // Standard information_schema query
            `${SUPABASE_URL}/rest/v1/information_schema.tables?select=table_name&table_schema=eq.public`,
            // PostgreSQL catalog approach
            `${SUPABASE_URL}/rest/v1/pg_tables?select=tablename&schemaname=eq.public`,
            // Alternative with different filter format
            `${SUPABASE_URL}/rest/v1/information_schema.tables?select=table_name,and(table_schema,eq.public)`
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying: ${endpoint}`);
                const response = await fetch(endpoint, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    if (result && result.length > 0) {
                        console.log(`\n✅ Found ${result.length} tables:\n`);
                        const tableNames = result.map(t => t.table_name || t.tablename).filter(Boolean);
                        tableNames.sort();
                        tableNames.forEach((name, index) => {
                            console.log(`${index + 1}. ${name}`);
                        });
                        console.log('\n');
                        return;
                    }
                }
                console.log(`❌ No results or error from this endpoint\n`);
            } catch (e) {
                console.log(`Error: ${e.message}\n`);
            }
        }
        
        console.log('⚠️ Could not retrieve table list via REST API\n');
    } catch (err) {
        console.error('💥 Error:', err.message);
    }
}

listPublicTables();
