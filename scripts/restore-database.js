#!/usr/bin/env node

/**
 * Database Restore Script
 * 
 * Restores database structure from organized SQL files
 * in the correct order to avoid dependency issues.
 * 
 * Usage:
 *   node scripts/restore-database.js --host <host> --database <db> --user <user>
 *   npm run db:restore
 */

// Load environment variables from .env.local
import 'dotenv/config';

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = promisify(rl.question).bind(rl);

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = {};
args.forEach((arg, index) => {
    if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = args[index + 1];
        if (value && !value.startsWith('--')) {
            argMap[key] = value;
        } else {
            argMap[key] = true;
        }
    }
});

// Configuration
const config = {
    host: argMap.host || process.env.VITE_SUPABASE_DB_HOST || 'localhost',
    port: argMap.port || process.env.VITE_SUPABASE_DB_PORT || 5432,
    database: argMap.database || process.env.VITE_SUPABASE_DB_NAME || 'postgres',
    user: argMap.user || process.env.VITE_SUPABASE_DB_USER || 'postgres',
    password: argMap.password || process.env.VITE_SUPABASE_DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD || 'postgres'
};

const DRY_RUN = argMap['dry-run'] || argMap.dryRun || false;
const SKIP_CONFIRMATION = argMap.yes || argMap.force || false;

// Input directory
const INPUT_DIR = path.join(__dirname, '..', 'supabase', 'database-structure');

// Directory execution order
const EXECUTION_ORDER = [
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
    console.log('║   Database Structure Restore                  ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
    
    console.log('Configuration:');
    console.log(`  Host: ${config.host}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  Database: ${config.database}`);
    console.log(`  User: ${config.user}`);
    console.log(`  Dry Run: ${DRY_RUN ? 'Yes (no changes will be made)' : 'No'}`);
    console.log('');
    
    // Check if input directory exists
    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`❌ Error: Directory not found: ${INPUT_DIR}`);
        console.error('\nPlease run database export first:');
        console.error('   npm run db:export\n');
        process.exit(1);
    }
    
    // Confirmation
    if (!SKIP_CONFIRMATION && !DRY_RUN) {
        console.warn('⚠️  WARNING: This will modify your database structure!');
        console.warn('⚠️  Make sure you have a recent backup before proceeding.\n');
        
        const answer = await question('Do you want to continue? (yes/no): ');
        rl.close();
        
        if (answer.toLowerCase() !== 'yes') {
            console.log('\n❌ Restore cancelled by user.\n');
            process.exit(0);
        }
    }
    
    const client = new Client(config);
    
    try {
        console.log('\n📡 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully\n');
        
        // Execute each directory in order
        for (const directory of EXECUTION_ORDER) {
            const dirPath = path.join(INPUT_DIR, directory);
            
            if (!fs.existsSync(dirPath)) {
                console.log(`⏭️  Skipping ${directory} (directory not found)`);
                continue;
            }
            
            console.log(`📂 Processing ${directory}...`);
            
            const files = fs.readdirSync(dirPath)
                .filter(f => f.endsWith('.sql'))
                .sort(); // Files are already numbered
            
            if (files.length === 0) {
                console.log(`   ℹ️  No SQL files found`);
                continue;
            }
            
            console.log(`   Found ${files.length} file(s)`);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const sql = fs.readFileSync(filePath, 'utf8');
                
                if (DRY_RUN) {
                    console.log(`   📄 Would execute: ${file}`);
                } else {
                    try {
                        await client.query(sql);
                        console.log(`   ✅ Executed: ${file}`);
                    } catch (error) {
                        console.error(`   ❌ Error in ${file}:`, error.message);
                        
                        // Continue with next file instead of stopping
                        if (!argMap['stop-on-error']) {
                            console.log(`   ⏭️  Continuing with next file...`);
                        } else {
                            throw error;
                        }
                    }
                }
            }
            
            console.log('');
        }
        
        if (DRY_RUN) {
            console.log('\n✅ Dry run completed. No changes were made.');
            console.log('ℹ️  Remove --dry-run flag to actually execute the restore.\n');
        } else {
            console.log('\n✅ Database restore completed successfully!\n');
            console.log('Next steps:');
            console.log('1. Verify the restored structure');
            console.log('2. Test your application');
            console.log('3. Update documentation if needed\n');
        }
        
    } catch (error) {
        console.error('\n❌ Restore failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await client.end();
        rl.close();
    }
}

// Run if called directly
const currentModulePath = fileURLToPath(import.meta.url);

if (process.argv[1] && currentModulePath.includes(process.argv[1].replace(/\\/g, '/'))) {
    main();
}

export { main as restoreDatabase };
