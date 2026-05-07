
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllCols() {
    const { data, error } = await supabase
        .from('v_orders')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    const entries = Object.entries(data).sort();
    entries.forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
    });
}

listAllCols();
