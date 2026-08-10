#!/usr/bin/env node

/**
 * Database Structure Export Script
 * 
 * Exports complete database structure organized by object type
 * with proper creation order for easy restoration.
 * 
 * Usage:
 *   node scripts/export-database-structure.js
 *   npm run db:export
 */

// Load environment variables from .env.local
import 'dotenv/config';

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from environment - prioritize non-VITE variables for scripts
const config = {
    host: process.env.SUPABASE_DB_HOST || 'vps.supabase.siges-app.com.br',
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || process.env.VITE_SUPABASE_DB_PASSWORD || 'postgres'
};

console.log('Database Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  User: ${config.user}`);
console.log('');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'supabase', 'database-structure');

// Directory structure with creation order
const DIRECTORIES = [
    '00-seed-data',
    '01-core-schema',
    '02-business-schema',
    '03-views',
    '04-functions',
    '05-triggers',
    '06-policies',
    '07-indexes',
    '08-constraints'
];

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Database Structure Export                   ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
    
    const client = new Client(config);
    
    try {
        console.log('📡 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully\n');
        
        // Create output directories
        console.log('📁 Creating directory structure...');
        ensureDirectories();
        console.log('✅ Directories created\n');
        
        // Export each category
        console.log('🔄 Starting export process...\n');
        
        // 1. Seed Data (reference tables)
        await exportSeedData(client);
        
        // 2. Core Schema (tables without FK dependencies)
        await exportCoreTables(client);
        
        // 3. Business Schema (tables with FKs)
        await exportBusinessTables(client);
        
        // 4. Views
        await exportViews(client);
        
        // 5. Functions
        await exportFunctions(client);
        
        // 6. Triggers
        await exportTriggers(client);
        
        // 7. RLS Policies
        await exportPolicies(client);
        
        // 8. Indexes
        await exportIndexes(client);
        
        // 9. Additional Constraints
        await exportConstraints(client);
        
        // Write metadata
        await writeMetadata();
        
        console.log('\n✅ Export completed successfully!\n');
        console.log('📂 Output directory:', OUTPUT_DIR);
        console.log('📄 Files created:', countFiles(OUTPUT_DIR));
        console.log('\nNext steps:');
        console.log('1. Review generated files in supabase/database-structure/');
        console.log('2. Commit changes to version control');
        console.log('3. Test restore with: npm run db:restore\n');
        
    } catch (error) {
        console.error('\n❌ Export failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

function ensureDirectories() {
    // Main directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Subdirectories
    DIRECTORIES.forEach(dir => {
        const dirPath = path.join(OUTPUT_DIR, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
}

async function exportSeedData(client) {
    console.log('📦 Exporting seed data (reference tables)...');
    
    const referenceTables = [
        'cfg_users_statuses',
        'cfg_contracts_statuses',
        'cfg_units_statuses',
        'cfg_systems',
        'cfg_units_types',
        'cfg_assets_types',
        'cfg_order_types',
        'cfg_services'
    ];
    
    for (const table of referenceTables) {
        try {
            const result = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = '${table}'
                ORDER BY ordinal_position
            `);
            
            if (result.rows.length === 0) continue;
            
            const data = await client.query(`SELECT * FROM public.${table} ORDER BY id`);
            
            if (data.rows.length === 0) continue;
            
            let sql = `-- =============================================================================\n`;
            sql += `-- Seed Data: ${table}\n`;
            sql += `-- Description: Reference/configuration data for ${table}\n`;
            sql += `-- Records: ${data.rows.length}\n`;
            sql += `-- =============================================================================\n\n`;
            
            // Insert statements
            const columns = Object.keys(data.rows[0]);
            sql += `INSERT INTO public.${table} (${columns.join(', ')})\nVALUES\n`;
            
            const values = data.rows.map(row => {
                const rowValues = columns.map(col => {
                    const value = row[col];
                    if (value === null) return 'NULL';
                    if (typeof value === 'boolean') return value ? 'true' : 'false';
                    if (typeof value === 'number') return value.toString();
                    return `'${String(value).replace(/'/g, "''")}'`;
                });
                return `    (${rowValues.join(', ')})`;
            });
            
            sql += values.join(',\n');
            sql += `\nON CONFLICT (id) DO NOTHING;\n\n`;
            
            const filePath = path.join(OUTPUT_DIR, '00-seed-data', `${padNumber(getFileIndex(table))}-${table}.sql`);
            fs.writeFileSync(filePath, sql);
            console.log(`   ✅ ${table} (${data.rows.length} rows)`);
            
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${table}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportCoreTables(client) {
    console.log('🏗️  Exporting core schema (no FK dependencies)...');
    
    // Tables that don't have foreign key dependencies
    const coreTables = [
        'users',
        'companies',
        'departments',
        'contracts',
        'units',
        'teams'
    ];
    
    for (const table of coreTables) {
        try {
            const exists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = '${table}'
                )
            `);
            
            if (!exists.rows[0].exists) continue;
            
            const ddl = await getTableDDL(client, table);
            const filePath = path.join(OUTPUT_DIR, '01-core-schema', `${padNumber(getFileIndex(table))}-create-${table}-table.sql`);
            fs.writeFileSync(filePath, ddl);
            console.log(`   ✅ ${table}`);
            
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${table}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportBusinessTables(client) {
    console.log('💼 Exporting business schema (with FKs)...');
    
    // Get all tables that are not core tables or seed data
    const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN (
            'cfg_users_statuses', 'cfg_contracts_statuses', 'cfg_units_statuses',
            'cfg_systems', 'cfg_units_types', 'cfg_assets_types', 
            'cfg_order_types', 'cfg_services',
            'users', 'companies', 'departments', 'contracts', 'units', 'teams',
            'pg_stat_statements', 'pg_stat_statements_info'
        )
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
        ORDER BY table_name
    `);
    
    for (const tableRow of result.rows) {
        const table = tableRow.table_name;
        try {
            const ddl = await getTableDDL(client, table);
            const filePath = path.join(OUTPUT_DIR, '02-business-schema', `${padNumber(getFileIndex(table))}-create-${table}-table.sql`);
            fs.writeFileSync(filePath, ddl);
            console.log(`   ✅ ${table}`);
            
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${table}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportViews(client) {
    console.log('👁️  Exporting views...');
    
    const result = await client.query(`
        SELECT table_name, view_definition 
        FROM information_schema.views 
        WHERE table_schema = 'public'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
        ORDER BY table_name
    `);
    
    for (const view of result.rows) {
        try {
            let sql = `-- =============================================================================\n`;
            sql += `-- View: ${view.table_name}\n`;
            sql += `-- Description: Database view\n`;
            sql += `-- =============================================================================\n\n`;
            sql += `DROP VIEW IF EXISTS public.${view.table_name} CASCADE;\n\n`;
            sql += `CREATE OR REPLACE VIEW public.${view.table_name} AS\n`;
            sql += `${view.view_definition};\n\n`;
            
            const filePath = path.join(OUTPUT_DIR, '03-views', `${padNumber(getFileIndex(view.table_name))}-create-${view.table_name}-view.sql`);
            fs.writeFileSync(filePath, sql);
            console.log(`   ✅ ${view.table_name}`);
            
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${view.table_name}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportFunctions(client) {
    console.log('⚙️  Exporting functions...');
    
    const result = await client.query(`
        SELECT routine_name, routine_definition 
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        ORDER BY routine_name
    `);
    
    for (const func of result.rows) {
        try {
            // Get full function definition from pg_proc
            const funcDetail = await client.query(`
                SELECT pg_get_functiondef(p.oid) as definition
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname = 'public'
                AND p.proname = $1
                LIMIT 1
            `, [func.routine_name]);
            
            if (funcDetail.rows.length === 0) continue;
            
            let sql = `-- =============================================================================\n`;
            sql += `-- Function: ${func.routine_name}\n`;
            sql += `-- Description: PostgreSQL function\n`;
            sql += `-- =============================================================================\n\n`;
            sql += `${funcDetail.rows[0].definition};\n\n`;
            
            const filePath = path.join(OUTPUT_DIR, '04-functions', `${padNumber(getFileIndex(func.routine_name))}-${func.routine_name}.sql`);
            fs.writeFileSync(filePath, sql);
            console.log(`   ✅ ${func.routine_name}`);
            
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${func.routine_name}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportTriggers(client) {
    console.log('🎯 Exporting triggers...');
    
    const result = await client.query(`
        SELECT 
            trigger_name,
            event_object_table as table_name,
            action_statement,
            action_timing,
            event_manipulation
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY trigger_name
    `);
    
    for (const trigger of result.rows) {
        try {
            let sql = `-- =============================================================================\n`;
            sql += `-- Trigger: ${trigger.trigger_name}\n`;
            sql += `-- Table: ${trigger.table_name}\n`;
            sql += `-- Timing: ${trigger.action_timing}\n`;
            sql += `-- Event: ${trigger.event_manipulation}\n`;
            sql += `-- =============================================================================\n\n`;
            sql += `DROP TRIGGER IF EXISTS ${trigger.trigger_name} ON public.${trigger.table_name};\n\n`;
            sql += `${trigger.action_statement}\n\n`;
            
            const filePath = path.join(OUTPUT_DIR, '05-triggers', `${padNumber(getFileIndex(trigger.trigger_name))}-${trigger.trigger_name}.sql`);
            fs.writeFileSync(filePath, sql);
            console.log(`   ✅ ${trigger.trigger_name}`);
            
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${trigger.trigger_name}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportPolicies(client) {
    console.log('🔒 Exporting RLS policies...');
    
    const result = await client.query(`
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    `);
    
    for (const policy of result.rows) {
        try {
            let sql = `-- =============================================================================\n`;
            sql += `-- RLS Policy: ${policy.policyname}\n`;
            sql += `-- Table: ${policy.tablename}\n`;
            sql += `-- Command: ${policy.cmd}\n`;
            sql += `-- Permissive: ${policy.permissive}\n`;
            sql += `-- Roles: ${policy.roles}\n`;
            sql += `-- =============================================================================\n\n`;
            
            sql += `DROP POLICY IF EXISTS ${policy.policyname} ON public.${policy.tablename};\n\n`;
            sql += `CREATE POLICY ${policy.policyname} ON public.${policy.tablename}\n`;
            sql += `FOR ${policy.cmd}\n`;
            sql += `${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}\n`;
            sql += `TO ${policy.roles}\n`;
            if (policy.qual) {
                sql += `USING (${policy.qual})\n`;
            }
            if (policy.with_check) {
                sql += `WITH CHECK (${policy.with_check})\n`;
            }
            sql += `;\n\n`;
            
            const filePath = path.join(OUTPUT_DIR, '06-policies', `${padNumber(getFileIndex(policy.policyname))}-${policy.policyname}.sql`);
            fs.writeFileSync(filePath, sql);
            console.log(`   ✅ ${policy.policyname} on ${policy.tablename}`);
            
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${policy.policyname}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportIndexes(client) {
    console.log('📊 Exporting indexes...');
    
    const result = await client.query(`
        SELECT 
            tablename,
            indexname,
            indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'  -- Exclude primary keys (created with tables)
        ORDER BY tablename, indexname
    `);
    
    for (const index of result.rows) {
        try {
            let sql = `-- =============================================================================\n`;
            sql += `-- Index: ${index.indexname}\n`;
            sql += `-- Table: ${index.tablename}\n`;
            sql += `-- =============================================================================\n\n`;
            sql += `DROP INDEX IF EXISTS public.${index.indexname};\n\n`;
            sql += `${index.indexdef};\n\n`;
            
            const filePath = path.join(OUTPUT_DIR, '07-indexes', `${padNumber(getFileIndex(index.indexname))}-${index.indexname}.sql`);
            fs.writeFileSync(filePath, sql);
            console.log(`   ✅ ${index.indexname} on ${index.tablename}`);
            
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${index.indexname}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportConstraints(client) {
    console.log('🔗 Exporting additional constraints...');
    
    const result = await client.query(`
        SELECT 
            con.conname as constraint_name,
            conrelid::regclass as table_name,
            pg_get_constraintdef(con.oid) as constraint_def
        FROM pg_constraint con
        JOIN pg_class cl ON con.conrelid = cl.oid
        JOIN pg_namespace n ON cl.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND con.contype NOT IN ('p', 'f')  -- Exclude primary keys and foreign keys
        ORDER BY con.conname
    `);
    
    for (const constraint of result.rows) {
        try {
            let sql = `-- =============================================================================\n`;
            sql += `-- Constraint: ${constraint.constraint_name}\n`;
            sql += `-- Table: ${constraint.table_name}\n`;
            sql += `-- Definition: ${constraint.constraint_def}\n`;
            sql += `-- =============================================================================\n\n`;
            
            sql += `ALTER TABLE public.${constraint.table_name}\n`;
            sql += `DROP CONSTRAINT IF EXISTS ${constraint.constraint_name};\n\n`;
            sql += `ALTER TABLE public.${constraint.table_name}\n`;
            sql += `ADD CONSTRAINT ${constraint.constraint_name}\n`;
            sql += `${constraint.constraint_def};\n\n`;
            
            const filePath = path.join(OUTPUT_DIR, '08-constraints', `${padNumber(getFileIndex(constraint.constraint_name))}-${constraint.constraint_name}.sql`);
            fs.writeFileSync(filePath, sql);
            console.log(`   ✅ ${constraint.constraint_name} on ${constraint.table_name}`);
            
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${constraint.constraint_name}:`, error.message);
        }
    }
    
    console.log('');
}

async function getTableDDL(client, tableName) {
    // Get table comment
    const commentQuery = await client.query(`
        SELECT obj_description(c.oid, 'pg_class') as comment
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relname = $1
    `, [tableName]);
    
    const tableComment = commentQuery.rows[0]?.comment || '';
    
    // Get full table definition
    const result = await client.query(`
        SELECT 
            pg_get_serial_sequence('public."' || $1 || '"', a.attname) as sequence_name,
            pg_get_constraintdef(c.oid) as constraint_def
        FROM pg_attribute a
        LEFT JOIN pg_constraint c ON a.attnum = ANY(c.conkey) 
            AND c.contype = 'f'
        WHERE a.attrelid = (SELECT oid FROM pg_class WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
        AND a.attnum > 0 
        AND NOT a.attisdropped
        LIMIT 1
    `, [tableName]);
    
    // Use pg_dump style definition
    const dumpResult = await client.query(`
        SELECT pg_get_serial_sequence('public."' || $1 || '"', a.attname)
        FROM pg_attribute a
        WHERE a.attrelid = (SELECT oid FROM pg_class WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
        AND a.attnum > 0 
        AND NOT a.attisdropped
        LIMIT 1
    `, [tableName]);
    
    let sql = `-- =============================================================================\n`;
    sql += `-- Table: ${tableName}\n`;
    if (tableComment) {
        sql += `-- Comment: ${tableComment}\n`;
    }
    sql += `-- =============================================================================\n\n`;
    
    // Drop statement
    sql += `DROP TABLE IF EXISTS public.${tableName} CASCADE;\n\n`;
    
    // Get table definition from pg_tables
    const tableDef = await client.query(`
        SELECT * FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = $1
    `, [tableName]);
    
    // Use CREATE TABLE statement
    const columns = await client.query(`
        SELECT 
            a.attname as column_name,
            format_type(a.atttypid, a.atttypmod) as data_type,
            a.attnotnull as not_null,
            pg_get_expr(d.adbin, d.adrelid) as default_value,
            col_description(a.attrelid, a.attnum) as comment
        FROM pg_attribute a
        LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
        WHERE a.attrelid = (SELECT oid FROM pg_class WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
        AND a.attnum > 0 
        AND NOT a.attisdropped
        ORDER BY a.attnum
    `, [tableName]);
    
    sql += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
    
    const columnDefs = columns.rows.map(col => {
        let def = `    ${col.column_name} ${col.data_type}`;
        if (col.default_value) def += ` DEFAULT ${col.default_value}`;
        if (col.not_null) def += ` NOT NULL`;
        return def;
    });
    
    // Get primary keys
    const pkResult = await client.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = (SELECT oid FROM pg_class WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
        AND i.indisprimary
        ORDER BY a.attnum
    `, [tableName]);
    
    if (pkResult.rows.length > 0) {
        const pks = pkResult.rows.map(r => r.attname);
        columnDefs.push(`    PRIMARY KEY (${pks.join(', ')})`);
    }
    
    sql += columnDefs.join(',\n');
    sql += `\n);\n\n`;
    
    // Add comments
    for (const col of columns.rows) {
        if (col.comment) {
            sql += `COMMENT ON COLUMN public.${tableName}.${col.column_name} IS '${col.comment}';\n`;
        }
    }
    
    if (tableComment) {
        sql += `\nCOMMENT ON TABLE public.${tableName} IS '${tableComment}';\n`;
    }
    
    sql += `\n`;
    
    return sql;
}

async function writeMetadata() {
    const metadata = {
        exportedAt: new Date().toISOString(),
        database: config.database,
        host: config.host,
        directories: DIRECTORIES,
        version: '1.0.0'
    };
    
    const metadataPath = path.join(OUTPUT_DIR, '.export-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Write last export timestamp
    const timestampPath = path.join(OUTPUT_DIR, '.last-export');
    fs.writeFileSync(timestampPath, new Date().toISOString());
}

function countFiles(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            count += countFiles(filePath);
        } else {
            count++;
        }
    }
    return count;
}

function getFileIndex(name) {
    // Simple hash to generate consistent file numbers
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash % 1000);
}

function padNumber(num) {
    return String(num).padStart(3, '0');
}

// Run if called directly
const currentModulePath = __filename;
const processMainScript = process.argv[1] && process.argv[1].replace(/\\/g, '/');

if (currentModulePath.includes(process.argv[1]?.replace(/\\/g, '/')) || process.argv[1]?.endsWith('export-database-structure.js')) {
    main();
}

export { main as exportDatabaseStructure };
