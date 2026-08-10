#!/usr/bin/env node

/**
 * Execute Leader Tracker Interval Migration via REST API
 *
 * Cria trigger para ajustar automaticamente tracker_interval_seconds para líderes:
 * - Ocupado (is_ov_in_progress = true) → 10 segundos
 * - Não ocupado → 180 segundos
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from project root
const envPath = path.resolve(__dirname, '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function executeSQL(sql) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
}

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Leader Tracker Interval Migration (REST)   ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
    console.log('');

    // Read SQL file
    const sqlFile = path.join(__dirname, '..', 'supabase', 'triggers', 'trg_leader_tracker_interval.sql');

    if (!fs.existsSync(sqlFile)) {
        console.error(`❌ Error: SQL file not found: ${sqlFile}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log(`📄 SQL file loaded: ${sqlFile}`);
    console.log(`   Size: ${sql.length} bytes\n`);

    try {
        // Execute SQL
        console.log('🚀 Executing migration...');
        const result = await executeSQL(sql);
        console.log('✅ Migration executed successfully');
        if (result) {
            console.log('   Result:', JSON.stringify(result));
        }
        console.log('');

        // Verify trigger exists
        console.log('🔍 Verifying trigger...');
        const verifyResult = await executeSQL(`
            SELECT
                t.tgname AS trigger_name,
                p.proname AS function_name
            FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            WHERE t.tgname = 'trg_leader_tracker_interval'
              AND t.tgisdeleted = false;
        `);

        if (verifyResult && verifyResult.length > 0) {
            console.log('✅ Trigger found:');
            verifyResult.forEach(row => {
                console.log(`   - ${row.trigger_name} → ${row.function_name}`);
            });
        } else {
            console.log('⚠️  Trigger verification returned no results');
        }

        // Check leaders with updated interval
        console.log('\n👥 Leaders with tracker_interval_seconds:');
        const leadersResult = await executeSQL(`
            SELECT
                id,
                name_short,
                is_team_leader,
                is_ov_in_progress,
                tracker_interval_seconds
            FROM public.users
            WHERE is_team_leader = true
            ORDER BY id;
        `);

        if (leadersResult && leadersResult.length > 0) {
            leadersResult.forEach(row => {
                const status = row.is_ov_in_progress ? '🔴 Ocupado' : '🟢 Livre';
                console.log(`   - ${row.name_short} (ID: ${row.id}): ${status} → ${row.tracker_interval_seconds}s`);
            });
        } else {
            console.log('   No leaders found');
        }

        console.log('\n✨ Migration complete!');

    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error(error.message);
        process.exit(1);
    }
}

main();
