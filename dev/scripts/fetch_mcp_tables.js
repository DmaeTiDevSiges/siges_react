const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';

async function fetchSchema() {
  try {
    const response = await fetch(SUPABASE_URL, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const schema = await response.json();
    const paths = Object.keys(schema.paths || {});
    const tables = paths.map(p => p.slice(1)).sort();

    console.log(`Found ${tables.length} tables/views via MCP/Supabase REST API:`);
    tables.forEach((t, i) => console.log(`${i + 1}. ${t}`));
  } catch (err) {
    console.error('Error fetching schema:', err.message);
  }
}

fetchSchema();