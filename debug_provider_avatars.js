
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProviderAvatars() {
    console.log('Checking Provider Avatars...');

    const { data: orders, error } = await supabase
        .from('v_orders')
        .select('id, order_mask, provider_company_name, provider_company_img_file_path, provider_company_img_path, provider_company_img_file_name, provider_company_img_name')
        .limit(5);

    if (error) {
        console.error('Error fetching v_orders:', error);
        return;
    }

    console.table(orders.map(o => ({
        id: o.id,
        mask: o.order_mask,
        provider: o.provider_company_name,
        path: o.provider_company_img_file_path || o.provider_company_img_path,
        name: o.provider_company_img_file_name || o.provider_company_img_name
    })));

    const bucket = process.env.VITE_SUPABASE_STORAGE_BUCKET || 'siges';
    const r2Url = process.env.VITE_R2_PUBLIC_URL;

    console.log('Bucket:', bucket);
    console.log('R2 URL:', r2Url);
}

checkProviderAvatars();
