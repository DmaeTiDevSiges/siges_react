
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data } = await supabase.from('v_orders').select('*').limit(1).single();
    if (data) {
        console.log(JSON.stringify(Object.keys(data).sort()));
    }
}
run();
