import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    // Try to find the correct table names by iterating likely ones
    const possible = ['cfg_orders_types_activities', 'cfg_orders_types_subs_activities', 'orders_types_activities', 'orders_types_subs_activities', 'order_type_activities'];
    for (const table of possible) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table} NOT found: ${error.message}`);
        } else {
            console.log(`Table ${table} FOUND! Columns:`, Object.keys(data[0] || {}).sort().join(', '));
        }
    }
}

check();
