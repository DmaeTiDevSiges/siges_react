import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('SUPABASE_DB_URL is not set in .env.local');
  process.exit(1);
}

const client = new Client({ connectionString });

async function main() {
  await client.connect();
  const res = await client.query(
    `select table_schema, table_name
     from information_schema.tables
     where table_schema = 'public'
     order by table_name;`
  );
  const tables = res.rows.map(r => r.table_name);
  console.log(`Found ${tables.length} tables in public schema:`);
  tables.forEach((t, i) => console.log(`${i + 1}. ${t}`));
  await client.end();
}

main().catch(err => {
  console.error('Error listing tables:', err);
  process.exit(1);
});
