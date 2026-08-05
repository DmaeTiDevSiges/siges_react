import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_FILE = path.join(__dirname, '..', 'vps_schema_info.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'supabase', 'schema.sql');
const BACKUP_FILE = path.join(__dirname, '..', 'supabase', 'schema.sql.backup');

function parseOpenAPISchema() {
    if (!fs.existsSync(SCHEMA_FILE)) {
        throw new Error('Schema file not found. Run fetch-schema first.');
    }

    const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
    const definitions = schema.definitions || {};

    let ddl = `-- =============================================================================
-- Schema generated from OpenAPI spec
-- Timestamp: ${new Date().toISOString()}
-- =============================================================================

`;

    for (const [tableName, tableDef] of Object.entries(definitions)) {
        if (tableDef.type === 'object' && tableDef.properties) {
            ddl += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;

            const columns = [];
            for (const [colName, colDef] of Object.entries(tableDef.properties)) {
                let colDDL = `    "${colName}"`;

                if (colDef.type === 'string') {
                    if (colDef.format === 'date-time') {
                        colDDL += ' TIMESTAMP WITH TIME ZONE';
                    } else if (colDef.maxLength) {
                        colDDL += ` VARCHAR(${colDef.maxLength})`;
                    } else {
                        colDDL += ' TEXT';
                    }
                } else if (colDef.type === 'integer') {
                    colDDL += ' BIGINT';
                } else if (colDef.type === 'number') {
                    colDDL += ' DECIMAL';
                } else if (colDef.type === 'boolean') {
                    colDDL += ' BOOLEAN';
                } else {
                    colDDL += ' TEXT'; // fallback
                }

                if (colDef.description && colDef.description.includes('not null')) {
                    colDDL += ' NOT NULL';
                }

                columns.push(colDDL);
            }

            ddl += columns.join(',\n');
            ddl += '\n);\n\n';
        }
    }

    return ddl;
}

function main() {
    console.log('Generating schema from OpenAPI spec...');

    if (fs.existsSync(OUTPUT_FILE)) {
        fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
        console.log('Backed up existing schema.sql');
    }

    const ddl = parseOpenAPISchema();
    fs.writeFileSync(OUTPUT_FILE, ddl);

    console.log(`Schema generated and saved to ${OUTPUT_FILE}`);
}

main();