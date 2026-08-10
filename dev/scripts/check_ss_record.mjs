
import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSS() {
    const { data, error } = await supabase
        .from('v_orders')
        .select('*')
        .eq('status_id', 1)
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('SS Record:', data[0]);
    } else {
        console.log('No SS data found');
    }
}

checkSS();
