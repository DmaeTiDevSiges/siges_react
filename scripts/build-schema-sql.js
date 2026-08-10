import fs from 'fs';
import path from 'path';

const BASE_DIR = path.resolve('supabase');
const OUTPUT_FILE = path.join(BASE_DIR, 'schema.sql');
const BACKUP_FILE = path.join(BASE_DIR, 'schema.sql.bak');

const SECTION_DIRS = [
  'database-structure/00-seed-data',
  'database-structure/01-core-schema',
  'database-structure/02-business-schema',
  'database-structure/03-views',
  'database-structure/04-functions',
  'database-structure/05-triggers',
  'database-structure/06-policies',
  'database-structure/07-indexes',
  'database-structure/08-constraints'
];

function readSqlFiles(dir) {
  const dirPath = path.join(BASE_DIR, dir);
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort()
    .map((file) => ({
      path: path.join(dirPath, file),
      name: file,
      content: fs.readFileSync(path.join(dirPath, file), 'utf8')
    }));
}

function buildHeader() {
  const now = new Date().toISOString();
  return `-- =============================================================================\n` +
    `-- Generated schema.sql\n` +
    `-- Source: supabase/database-structure (exported at ${now})\n` +
    `-- WARNING: This file is auto-generated. Do not edit manually unless you know what you are doing.\n` +
    `-- To regenerate: run 'node scripts/build-schema-sql.js' or 'npm run db:export'\n` +
    `-- =============================================================================\n\n`;
}

function main() {
  if (fs.existsSync(OUTPUT_FILE)) {
    fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
    console.log(`Backed up existing schema.sql to schema.sql.bak`);
  }

  const header = buildHeader();
  let out = header;

  for (const dir of SECTION_DIRS) {
    const files = readSqlFiles(dir);
    if (files.length === 0) continue;

    out += `-- =============================================================================\n`;
    out += `-- Section: ${dir}\n`;
    out += `-- =============================================================================\n\n`;

    for (const file of files) {
      out += `-- Start File: ${file.name}\n`;
      out += file.content.trim();
      out += `\n\n`;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, out, 'utf8');
  console.log(`Updated ${OUTPUT_FILE} with ${SECTION_DIRS.length} sections.`);
}

main();
