#!/usr/bin/env node

/**
 * Database Schema Validation Script
 * 
 * Validates the database structure files for common issues
 * before restoration.
 * 
 * Usage:
 *   node scripts/validate-schema.js
 *   npm run db:validate
 */

// Load environment variables from .env.local
import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '..', 'supabase', 'database-structure');

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

let issues = [];
let warnings = [];

function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Database Schema Validation                  ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
    
    // Check if directory exists
    if (!fs.existsSync(INPUT_DIR)) {
        console.error('❌ Database structure directory not found!');
        console.error('Run `npm run db:export` first.\n');
        process.exit(1);
    }
    
    console.log('📁 Validating directory structure...\n');
    
    // Validate each directory
    for (const directory of EXECUTION_ORDER) {
        validateDirectory(directory);
    }
    
    // Check for common issues
    checkCommonIssues();
    
    // Report results
    reportResults();
}

function validateDirectory(directory) {
    const dirPath = path.join(INPUT_DIR, directory);
    
    if (!fs.existsSync(dirPath)) {
        console.log(`⏭️  Skipping ${directory} (not found)`);
        return;
    }
    
    console.log(`📂 Checking ${directory}...`);
    
    const files = fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.sql'));
    
    if (files.length === 0) {
        console.log(`   ℹ️  No SQL files`);
        return;
    }
    
    console.log(`   Found ${files.length} file(s)`);
    
    // Validate each file
    for (const file of files) {
        validateFile(path.join(dirPath, file));
    }
    
    console.log('');
}

function validateFile(filePath) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check 1: File should have header comment
    if (!content.includes('================================')) {
        warnings.push(`${fileName}: Missing header comment`);
    }
    
    // Check 2: File should have DROP IF EXISTS or CREATE IF NOT EXISTS
    if (!content.includes('DROP') && !content.includes('IF NOT EXISTS') && !content.includes('OR REPLACE')) {
        warnings.push(`${fileName}: Consider using DROP IF EXISTS or CREATE IF NOT EXISTS for idempotency`);
    }
    
    // Check 3: Check for semicolon at end
    const trimmedContent = content.trim();
    if (!trimmedContent.endsWith(';')) {
        issues.push(`${fileName}: File does not end with semicolon`);
    }
    
    // Check 4: Look for common SQL syntax errors
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        // Check for unclosed quotes
        const singleQuotes = (line.match(/'/g) || []).length;
        if (singleQuotes % 2 !== 0 && !line.trim().startsWith('--')) {
            warnings.push(`${fileName}:${index + 1}: Possible unclosed single quote`);
        }
        
        // Check for common typos
        if (/\bCREATE TABL\b/i.test(line)) {
            issues.push(`${fileName}:${index + 1}: Typo detected - "TABL" should be "TABLE"`);
        }
        if (/\bFOREIGN KE\b/i.test(line)) {
            issues.push(`${fileName}:${index + 1}: Typo detected - "KE" should be "KEY"`);
        }
    });
    
    // Check 5: File naming convention
    if (!/^\d{3}-/.test(fileName)) {
        warnings.push(`${fileName}: File name should start with 3-digit number (e.g., 001-)`);
    }
    
    // Check 6: Large files
    if (content.length > 50000) {
        warnings.push(`${fileName}: Large file (${(content.length / 1024).toFixed(1)}KB) - consider splitting`);
    }
}

function checkCommonIssues() {
    console.log('🔍 Checking for common issues...\n');
    
    // Check 1: Verify execution order makes sense
    const seedDir = path.join(INPUT_DIR, '00-seed-data');
    const schemaDir = path.join(INPUT_DIR, '01-core-schema');
    
    if (fs.existsSync(seedDir) && fs.existsSync(schemaDir)) {
        const seedFiles = fs.readdirSync(seedDir).filter(f => f.endsWith('.sql'));
        const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.sql'));
        
        if (seedFiles.length === 0 && schemaFiles.length > 0) {
            warnings.push('Seed data directory is empty but schema files exist');
        }
    }
    
    // Check 2: Check for duplicate table creations
    const tableCreations = new Map();
    EXECUTION_ORDER.forEach(dir => {
        const dirPath = path.join(INPUT_DIR, dir);
        if (!fs.existsSync(dirPath)) return;
        
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.sql'));
        files.forEach(file => {
            const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
            
            // Match CREATE TABLE statements
            const matches = content.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?public\.(\w+)/gi);
            for (const match of matches) {
                const tableName = match[1].toLowerCase();
                if (tableCreations.has(tableName)) {
                    issues.push(`Duplicate table creation: ${tableName} (in ${tableCreations.get(tableName)} and ${file})`);
                } else {
                    tableCreations.set(tableName, file);
                }
            }
        });
    });
    
    // Check 3: Check metadata file
    const metadataPath = path.join(INPUT_DIR, '.export-metadata.json');
    if (!fs.existsSync(metadataPath)) {
        warnings.push('Missing .export-metadata.json - run export to generate');
    } else {
        try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            const exportedAt = new Date(metadata.exportedAt);
            const daysOld = (Date.now() - exportedAt.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysOld > 7) {
                warnings.push(`Database export is ${daysOld.toFixed(0)} days old - consider re-exporting`);
            }
        } catch (e) {
            issues.push('Invalid .export-metadata.json file');
        }
    }
}

function reportResults() {
    console.log('═'.repeat(50));
    console.log('VALIDATION RESULTS');
    console.log('═'.repeat(50));
    console.log('');
    
    if (issues.length === 0 && warnings.length === 0) {
        console.log('✅ No issues found! Schema looks good.\n');
        process.exit(0);
    }
    
    if (warnings.length > 0) {
        console.log(`⚠️  ${warnings.length} warning(s):\n`);
        warnings.forEach((w, i) => {
            console.log(`   ${i + 1}. ${w}`);
        });
        console.log('');
    }
    
    if (issues.length > 0) {
        console.log(`❌ ${issues.length} issue(s) found:\n`);
        issues.forEach((w, i) => {
            console.log(`   ${i + 1}. ${w}`);
        });
        console.log('');
        console.log('Please fix these issues before restoring.\n');
        process.exit(1);
    } else {
        console.log('✅ Validation passed with warnings only.\n');
        console.log('You can proceed with restore, but review warnings above.\n');
    }
}

// Run if called directly
const currentModulePath = fileURLToPath(import.meta.url);

if (process.argv[1] && currentModulePath.includes(process.argv[1].replace(/\\/g, '/'))) {
    main();
}

export { main as validateSchema };
