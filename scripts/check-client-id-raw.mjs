import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 1. Checar tabela orders direto
const { data: rawOrders, error: e1 } = await sb
    .from('orders')
    .select('id, order_mask, client_id, status_id, parent_id')
    .eq('status_id', 1)
    .is('parent_id', null)
    .limit(5);

console.log('\n=== tabela orders (status=1, parent=null) ===');
if (e1) console.log('ERRO:', e1.message);
else rawOrders?.forEach(r => console.log(` ${r.order_mask} | client_id: ${r.client_id}`));

// 2. Checar colunas disponíveis na v_orders
const { data: vRow, error: e2 } = await sb
    .from('v_orders')
    .select('*')
    .eq('status_id', 1)
    .is('parent_id', null)
    .limit(1);

console.log('\n=== colunas com "client" na v_orders ===');
if (e2) console.log('ERRO:', e2.message);
else if (vRow?.[0]) {
    const clientCols = Object.entries(vRow[0]).filter(([k]) => k.toLowerCase().includes('client'));
    console.log(JSON.stringify(Object.fromEntries(clientCols), null, 2));
    // Imprimir todas as colunas disponíveis
    console.log('\n=== todas as colunas da v_orders ===');
    console.log(Object.keys(vRow[0]).join(', '));
}
