import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
    console.log('🔍 Buscando SS não programadas na v_orders...');
    const { data, error } = await supabase
        .from('v_orders')
        .select('id, order_mask, client_id, client_name, unit_description, status_id, parent_id')
        .eq('status_id', 1)
        .is('parent_id', null)
        .limit(5);

    if (error) { console.error('❌ Erro:', error.message); return; }

    console.log(`\n✅ ${data?.length || 0} registros SS encontrados:\n`);
    (data || []).forEach(row => {
        console.log(`  - [${row.order_mask}] unit: "${row.unit_description}"`);
        console.log(`    client_id: ${row.client_id ?? 'NULL'} | client_name: "${row.client_name ?? 'NULL'}"`);
        console.log('');
    });
}

check();
