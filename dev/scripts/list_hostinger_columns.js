import pg from 'pg';
const { Client } = pg;

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:Hostinger@6939@31.97.17.100:5432/postgres'
    });
    try {
        await client.connect();

        console.log('--- COLUMNS OF TABLE assets ---');
        const columns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assets' AND table_schema = 'public';
        `);
        console.log(JSON.stringify(columns.rows, null, 2));

        console.log('\n--- FIRST ROW OF assets (DEBUG) ---');
        const row = await client.query("SELECT * FROM public.assets LIMIT 1;");
        console.log(JSON.stringify(row.rows, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
