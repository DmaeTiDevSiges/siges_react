
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vps.supabase.siges-app.com.br/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findOrder() {
    const { data: orders, error } = await supabase
        .from('v_orders')
        .select('*')
        .gte('requested_at', '2025-10-28T00:00:00')
        .lte('requested_at', '2025-10-28T23:59:59');

    if (error || !orders) {
        console.error('Orders not found:', error);
        return;
    }
    console.log('Orders found:', orders.length);
    orders.forEach(o => {
        console.log(`OS: ${o.id} Mask: ${o.o_mask} Phone: ${o.requester_phone}`);
        checkVisits(o.id);
    });
}

async function checkVisits(orderId) {
    const { data: visits, error } = await supabase
        .from('v_orders_visits')
        .select('*')
        .eq('o_id', orderId);

    console.log(`Visits for order ${orderId}:`, visits?.length || 0);
    if (visits && visits.length > 0) {
        console.log('Visit masks:', visits.map(v => v.ov_mask));
    }
}

findOrder();
