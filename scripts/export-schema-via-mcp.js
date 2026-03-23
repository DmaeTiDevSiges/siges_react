#!/usr/bin/env node

/**
 * Export Database Schema via MCP HTTP Endpoint
 *
 * Generates complete schema.sql from self-hosted Supabase via HTTP MCP
 * No direct PostgreSQL connection required
 *
 * Usage:
 *   node scripts/export-schema-via-mcp.js
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function queryRestAPI(sql) {
    try {
        console.log(`📊 Executing: ${sql.substring(0, 60)}...`);
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
            throw new Error(`REST API returned ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Query failed:', err.message);
        return null;
    }
}

async function getTableStructure(tableName) {
    const query = `
        SELECT column_name, data_type, is_nullable, column_default, ordinal_position
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
    `;

    try {
        return await queryDatabase(query);
    } catch (err) {
        console.error(`Failed to get structure for ${tableName}`);
        return [];
    }
}

function generateCreateTableDDL(tableName, columns) {
    if (!columns || columns.length === 0) return '';

    let ddl = `CREATE TABLE public.${tableName} (\n`;

    const colLines = columns.map((col, idx) => {
        let line = `    ${col.column_name} ${col.data_type}`;

        if (col.column_default) {
            line += ` DEFAULT ${col.column_default}`;
        }

        if (col.is_nullable === 'NO') {
            line += ` NOT NULL`;
        }

        return line;
    });

    ddl += colLines.join(',\n');
    ddl += '\n);\n\n';

    return ddl;
}

function buildHeader() {
    const now = new Date().toISOString();
    return `-- =============================================================================
-- Complete Database Schema Export
-- Generated via MCP HTTP Endpoint: ${MCP_URL}
-- Timestamp: ${now}
-- Source: Self-Hosted Supabase (Read-Only Export)
-- =============================================================================

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;

-- =============================================================================
-- Tables
-- =============================================================================

`;
}

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Schema Export via MCP HTTP Endpoint        ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    try {
        // Backup existing schema.sql
        if (fs.existsSync(OUTPUT_FILE)) {
            fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
            console.log(`✅ Backed up existing schema.sql`);
        }

        // Get list of all tables
        console.log('\n📡 Fetching table list from MCP...');
        const tablesResult = await queryDatabase(TABLES_QUERY);

        if (!tablesResult || tablesResult.length === 0) {
            console.error('❌ No tables found. Check MCP connection and permissions.');
            process.exit(1);
        }

        const tables = tablesResult.map(row => row.table_name).sort();
        console.log(`✅ Found ${tables.length} tables:\n`, tables.slice(0, 10).join(', '), '...\n');

        // Build schema.sql
        let schemaSQL = buildHeader();

        // Export each table
        for (const tableName of tables) {
            console.log(`🔄 Exporting table: ${tableName}`);
            const columns = await getTableStructure(tableName);
            if (columns && columns.length > 0) {
                schemaSQL += generateCreateTableDDL(tableName, columns);
            }
        }

        // Write to file
        fs.writeFileSync(OUTPUT_FILE, schemaSQL);
        console.log(`\n✅ Schema exported to: ${OUTPUT_FILE}`);
        console.log(`📊 Total tables exported: ${tables.length}`);

    } catch (err) {
        console.error('❌ Export failed:', err.message);
        process.exit(1);
    }
}

main();