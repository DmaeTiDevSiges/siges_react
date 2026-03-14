const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';

async function checkVpsState() {
    console.log('--- Checking VPS State ---');
    try {
        // 1. Check users_notifications table columns
        const failResponse = await fetch(`${SUPABASE_URL}rest/v1/users_notifications?select=non_existent_column`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const failData = await failResponse.json();
        console.log('\nTable users_notifications columns (via error):');
        console.log(JSON.stringify(failData, null, 2));

        // 2. Check if any users are Super Admins
        const usersResp = await fetch(`${SUPABASE_URL}rest/v1/users?select=id,email,is_admin_super&is_admin_super=eq.true`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const usersData = await usersResp.json();
        console.log('\nSuper Admin users found:', JSON.stringify(usersData, null, 2));

        // 3. Check for any notifications
        const notifResp = await fetch(`${SUPABASE_URL}rest/v1/users_notifications?limit=5`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const notifData = await notifResp.json();
        console.log('\nRecent notifications:', JSON.stringify(notifData, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkVpsState();
