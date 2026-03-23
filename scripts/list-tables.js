import fs from 'fs';

const schema = JSON.parse(fs.readFileSync('vps_schema_info.json', 'utf8'));
const tables = Object.keys(schema.definitions || {}).sort();

console.log(`Tabelas encontradas: ${tables.length}`);
tables.forEach((t, i) => console.log(`${i + 1}. ${t}`));