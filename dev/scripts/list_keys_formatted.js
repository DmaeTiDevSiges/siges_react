
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data } = await supabase.from('v_orders').select('*').limit(1).single();
    if (data) {
        const keys = Object.keys(data).sort();
        for (let i = 0; i < keys.length; i += 5) {
            console.log(keys.slice(i, i + 5).join(', '));
        }
    }
}
run();
