import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load OpenAPI schema
const schemaPath = path.join(__dirname, '..', 'vps_schema_info.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const openApiTables = new Set(Object.keys(schema.definitions || {}));

// Get all SQL files from database-structure
const structureDir = path.join(__dirname, '..', 'supabase', 'database-structure');

function getAllSQLFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...getAllSQLFiles(fullPath));
        } else if (item.endsWith('.sql')) {
            files.push(fullPath);
        }
    }

    return files;
}

function extractTableName(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Look for CREATE TABLE statements
    const createMatch = content.match(/CREATE TABLE(?: IF NOT EXISTS)? public\.(\w+)/i);
    if (createMatch) {
        return createMatch[1];
    }

    // Look for file name patterns
    const fileName = path.basename(filePath);
    const nameMatch = fileName.match(/^\d+-create-(.+)\.sql$/);
    if (nameMatch) {
        return nameMatch[1];
    }

    return null;
}

const sqlFiles = getAllSQLFiles(structureDir);
const structureTables = new Set();

for (const file of sqlFiles) {
    const tableName = extractTableName(file);
    if (tableName) {
        structureTables.add(tableName);
    }
}

const missingInOpenApi = [...structureTables].filter(t => !openApiTables.has(t));
const extraInOpenApi = [...openApiTables].filter(t => !structureTables.has(t));

console.log(`Tables in database-structure: ${structureTables.size}`);
console.log(`Tables in OpenAPI: ${openApiTables.size}`);
console.log(`\nMissing in OpenAPI (${missingInOpenApi.length}):`);
missingInOpenApi.sort().forEach(t => console.log(`- ${t}`));

console.log(`\nExtra in OpenAPI (${extraInOpenApi.length}):`);
extraInOpenApi.slice(0, 20).sort().forEach(t => console.log(`- ${t}`));
if (extraInOpenApi.length > 20) {
    console.log(`... and ${extraInOpenApi.length - 20} more`);
}