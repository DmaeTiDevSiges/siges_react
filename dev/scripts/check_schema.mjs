import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { Client } = pg;
const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
});

async function checkAndFixSchema() {
  try {
    await client.connect();
    console.log("Connected to the database.");

    // Check if columns exist
    const checkRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('shift_start', 'shift_end');
    `);
    
    console.log("Existing shift columns in 'users' table:", checkRes.rows);

    if (checkRes.rows.length < 2) {
      console.log("Columns are missing. Adding them now...");
      await client.query(`
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS shift_start TIME DEFAULT '08:00:00';
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS shift_end TIME DEFAULT '18:00:00';
      `);
      console.log("Columns added successfully.");
    } else {
      console.log("Columns already exist in the database.");
    }

    // Force schema reload
    console.log("Sending NOTIFY to PostgREST to reload schema...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Schema reload requested.");

  } catch (err) {
    console.error("Error during schema check/fix:", err);
  } finally {
    await client.end();
  }
}

checkAndFixSchema();
