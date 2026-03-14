import { supabase } from './services/supabase';

async function listPublicTables() {
    try {
        console.log('🔍 Querying public schema tables...');
        
        // Query information_schema to get all tables in public schema
        const { data, error } = await supabase.rpc('get_public_tables');
        
        // If RPC doesn't exist, try direct query via REST API
        if (error) {
            console.log('⚠️ RPC not available, trying alternative method...');
            
            // Use raw SQL through Supabase
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/information_schema.tables?select=table_name&table_schema=eq.public&order=table_name.asc`,
                {
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result && result.length > 0) {
                console.log(`\n✅ Found ${result.length} tables in public schema:\n`);
                console.table(result.map((t: any) => t.table_name));
                
                console.log('\nTable names:');
                result.forEach((table: any, index: number) => {
                    console.log(`${index + 1}. ${table.table_name}`);
                });
            } else {
                console.log('⚠️ No tables found in public schema');
            }
            return;
        }

        console.log('Tables:', data);
    } catch (err) {
        console.error('💥 Error:', err);
    }
}

listPublicTables();
