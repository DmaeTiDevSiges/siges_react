#!/usr/bin/env node

/**
 * Execute Material Purchases Migration
 * 
 * Executa a migração para criar as tabelas de compras de materiais
 */

import 'dotenv/config';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    host: process.env.SUPABASE_DB_HOST || process.env.VITE_SUPABASE_DB_HOST || 'localhost',
    port: process.env.SUPABASE_DB_PORT || process.env.VITE_SUPABASE_DB_PORT || 5432,
    database: process.env.SUPABASE_DB_NAME || process.env.VITE_SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || process.env.VITE_SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || process.env.VITE_SUPABASE_DB_PASSWORD || 'postgres'
};

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Material Purchases Migration                ║');
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
        const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260630_create_material_purchases.sql');
        
        if (!fs.existsSync(sqlFile)) {
            console.error(`❌ Error: SQL file not found: ${sqlFile}`);
            process.exit(1);
        }
        
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('📝 Executing migration...');
        console.log(`   File: ${sqlFile}\n`);
        
        await client.query(sql);
        
        console.log('✅ Migration executed successfully!\n');
        
        // Verify tables were created
        console.log('🔍 Verifying tables...');
        
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('cfg_materials_purchases_types', 'cfg_material_purchases_statuses', 'material_purchases')
            ORDER BY table_name
        `);
        
        if (tables.rows.length > 0) {
            console.log('✅ Tables created:');
            tables.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        } else {
            console.log('⚠️  No tables found. Please check the migration.');
        }
        
        // Verify permissions
        console.log('\n🔍 Verifying permissions...');
        
        const permissions = await client.query(`
            SELECT code, description 
            FROM permissions 
            WHERE code IN ('materials_purchases_create', 'materials_purchases_authorizations')
            ORDER BY code
        `);
        
        if (permissions.rows.length > 0) {
            console.log('✅ Permissions created:');
            permissions.rows.forEach(row => {
                console.log(`   - ${row.code}: ${row.description}`);
            });
        } else {
            console.log('⚠️  No permissions found. Please check the migration.');
        }
        
        console.log('\n✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
