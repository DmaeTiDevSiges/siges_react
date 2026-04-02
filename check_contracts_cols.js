import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('Querying contracts table structure...');
    const { data, error } = await supabase.from('contracts').select('*').limit(1);
    if (error) {
        console.error('Error fetching contracts:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('Columns found in contracts table:');
        Object.keys(data[0]).sort().forEach(k => {
            const val = data[0][k];
            const type = val === null ? 'null' : typeof val;
            console.log(`- ${k} (sample type: ${type})`);
        });
    } else {
        console.log('No data found in contracts table to infer columns.');
    }
}

check();
