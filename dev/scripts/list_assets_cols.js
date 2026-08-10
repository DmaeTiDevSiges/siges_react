const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';
const s = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await s.from('v_orders_visits').select('*').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    const keys = Object.keys(data[0]);
    console.log('--- Columns containing "assets" in v_orders_visits ---');
    console.log(keys.filter(k => k.includes('assets')).sort());
}
run();
