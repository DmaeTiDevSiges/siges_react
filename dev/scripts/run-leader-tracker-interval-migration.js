#!/usr/bin/env node

/**
 * Execute Leader Tracker Interval Migration
 *
 * Cria trigger para ajustar automaticamente tracker_interval_seconds para líderes:
 * - Ocupado (is_ov_in_progress = true) → 10 segundos
 * - Não ocupado → 180 segundos
 */

import dotenv from 'dotenv';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

// Use individual vars for connection (connection string may have URL encoding issues)
const config = {
    host: process.env.SUPABASE_DB_HOST || 'localhost',
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || 'postgres'
};

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Leader Tracker Interval Migration          ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    console.log('Configuration:');
    console.log(`  Host: ${config.host}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  Database: ${config.database}`);
    console.log(`  User: ${config.user}`);
    console.log('');

    const client = new Client(config);

    try {
        console.log('📡 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully\n');

        // Read SQL file
        const sqlFile = path.join(__dirname, '..', 'supabase', 'triggers', 'trg_leader_tracker_interval.sql');

        if (!fs.existsSync(sqlFile)) {
            console.error(`❌ Error: SQL file not found: ${sqlFile}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlFile, 'utf8');
        console.log(`📄 SQL file loaded: ${sqlFile}`);
        console.log(`   Size: ${sql.length} bytes\n`);

        // Execute SQL
        console.log('🚀 Executing migration...');
        await client.query(sql);
        console.log('✅ Migration executed successfully\n');

        // Verify trigger exists
        console.log('🔍 Verifying trigger...');
        const triggerCheck = await client.query(`
            SELECT
                t.tgname AS trigger_name,
                p.proname AS function_name,
                t.tgtype AS trigger_type
            FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            WHERE t.tgname = 'trg_leader_tracker_interval'
              AND t.tgisdeleted = false;
        `);

        if (triggerCheck.rows.length > 0) {
            console.log('✅ Trigger found:');
            triggerCheck.rows.forEach(row => {
                console.log(`   - ${row.trigger_name} → ${row.function_name}`);
            });
        } else {
            console.log('⚠️  Trigger not found (may need verification)');
        }

        // Check leaders with updated interval
        console.log('\n👥 Leaders with tracker_interval_seconds:');
        const leadersCheck = await client.query(`
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

        if (leadersCheck.rows.length > 0) {
            leadersCheck.rows.forEach(row => {
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
        if (error.detail) {
            console.error('Detail:', error.detail);
        }
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n📡 Database connection closed');
    }
}

main();
