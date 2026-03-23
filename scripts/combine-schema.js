#!/usr/bin/env node

/**
 * Combine Database Structure Files into Complete Schema
 *
 * Combines all .sql files from supabase/database-structure/ in order
 * to create a complete schema.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRUCTURE_DIR = path.join(__dirname, '..', 'supabase', 'database-structure');
const OUTPUT_FILE = path.join(__dirname, '..', 'supabase', 'schema.sql');
const BACKUP_FILE = path.join(__dirname, '..', 'supabase', 'schema.sql.backup');

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

function getSQLFiles(dir) {
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir)
        .filter(file => file.endsWith('.sql'))
        .map(file => path.join(dir, file))
        .sort();
}

function combineFiles() {
    let content = `-- =============================================================================
-- Complete Database Schema Export
-- Generated from supabase/database-structure/
-- Timestamp: ${new Date().toISOString()}
-- =============================================================================

`;

    for (const dirName of DIRECTORIES) {
        const dirPath = path.join(STRUCTURE_DIR, dirName);
        const files = getSQLFiles(dirPath);

        if (files.length > 0) {
            content += `-- =============================================================================
-- ${dirName.toUpperCase().replace('-', ' ')}
-- =============================================================================

`;

            for (const file of files) {
                const fileContent = fs.readFileSync(file, 'utf8');
                content += `-- File: ${path.relative(STRUCTURE_DIR, file)}
${fileContent}

`;
            }
        }
    }

    return content;
}

function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Combining Database Structure Files         ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    if (!fs.existsSync(STRUCTURE_DIR)) {
        console.error(`❌ Directory not found: ${STRUCTURE_DIR}`);
        process.exit(1);
    }

    // Backup existing schema.sql
    if (fs.existsSync(OUTPUT_FILE)) {
        fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
        console.log(`✅ Backed up existing schema.sql`);
    }

    const schemaContent = combineFiles();

    fs.writeFileSync(OUTPUT_FILE, schemaContent);
    console.log(`✅ Schema combined and saved to: ${OUTPUT_FILE}`);

    // Count files
    let totalFiles = 0;
    for (const dir of DIRECTORIES) {
        const files = getSQLFiles(path.join(STRUCTURE_DIR, dir));
        totalFiles += files.length;
    }
    console.log(`📊 Total SQL files combined: ${totalFiles}`);
}

main();