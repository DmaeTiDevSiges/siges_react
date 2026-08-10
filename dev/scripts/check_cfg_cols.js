import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const tables = ['cfg_orders_types_activities', 'cfg_orders_types_subs_activities'];
    for (const table of tables) {
        console.log(`Checking columns for ${table}...`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error fetching from ${table}:`, error);
            continue;
        }
        if (data && data.length > 0) {
            console.log(`Columns in ${table}:`, Object.keys(data[0]).sort().join(', '));
        } else {
            console.log(`No data found in ${table} to infer columns.`);
            // Try to use RPC or wait? No RPC for that usually.
        }
    }
}

check();
