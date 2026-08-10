
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listKeys() {
    const { data, error } = await supabase
        .from('v_orders')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }

    console.log(Object.keys(data[0]).join('\n'));
}

listKeys();
