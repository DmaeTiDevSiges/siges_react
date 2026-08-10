#!/usr/bin/env node

/**
 * Database Structure Export Script (REST API Version)
 * 
 * Exports complete database structure using Supabase REST API
 * No direct PostgreSQL connection required!
 * 
 * Usage:
 *   node scripts/export-database-structure-rest.js
 *   npm run db:export:rest
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local explicitly
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// Configuration from environment
const config = {
    supabaseUrl: process.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || 'https://vps.supabase.siges-app.com.br',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

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
    console.log('║   Database Structure Export (REST API)        ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
    
    console.log('Configuration:');
    console.log(`  Supabase URL: ${config.supabaseUrl}`);
    console.log(`  Anon Key: ${config.anonKey ? '***' + config.anonKey.slice(-10) : 'NOT SET'}`);
    console.log(`  Service Role: ${config.serviceRoleKey ? '***' + config.serviceRoleKey.slice(-10) : 'NOT SET (limited access)'}`);
    console.log('');
    
    if (!config.anonKey) {
        console.error('❌ Error: VITE_SUPABASE_ANON_KEY not found in .env.local');
        process.exit(1);
    }
    
    try {
        // Create output directories
        console.log('📁 Creating directory structure...');
        ensureDirectories();
        console.log('✅ Directories created\n');
        
        // Test connection first
        console.log('📡 Testing REST API connection...');
        const testResult = await testConnection();
        if (!testResult) {
            throw new Error('Failed to connect to Supabase REST API');
        }
        console.log('✅ REST API accessible\n');
        
        // Export using REST API
        console.log('🔄 Starting export process...\n');
        
        // 1. Get list of tables via RPC or information_schema query
        await exportTableList();
        
        // 2. Export seed data (reference tables)
        await exportSeedDataREST();
        
        // 3. Export core tables
        await exportCoreTablesREST();
        
        // 4. Export business tables
        await exportBusinessTablesREST();
        
        // 5. Export views
        await exportViewsREST();
        
        // Note: Functions, triggers, policies require service role key or direct DB access
        // We'll create placeholder files noting this limitation
        
        // Write metadata
        await writeMetadata();
        
        console.log('\n✅ Export completed successfully!\n');
        console.log('📂 Output directory:', OUTPUT_DIR);
        console.log('📄 Files created:', countFiles(OUTPUT_DIR));
        console.log('\n⚠️  Note: Some objects (functions, triggers, advanced policies)');
        console.log('   require direct database access and cannot be exported via REST API.');
        console.log('\nNext steps:');
        console.log('1. Review generated files in supabase/database-structure/');
        console.log('2. Commit changes to version control');
        console.log('3. For complete export, use SSH tunnel with direct connection script\n');
        
    } catch (error) {
        console.error('\n❌ Export failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
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

async function testConnection() {
    try {
        // Try to access a simple endpoint
        const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': config.anonKey,
                'Authorization': `Bearer ${config.anonKey}`
            }
        });
        
        if (response.ok || response.status === 400) {
            // Even 400 means the endpoint exists (just needs proper query)
            return true;
        }
        
        console.error(`❌ Connection failed: ${response.status} ${response.statusText}`);
        return false;
        
    } catch (error) {
        console.error(`❌ Connection error: ${error.message}`);
        return false;
    }
}

async function exportTableList() {
    console.log('📋 Discovering tables...');
    
    try {
        // Query information_schema through REST API
        const response = await fetch(
            `${config.supabaseUrl}/rest/v1/information_schema.tables?select=table_name&table_schema=eq.public`,
            {
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': `Bearer ${config.anonKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.ok) {
            const tables = await response.json();
            console.log(`✅ Found ${tables.length} tables`);
            
            // Save table list for reference
            const tableList = {
                exportedAt: new Date().toISOString(),
                tables: tables.map(t => t.table_name).sort()
            };
            
            const tableListPath = path.join(OUTPUT_DIR, '.table-list.json');
            fs.writeFileSync(tableListPath, JSON.stringify(tableList, null, 2));
            
            return tables.map(t => t.table_name);
        } else {
            console.log('⚠️  Could not retrieve full table list via REST API');
            console.log('   Will attempt to export known tables...\n');
            
            // Fallback: try common table names
            const knownTables = [
                'users', 'companies', 'departments', 'contracts', 'units', 'teams',
                'v_orders', 'assets', 'orders_visits', 'cfg_assets_types',
                'cfg_users_statuses', 'cfg_contracts_statuses', 'cfg_units_statuses'
            ];
            
            const accessibleTables = [];
            for (const table of knownTables) {
                try {
                    const testResponse = await fetch(
                        `${config.supabaseUrl}/rest/v1/${table}?select=*&limit=1`,
                        {
                            headers: {
                                'apikey': config.anonKey,
                                'Authorization': `Bearer ${config.anonKey}`
                            }
                        }
                    );
                    
                    if (testResponse.ok) {
                        accessibleTables.push(table);
                        console.log(`   ✅ ${table}`);
                    }
                } catch (e) {
                    // Skip inaccessible tables
                }
            }
            
            console.log(`\n✅ Found ${accessibleTables.length} accessible tables`);
            return accessibleTables;
        }
        
    } catch (error) {
        console.error('⚠️  Error discovering tables:', error.message);
        return [];
    }
}

async function exportSeedDataREST() {
    console.log('\n📦 Exporting seed data (reference tables)...');
    
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
            const response = await fetch(
                `${config.supabaseUrl}/rest/v1/${table}?select=*&order=id.asc`,
                {
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                
                if (data && data.length > 0) {
                    let sql = generateInsertSQL(table, data);
                    
                    const filePath = path.join(OUTPUT_DIR, '00-seed-data', `${padNumber(getFileIndex(table))}-${table}.sql`);
                    fs.writeFileSync(filePath, sql);
                    console.log(`   ✅ ${table} (${data.length} rows)`);
                }
            }
        } catch (error) {
            // Table may not exist or accessible
        }
    }
    
    console.log('');
}

async function exportCoreTablesREST() {
    console.log('🏗️  Exporting core schema...');
    
    const coreTables = ['users', 'companies', 'departments', 'contracts', 'units', 'teams'];
    
    for (const table of coreTables) {
        try {
            const ddl = await getTableDDLREST(table);
            if (ddl) {
                const filePath = path.join(OUTPUT_DIR, '01-core-schema', `${padNumber(getFileIndex(table))}-create-${table}-table.sql`);
                fs.writeFileSync(filePath, ddl);
                console.log(`   ✅ ${table}`);
            }
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${table}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportBusinessTablesREST() {
    console.log('💼 Exporting business schema...');
    
    const businessTables = [
        'v_orders', 'assets', 'orders_visits', 'order_requests',
        'service_requests', 'notifications', 'permissions', 'profiles'
    ];
    
    for (const table of businessTables) {
        try {
            const ddl = await getTableDDLREST(table);
            if (ddl) {
                const filePath = path.join(OUTPUT_DIR, '02-business-schema', `${padNumber(getFileIndex(table))}-create-${table}-table.sql`);
                fs.writeFileSync(filePath, ddl);
                console.log(`   ✅ ${table}`);
            }
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${table}:`, error.message);
        }
    }
    
    console.log('');
}

async function exportViewsREST() {
    console.log('👁️  Exporting views...');
    
    // Views are typically accessible via REST API
    const commonViews = ['v_orders_visits', 'v_assets_summary', 'v_dashboard'];
    
    for (const view of commonViews) {
        try {
            const response = await fetch(
                `${config.supabaseUrl}/rest/v1/${view}?select=*&limit=1`,
                {
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                
                let sql = `-- =============================================================================\n`;
                sql += `-- View: ${view}\n`;
                sql += `-- Description: Database view (exported via REST API)\n`;
                sql += `-- Sample rows: ${data.length}\n`;
                sql += `-- =============================================================================\n\n`;
                sql += `-- Note: Full view definition requires direct database access.\n`;
                sql += `-- This is a placeholder. To get the actual view definition:\n`;
                sql += `-- 1. Use SSH tunnel with direct connection\n`;
                sql += `-- 2. Or query: SELECT pg_get_viewdef('${view}'::regclass, true);\n\n`;
                sql += `DROP VIEW IF EXISTS public.${view} CASCADE;\n\n`;
                sql += `-- CREATE VIEW statement goes here (requires direct DB access)\n\n`;
                
                const filePath = path.join(OUTPUT_DIR, '03-views', `${padNumber(getFileIndex(view))}-create-${view}-view.sql`);
                fs.writeFileSync(filePath, sql);
                console.log(`   ✅ ${view} (placeholder - requires direct access for full definition)`);
            }
        } catch (error) {
            // View may not exist
        }
    }
    
    console.log('');
}

async function getTableDDLREST(tableName) {
    try {
        // Try to get sample data to infer structure
        const response = await fetch(
            `${config.supabaseUrl}/rest/v1/${tableName}?select=*&limit=1`,
            {
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': `Bearer ${config.anonKey}`
                }
            }
        );
        
        if (!response.ok) {
            return null; // Table not accessible
        }
        
        const data = await response.json();
        
        // Get column information from response headers or first row
        let sql = `-- =============================================================================\n`;
        sql += `-- Table: ${tableName}\n`;
        sql += `-- Description: Table structure (inferred from REST API response)\n`;
        sql += `-- =============================================================================\n\n`;
        sql += `DROP TABLE IF EXISTS public.${tableName} CASCADE;\n\n`;
        sql += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
        
        if (data && data.length > 0 && Object.keys(data[0]).length > 0) {
            const columns = Object.keys(data[0]);
            const columnDefs = columns.map(col => {
                const value = data[0][col];
                let type = 'text';
                
                // Infer type from value
                if (typeof value === 'number') {
                    type = Number.isInteger(value) ? 'bigint' : 'numeric';
                } else if (typeof value === 'boolean') {
                    type = 'boolean';
                } else if (value && !isNaN(Date.parse(value))) {
                    type = 'timestamp';
                } else if (value && typeof value === 'object') {
                    type = 'jsonb';
                }
                
                // Common column patterns
                if (col === 'id') type = 'bigint GENERATED BY DEFAULT AS IDENTITY';
                if (col.endsWith('_at')) type = 'timestamp without time zone DEFAULT now()';
                if (col.endsWith('_user_id')) type = 'bigint';
                if (col === 'created_at' || col === 'updated_at' || col === 'deleted_at') {
                    type = 'timestamp without time zone DEFAULT now()';
                }
                
                return `    ${col} ${type}`;
            });
            
            // Add primary key if id column exists
            if (columns.includes('id')) {
                columnDefs.push(`    PRIMARY KEY (id)`);
            }
            
            sql += columnDefs.join(',\n');
        } else {
            sql += `    -- Column definitions require direct database access\n`;
            sql += `    id bigint GENERATED BY DEFAULT AS IDENTITY,\n`;
            sql += `    created_at timestamp DEFAULT now()\n`;
        }
        
        sql += `\n);\n\n`;
        sql += `-- Note: This is an inferred structure. For exact DDL, use direct database access.\n\n`;
        
        return sql;
        
    } catch (error) {
        return null;
    }
}

function generateInsertSQL(tableName, data) {
    if (!data || data.length === 0) {
        return '';
    }
    
    let sql = `-- =============================================================================\n`;
    sql += `-- Seed Data: ${tableName}\n`;
    sql += `-- Description: Reference/configuration data for ${tableName}\n`;
    sql += `-- Records: ${data.length}\n`;
    sql += `-- =============================================================================\n\n`;
    
    const columns = Object.keys(data[0]);
    
    sql += `INSERT INTO public.${tableName} (${columns.join(', ')})\nVALUES\n`;
    
    const values = data.map(row => {
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
    
    return sql;
}

async function writeMetadata() {
    const metadata = {
        exportedAt: new Date().toISOString(),
        method: 'REST_API',
        supabaseUrl: config.supabaseUrl,
        directories: DIRECTORIES,
        version: '1.0.0',
        limitations: [
            'Functions, triggers, and advanced policies require direct DB access',
            'View definitions are placeholders',
            'Column types are inferred from sample data'
        ]
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

if (currentModulePath.includes(process.argv[1]?.replace(/\\/g, '/')) || process.argv[1]?.endsWith('export-database-structure-rest.js')) {
    main();
}

export { main as exportDatabaseStructureREST };
