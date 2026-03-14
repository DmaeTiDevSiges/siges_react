
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugOrder98() {
    const { data, error } = await supabase
        .from('v_orders')
        .select('*')
        .eq('order_mask', '98.1.2026')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Order 98.1.2026 details:');
    console.log('Provider Company Name:', data.provider_company_name);
    console.log('Provider Company Img File Path:', data.provider_company_img_file_path);
    console.log('Provider Company Img File Name:', data.provider_company_img_file_name);
    console.log('Provider Company Img Path:', data.provider_company_img_path);
    console.log('Provider Company Img Name:', data.provider_company_img_name);
    console.log('--- All provider related fields ---');
    Object.keys(data).forEach(key => {
        if (key.includes('provider') || key.includes('img') || key.includes('logo')) {
            console.log(`${key}: ${data[key]}`);
        }
    });
}

debugOrder98();
