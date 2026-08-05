import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
});

async function check() {
  await client.connect();
  const res = await client.query("SELECT * FROM assets WHERE code = '9556'");
  console.log(res.rows);
  await client.end();
}
check();
