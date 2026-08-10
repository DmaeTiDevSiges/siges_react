import pg from 'pg';
const { Client } = pg;

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:Hostinger@6939@31.97.17.100:5432/postgres'
    });
    try {
        await client.connect();

        console.log('--- ASSET 30996 ---');
        const asset = await client.query("SELECT * FROM public.assets WHERE code = '30996';");
        console.log(JSON.stringify(asset.rows, null, 2));

        if (asset.rows.length > 0 && asset.rows[0].type_id) {
            console.log('\n--- ASSET TYPE ---');
            const type = await client.query("SELECT * FROM public.cfg_assets_types WHERE id = $1;", [asset.rows[0].type_id]);
            console.log(JSON.stringify(type.rows, null, 2));
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
