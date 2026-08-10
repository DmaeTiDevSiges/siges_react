import pg from 'pg';
const { Client } = pg;

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:Hostinger@6939@31.97.17.100:5432/postgres'
    });
    try {
        await client.connect();
        console.log('--- COMPANIES ---');
        const companies = await client.query("SELECT id, description, code FROM public.cfg_companies WHERE description ILIKE '%DMAE%' OR code ILIKE '%DMAE%';");
        console.log(JSON.stringify(companies.rows));

        if (companies.rows.length > 0) {
            const dmaeId = companies.rows[0].id;
            console.log('\n--- CONTRACTS for DMAE ---');
            const contracts = await client.query("SELECT * FROM public.contracts WHERE client_company_id = $1 OR provider_company_id = $1;", [dmaeId]);
            console.log(JSON.stringify(contracts.rows));
        } else {
            console.log('\n--- ALL COMPANIES (first 10) ---');
            const allComps = await client.query("SELECT id, description, code FROM public.cfg_companies LIMIT 10;");
            console.log(JSON.stringify(allComps.rows));
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
