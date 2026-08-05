import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    const companyId = 1; // Assuming DMAE or test company

    const { data, error } = await supabase
        .from('v_orders_visits')
        .select('id, ov_status_id, ov_started_at, o_provider_company_id')
        .eq('o_provider_company_id', companyId)
        .or(`ov_status_id.eq.1,and(ov_status_id.eq.2,ov_started_at.gte.${startOfDay},ov_started_at.lte.${endOfDay})`)
        .order('ov_started_at', { ascending: true });

    if (error) console.error('Error:', error);
    else {
        console.log(`Found ${data.length} records logic 1`);
        const open = data.filter(d => d.ov_status_id === 1).length;
        const closed = data.filter(d => d.ov_status_id === 2).length;
        console.log(`Open: ${open}, Closed: ${closed}`);
    }
}

run();
