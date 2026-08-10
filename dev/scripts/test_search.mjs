import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    try {
        console.log('Testing search query "2" with fixed column client_name...');
        const search = '%2%';
        
        let query = supabase
            .from('v_orders_visits')
            .select('*', { count: 'exact' })
            .order('ov_started_at', { ascending: false })
            .range(0, 10);
            
        query = query.or(`ov_mask.ilike.${search},o_unit_description.ilike.${search},client_name.ilike.${search},o_mask.ilike.${search}`);
        
        const { data, error, count } = await query;
        if (error) {
            console.error('Supabase Query Error:', error);
        } else {
            console.log('Success! Count:', count);
            console.log('First 2 rows:', data.slice(0, 2).map(r => ({
                id: r.id,
                ov_mask: r.ov_mask,
                o_mask: r.o_mask,
                o_unit_description: r.o_unit_description,
                client_name: r.client_name
            })));
        }
    } catch (e) {
        console.error('Fatal:', e);
    }
}

run();
