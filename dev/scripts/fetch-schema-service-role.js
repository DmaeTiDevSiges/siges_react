import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchSchema() {
    try {
        console.log('Fetching OpenAPI schema with service role key...');
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const schema = await response.json();
        const outputPath = path.join(__dirname, '..', 'vps_schema_info_service_role.json');
        fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
        console.log(`Schema saved to ${outputPath}`);

        const tables = Object.keys(schema.definitions || {}).sort();
        console.log(`Tables found: ${tables.length}`);
        tables.forEach((t, i) => console.log(`${i + 1}. ${t}`));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

fetchSchema();