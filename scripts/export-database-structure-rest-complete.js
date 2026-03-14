#!/usr/bin/env node

/**
 * Database Structure Export Script (REST API - Complete Version)
 * 
 * Exports complete database structure using Supabase REST API with enhanced extraction
 * Maximizes what can be exported without direct PostgreSQL connection
 * 
 * Usage:
 *   node scripts/export-database-structure-rest-complete.js
 *   npm run db:export:rest:complete
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

// Known tables to export - EXPANDED LIST for ~50+ tables
const KNOWN_TABLES = [
    // Core/Config tables (cfg_*)
    'cfg_users_statuses', 'cfg_contracts_statuses', 'cfg_units_statuses',
    'cfg_systems', 'cfg_units_types', 'cfg_assets_types', 'cfg_order_types',
    'cfg_services', 'cfg_assets_tags', 'cfg_assets_tags_subs',
    'cfg_activities', 'cfg_departments', 'cfg_places', 'cfg_positions',
    'cfg_priorities', 'cfg_situations', 'cfg_sectors', 'cfg_regions',
    
    // Main entities
    'users', 'companies', 'departments', 'contracts', 'units', 'teams',
    'profiles', 'user_attributes', 'attributes', 'positions', 'sectors',
    
    // Orders and related
    'v_orders', 'orders', 'order_requests', 'order_plans', 'order_visits_assets',
    'orders_managers', 'orders_providers', 'orders_assets', 'orders_documents',
    'orders_history', 'orders_logs', 'order_types', 'order_status',
    
    // Assets
    'assets', 'assets_attributes_values', 'assets_movements', 'assets_locations',
    'assets_histories', 'assets_documents', 'assets_photos', 'asset_types',
    
    // Visits and Services
    'visits', 'visit_occurrences', 'visit_registers', 'visit_checklists',
    'service_requests', 'service_schedule', 'service_orders', 'service_providers',
    
    // Activities
    'activities', 'activity_logs', 'activity_types', 'activity_logs_assets',
    
    // Contracts
    'contracts_units', 'contracts_managers', 'contracts_documents', 'contracts_history',
    
    // Teams and Members
    'teams_members', 'teams_departments', 'teams_positions',
    
    // Departments
    'departments_users', 'departments_sectors', 'departments_positions',
    
    // Notifications and Permissions
    'notifications', 'permissions', 'roles', 'user_roles', 'user_permissions',
    'role_permissions', 'permission_profiles',
    
    // Logs and History
    'audit_logs', 'operation_logs', 'access_logs', 'error_logs', 'system_logs',
    'change_logs', 'history_logs',
    
    // Documents and Files
    'documents', 'files', 'uploads', 'file_types', 'document_types',
    
    // Locations
    'places', 'locations', 'regions', 'addresses', 'geo_locations',
    
    // Vehicles
    'vehicles', 'vehicle_types', 'vehicle_maintenances',
    
    // Checklists
    'checklists', 'checklist_items', 'checklist_templates',
    
    // Plans
    'plans', 'plan_items', 'plan_schedules',
    
    // Schedules
    'schedules', 'schedule_items', 'calendar_events',
    
    // Reports
    'reports', 'report_templates', 'report_schedules',
    
    // Integrations
    'integrations', 'integration_logs', 'webhooks',
    
    // Settings
    'settings', 'configurations', 'preferences',
    
    // Messages
    'messages', 'message_threads', 'message_recipients',
    
    // Tasks
    'tasks', 'task_items', 'task_assignments',
    
    // Comments
    'comments', 'comment_reactions',
    
    // Favorites
    'favorites', 'bookmarks',
    
    // Tags
    'tags', 'tag_relations',
    
    // Categories
    'categories', 'category_relations',
    
    // Analytics
    'analytics', 'metrics', 'kpi_logs',
    
    // Dashboards
    'dashboards', 'dashboard_widgets', 'dashboard_configs',
    
    // Templates
    'templates', 'template_items', 'template_versions',
    
    // Workflows
    'workflows', 'workflow_steps', 'workflow_transitions',
    
    // Approvals
    'approvals', 'approval_flows', 'approval_steps',
    
    // Invoices/Billing
    'invoices', 'invoice_items', 'billing', 'payments',
    
    // Inventory
    'inventory', 'stock', 'stock_movements',
    
    // Purchases
    'purchases', 'purchase_orders', 'suppliers',
    
    // Customers/Clients
    'customers', 'clients', 'client_contacts',
    
    // Providers
    'providers', 'provider_documents', 'provider_qualifications',
    
    // Materials
    'materials', 'material_types', 'material_stocks',
    
    // Equipment
    'equipment', 'equipment_types', 'equipment_maintenances',
    
    // Tools
    'tools', 'tool_assignments', 'tool_conditions',
    
    // Inspections
    'inspections', 'inspection_items', 'inspection_results',
    
    // Quality
    'quality_checks', 'quality_standards', 'quality_issues',
    
    // Safety
    'safety_records', 'safety_incidents', 'safety_inspections',
    
    // Training
    'trainings', 'training_materials', 'training_completions',
    
    // Certifications
    'certifications', 'certification_requirements', 'certification_logs',
    
    // Compliance
    'compliance_records', 'compliance_checks', 'compliance_issues',
    
    // Risks
    'risk_assessments', 'risk_mitigations', 'risk_logs',
    
    // Incidents
    'incidents', 'incident_reports', 'incident_investigations',
    
    // Maintenance
    'maintenances', 'maintenance_schedules', 'maintenance_logs',
    
    // Operations
    'operations', 'operation_logs', 'operation_schedules',
    
    // Production
    'production', 'production_orders', 'production_logs',
    
    // Quality Control
    'qc_checks', 'qc_results', 'qc_standards',
    
    // Shipping
    'shipments', 'shipment_items', 'shipment_tracking',
    
    // Receiving
    'receiving', 'receiving_items', 'receiving_inspections'
];

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Database Export (REST API - Complete)       ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
    
    console.log('Configuration:');
    console.log(`  Supabase URL: ${config.supabaseUrl}`);
    console.log(`  Anon Key: ${config.anonKey ? '***' + config.anonKey.slice(-10) : 'NOT SET'}`);
    console.log(`  Service Role: ${config.serviceRoleKey ? 'Present' : 'Not Set (limited)'}`);
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
        
        // Test connection
        console.log('📡 Testing REST API connection...');
        if (!await testConnection()) {
            throw new Error('Failed to connect to Supabase REST API');
        }
        console.log('✅ REST API accessible\n');
        
        // Discover ALL tables
        console.log('🔍 Discovering all tables...');
        const allTables = await discoverAllTables();
        console.log(`✅ Found ${allTables.length} tables\n`);
        
        // Export everything
        console.log('🔄 Starting complete export process...\n');
        
        // 1. Export seed data
        await exportAllSeedData(allTables);
        
        // 2. Export core tables
        await exportCoreTablesEnhanced(allTables);
        
        // 3. Export business tables
        await exportBusinessTablesEnhanced(allTables);
        
        // 4. Export views with better extraction
        await exportViewsEnhanced();
        
        // 5. Try to get functions info
        await exportFunctionsInfo();
        
        // 6. Try to get triggers info
        await exportTriggersInfo();
        
        // 7. Export policies
        await exportPoliciesInfo();
        
        // Write comprehensive metadata
        await writeCompleteMetadata(allTables);
        
        console.log('\n✅ Complete export finished!\n');
        console.log('📂 Output directory:', OUTPUT_DIR);
        console.log('📄 Files created:', countFiles(OUTPUT_DIR));
        console.log(`📊 Total tables exported: ${allTables.length}`);
        console.log('\n⚠️  Note: For 100% complete export including exact function/trigger definitions,');
        console.log('   use SSH tunnel method: npm run db:export (with tunnel active)\n');
        
    } catch (error) {
        console.error('\n❌ Export failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

function ensureDirectories() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    DIRECTORIES.forEach(dir => {
        const dirPath = path.join(OUTPUT_DIR, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
}

async function testConnection() {
    try {
        const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': config.anonKey,
                'Authorization': `Bearer ${config.anonKey}`
            }
        });
        return response.ok || response.status === 400;
    } catch (error) {
        return false;
    }
}

async function discoverAllTables() {
    const discoveredTables = [];
    
    // Method 1: Try information_schema via RPC or direct query
    try {
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
            tables.forEach(t => {
                if (!discoveredTables.includes(t.table_name) && !t.table_name.startsWith('pg_')) {
                    discoveredTables.push(t.table_name);
                }
            });
            console.log(`   ✅ Found ${tables.length} tables from information_schema`);
        }
    } catch (e) {
        console.log('   ℹ️  information_schema not accessible via REST');
    }
    
    // Method 2: Test all known tables in batches
    console.log('\n   Scanning known tables (batch 1/3)...');
    let foundCount = 0;
    
    // Batch 1: Core tables
    for (const table of KNOWN_TABLES.slice(0, Math.min(100, KNOWN_TABLES.length))) {
        try {
            const response = await fetch(
                `${config.supabaseUrl}/rest/v1/${table}?select=*&limit=1`,
                {
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`,
                        'Prefer': 'count=exact'
                    }
                }
            );
            
            if (response.ok && !discoveredTables.includes(table)) {
                discoveredTables.push(table);
                foundCount++;
                if (foundCount % 10 === 0) {
                    console.log(`      Found ${foundCount} tables so far...`);
                }
            }
        } catch (e) {
            // Table doesn't exist or not accessible
        }
    }
    console.log(`   ✅ Batch 1 complete: ${foundCount} tables`);
    
    // Batch 3: Additional patterns
    console.log('\n   Scanning additional patterns (batch 2/3)...');
    const additionalPatterns = [
        // Common Supabase tables
        'schema_migrations', 'migrations', 'alembic_version',
        'storage_buckets', 'storage_objects', 'buckets',
        
        // Auth tables (if accessible)
        'sessions', 'refresh_tokens', 'identities',
        
        // Realtime
        'realtime_messages', 'realtime_logs',
        
        // Extensions
        'extensions', 'installed_extensions',
    ];
    
    for (const table of additionalPatterns) {
        try {
            const response = await fetch(
                `${config.supabaseUrl}/rest/v1/${table}?select=*&limit=1`,
                {
                    headers: {
                        'apikey': config.anonKey,
                        'Authorization': `Bearer ${config.anonKey}`
                    }
                }
            );
            
            if (response.ok && !discoveredTables.includes(table)) {
                discoveredTables.push(table);
            }
        } catch (e) {
            // Skip
        }
    }
    
    // Method 3: Brute force common table name patterns
    console.log('\n   Scanning common patterns (batch 3/3)...');
    const prefixes = ['', 'v_', 'vw_', 'tbl_', 'tmp_', 'log_', 'hist_'];
    const roots = [
        'order', 'orders', 'asset', 'assets', 'user', 'users', 'company', 'companies',
        'contract', 'contracts', 'unit', 'units', 'team', 'teams', 'visit', 'visits',
        'service', 'services', 'activity', 'activities', 'task', 'tasks', 'project', 'projects',
        'client', 'clients', 'customer', 'customers', 'provider', 'providers', 'product', 'products',
        'material', 'materials', 'equipment', 'equipments', 'tool', 'tools', 'vehicle', 'vehicles'
    ];
    const suffixes = ['', '_logs', '_history', '_types', '_status', '_items', '_documents', '_files'];
    
    let bruteForceFound = 0;
    for (const prefix of prefixes) {
        for (const root of roots) {
            for (const suffix of suffixes) {
                const tableName = `${prefix}${root}${suffix}`;
                
                if (!discoveredTables.includes(tableName)) {
                    try {
                        const response = await fetch(
                            `${config.supabaseUrl}/rest/v1/${tableName}?select=*&limit=1`,
                            {
                                headers: {
                                    'apikey': config.anonKey,
                                    'Authorization': `Bearer ${config.anonKey}`
                                }
                            }
                        );
                        
                        if (response.ok) {
                            discoveredTables.push(tableName);
                            bruteForceFound++;
                        }
                    } catch (e) {
                        // Skip
                    }
                }
            }
        }
    }
    console.log(`   ✅ Brute force found: ${bruteForceFound} additional tables`);
    
    // Save discovered tables
    const tableList = {
        exportedAt: new Date().toISOString(),
        totalTables: discoveredTables.length,
        tables: discoveredTables.sort(),
        method: 'information_schema + known_tables + brute_force'
    };
    
    const tableListPath = path.join(OUTPUT_DIR, '.table-list.json');
    fs.writeFileSync(tableListPath, JSON.stringify(tableList, null, 2));
    
    console.log(`\n   📊 Total discovered: ${discoveredTables.length} tables`);
    
    return discoveredTables;
}

async function exportAllSeedData(allTables) {
    console.log('\n📦 Exporting ALL seed data...\n');
    
    const seedTables = allTables.filter(t => 
        t.startsWith('cfg_') || 
        t.includes('status') || 
        t.includes('type') ||
        t.includes('role')
    );
    
    let exportedCount = 0;
    
    for (const table of seedTables) {
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
                    const sql = generateCompleteInsertSQL(table, data);
                    const filePath = path.join(OUTPUT_DIR, '00-seed-data', `${padNumber(getFileIndex(table))}-${table}.sql`);
                    fs.writeFileSync(filePath, sql);
                    console.log(`   ✅ ${table} (${data.length} rows)`);
                    exportedCount++;
                }
            }
        } catch (error) {
            // Continue to next table
        }
    }
    
    console.log(`\n   Exported ${exportedCount} seed tables`);
}

async function exportCoreTablesEnhanced(allTables) {
    console.log('\n🏗️  Exporting ALL core tables...\n');
    
    const coreTables = allTables.filter(t => 
        !t.startsWith('v_') && 
        !t.includes('orders') && 
        !t.includes('visits') &&
        !t.includes('assets') &&
        !t.includes('request') &&
        !t.includes('notification') &&
        !t.includes('permission') &&
        !t.includes('log') &&
        t !== 'pg_stat_statements' &&
        t !== 'pg_stat_statements_info'
    );
    
    for (const table of coreTables) {
        try {
            const ddl = await getEnhancedTableDDL(table);
            if (ddl) {
                const filePath = path.join(OUTPUT_DIR, '01-core-schema', `${padNumber(getFileIndex(table))}-create-${table}-table.sql`);
                fs.writeFileSync(filePath, ddl);
                console.log(`   ✅ ${table}`);
            }
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${table}`);
        }
    }
}

async function exportBusinessTablesEnhanced(allTables) {
    console.log('\n💼 Exporting ALL business tables...\n');
    
    const businessTables = allTables.filter(t => 
        t.includes('orders') || 
        t.includes('visits') ||
        t.includes('assets') ||
        t.includes('request') ||
        t.includes('notification') ||
        t.includes('permission') ||
        t.includes('log')
    );
    
    for (const table of businessTables) {
        try {
            const ddl = await getEnhancedTableDDL(table);
            if (ddl) {
                const filePath = path.join(OUTPUT_DIR, '02-business-schema', `${padNumber(getFileIndex(table))}-create-${table}-table.sql`);
                fs.writeFileSync(filePath, ddl);
                console.log(`   ✅ ${table}`);
            }
        } catch (error) {
            console.error(`   ⚠️  Error exporting ${table}`);
        }
    }
}

async function exportViewsEnhanced() {
    console.log('\n👁️  Exporting views with enhanced extraction...\n');
    
    // Find all views by testing common view names
    const potentialViews = [
        'v_orders', 'v_orders_visits', 'v_assets', 'v_assets_summary',
        'v_dashboard', 'v_users', 'v_companies', 'v_contracts',
        'v_teams', 'v_departments', 'v_notifications', 'v_permissions'
    ];
    
    for (const viewName of potentialViews) {
        try {
            const response = await fetch(
                `${config.supabaseUrl}/rest/v1/${viewName}?select=*&limit=1`,
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
                sql += `-- View: ${viewName}\n`;
                sql += `-- Description: Database view\n`;
                sql += `-- Exported via: REST API Enhanced\n`;
                sql += `-- Sample rows: ${data.length}\n`;
                sql += `-- =============================================================================\n\n`;
                
                sql += `DROP VIEW IF EXISTS public.${viewName} CASCADE;\n\n`;
                
                // Try to infer view structure from data
                if (data.length > 0) {
                    const columns = Object.keys(data[0]);
                    sql += `-- Inferred columns from sample data:\n`;
                    sql += `-- ${columns.join(', ')}\n\n`;
                }
                
                sql += `-- NOTE: Full CREATE VIEW definition requires direct database access.\n`;
                sql += `-- To get the actual definition, run on database:\n`;
                sql += `-- SELECT pg_get_viewdef('${viewName}'::regclass, true);\n\n`;
                
                sql += `CREATE OR REPLACE VIEW public.${viewName} AS\n`;
                sql += `SELECT \n`;
                sql += `    -- Add your SELECT statement here\n`;
                sql += `    -- This is a placeholder - replace with actual view definition\n`;
                sql += `NULL as id;\n\n`;
                
                const filePath = path.join(OUTPUT_DIR, '03-views', `${padNumber(getFileIndex(viewName))}-create-${viewName}-view.sql`);
                fs.writeFileSync(filePath, sql);
                console.log(`   ✅ ${viewName}`);
            }
        } catch (error) {
            // View doesn't exist
        }
    }
}

async function exportFunctionsInfo() {
    console.log('\n⚙️  Documenting functions (placeholder)...\n');
    
    let sql = `-- =============================================================================\n`;
    sql += `-- PostgreSQL Functions\n`;
    sql += `-- Note: Function definitions require direct database access\n`;
    sql += `-- =============================================================================\n\n`;
    
    sql += `-- Common Supabase functions (add your custom ones here):\n\n`;
    sql += `-- Example:\n`;
    sql += `-- CREATE OR REPLACE FUNCTION update_updated_at_column()\n`;
    sql += `-- RETURNS TRIGGER AS $$\n`;
    sql += `-- BEGIN\n`;
    sql += `--     NEW.updated_at = now();\n`;
    sql += `--     RETURN NEW;\n`;
    sql += `-- END;\n`;
    sql += `-- LANGUAGE plpgsql;\n\n`;
    
    const filePath = path.join(OUTPUT_DIR, '04-functions', `001-functions-placeholder.sql`);
    fs.writeFileSync(filePath, sql);
    console.log('   ℹ️  Functions placeholder created');
}

async function exportTriggersInfo() {
    console.log('\n🎯 Documenting triggers (placeholder)...\n');
    
    let sql = `-- =============================================================================\n`;
    sql += `-- Triggers\n`;
    sql += `-- Note: Trigger definitions require direct database access\n`;
    sql += `-- =============================================================================\n\n`;
    
    sql += `-- Common triggers (add your custom ones here):\n\n`;
    sql += `-- Example:\n`;
    sql += `-- CREATE TRIGGER update_updated_at\n`;
    sql += `-- BEFORE UPDATE ON users\n`;
    sql += `-- FOR EACH ROW\n`;
    sql += `-- EXECUTE FUNCTION update_updated_at_column();\n\n`;
    
    const filePath = path.join(OUTPUT_DIR, '05-triggers', `001-triggers-placeholder.sql`);
    fs.writeFileSync(filePath, sql);
    console.log('   ℹ️  Triggers placeholder created');
}

async function exportPoliciesInfo() {
    console.log('\n🔒 Documenting RLS policies (placeholder)...\n');
    
    let sql = `-- =============================================================================\n`;
    sql += `-- RLS Policies\n`;
    sql += `-- Note: Policy definitions may be incomplete via REST API\n`;
    sql += `-- =============================================================================\n\n`;
    
    sql += `-- Enable RLS on tables:\n`;
    sql += `-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;\n\n`;
    
    sql += `-- Common policies (add your custom ones here):\n\n`;
    sql += `-- Example:\n`;
    sql += `-- CREATE POLICY "Users can view own data"\n`;
    sql += `-- ON users FOR SELECT\n`;
    sql += `-- USING (auth.uid() = id);\n\n`;
    
    const filePath = path.join(OUTPUT_DIR, '06-policies', `001-policies-placeholder.sql`);
    fs.writeFileSync(filePath, sql);
    console.log('   ℹ️  Policies placeholder created');
}

async function getEnhancedTableDDL(tableName) {
    try {
        // Get sample data with multiple rows to better infer types
        const response = await fetch(
            `${config.supabaseUrl}/rest/v1/${tableName}?select=*&limit=10`,
            {
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': `Bearer ${config.anonKey}`
                }
            }
        );
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        
        let sql = `-- =============================================================================\n`;
        sql += `-- Table: ${tableName}\n`;
        sql += `-- Exported: ${new Date().toISOString()}\n`;
        sql += `-- Method: REST API Enhanced Extraction\n`;
        sql += `-- =============================================================================\n\n`;
        
        sql += `DROP TABLE IF EXISTS public.${tableName} CASCADE;\n\n`;
        sql += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
        
        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            const columnDefs = [];
            
            for (const col of columns) {
                const sampleValue = data[0][col];
                const allValues = data.map(row => row[col]);
                const type = inferColumnType(col, sampleValue, allValues);
                columnDefs.push(`    ${col} ${type}`);
            }
            
            // Add primary key
            if (columns.includes('id')) {
                columnDefs.push(`    PRIMARY KEY (id)`);
            }
            
            sql += columnDefs.join(',\n');
        } else {
            sql += `    id bigint GENERATED BY DEFAULT AS IDENTITY,\n`;
            sql += `    created_at timestamp DEFAULT now()\n`;
        }
        
        sql += `\n);\n\n`;
        
        // Add indexes
        sql += `-- Indexes (add based on your query patterns):\n`;
        sql += `-- CREATE INDEX idx_${tableName}_created_at ON public.${tableName}(created_at);\n`;
        sql += `-- CREATE INDEX idx_${tableName}_user_id ON public.${tableName}(user_id);\n\n`;
        
        return sql;
        
    } catch (error) {
        return null;
    }
}

function inferColumnType(columnName, sampleValue, allValues) {
    // Handle null values
    if (sampleValue === null || sampleValue === undefined) {
        return 'text';
    }
    
    // ID columns
    if (columnName === 'id') {
        return 'bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL';
    }
    
    // Timestamp columns
    if (columnName.endsWith('_at') || columnName.includes('date')) {
        if (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue))) {
            return 'timestamp without time zone DEFAULT now()';
        }
    }
    
    // Boolean
    if (typeof sampleValue === 'boolean') {
        return 'boolean DEFAULT false';
    }
    
    // Numbers
    if (typeof sampleValue === 'number') {
        if (Number.isInteger(sampleValue)) {
            if (sampleValue > 2147483647 || sampleValue < -2147483648) {
                return 'bigint';
            }
            return 'integer';
        }
        return 'numeric';
    }
    
    // Objects/Arrays (JSON)
    if (typeof sampleValue === 'object') {
        if (Array.isArray(sampleValue)) {
            return 'jsonb';
        }
        return 'jsonb';
    }
    
    // Strings - check for common patterns
    if (typeof sampleValue === 'string') {
        // Email
        if (columnName.includes('email') || sampleValue.includes('@')) {
            return 'character varying(255)';
        }
        
        // UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sampleValue)) {
            return 'uuid DEFAULT gen_random_uuid()';
        }
        
        // Phone
        if (columnName.includes('phone') || columnName.includes('tel')) {
            return 'character varying(20)';
        }
        
        // URL
        if (sampleValue.startsWith('http://') || sampleValue.startsWith('https://')) {
            return 'text';
        }
        
        // Text vs varchar
        if (sampleValue.length > 255) {
            return 'text';
        }
        return 'character varying(255)';
    }
    
    return 'text';
}

function generateCompleteInsertSQL(tableName, data) {
    if (!data || data.length === 0) {
        return '';
    }
    
    let sql = `-- =============================================================================\n`;
    sql += `-- Seed Data: ${tableName}\n`;
    sql += `-- Exported: ${new Date().toISOString()}\n`;
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
            if (typeof value === 'object') {
                return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            }
            return `'${String(value).replace(/'/g, "''").replace(/\n/g, '\\n')}'`;
        });
        return `    (${rowValues.join(', ')})`;
    });
    
    sql += values.join(',\n');
    sql += `\nON CONFLICT (id) DO NOTHING;\n\n`;
    
    return sql;
}

async function writeCompleteMetadata(allTables) {
    const metadata = {
        exportedAt: new Date().toISOString(),
        method: 'REST_API_ENHANCED',
        supabaseUrl: config.supabaseUrl,
        totalTablesExported: allTables.length,
        tables: allTables.sort(),
        directories: DIRECTORIES,
        version: '2.0.0',
        features: [
            'Complete table discovery',
            'Enhanced type inference',
            'Full seed data export',
            'All accessible tables',
            'Improved column detection'
        ],
        limitations: [
            'View definitions are placeholders (need direct access for exact SQL)',
            'Function bodies require direct database access',
            'Trigger definitions require direct database access',
            'Some RLS policies may need manual verification'
        ]
    };
    
    const metadataPath = path.join(OUTPUT_DIR, '.export-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
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

if (currentModulePath.includes(process.argv[1]?.replace(/\\/g, '/')) || process.argv[1]?.endsWith('export-database-structure-rest-complete.js')) {
    main();
}

export { main as exportDatabaseStructureRESTComplete };
