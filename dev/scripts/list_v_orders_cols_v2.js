
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listVOrdersColumns() {
    const { data, error } = await supabase
        .from('v_orders')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching v_orders:', error);
        return;
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0]).sort();
        console.log('Columns in v_orders:');
        columns.forEach(col => {
            if (col.includes('provider') || col.includes('img') || col.includes('logo')) {
                console.log(` - ${col}: ${data[0][col]}`);
            } else {
                console.log(` - ${col}`);
            }
        });
    } else {
        console.log('No data in v_orders');
    }
}

listVOrdersColumns();
