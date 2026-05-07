import fs from 'fs';

const json = JSON.parse(fs.readFileSync('vps_schema_info.json', 'utf8'));
const paths = Object.keys(json.paths || {});
const tables = paths
  .filter((p) => p.startsWith('/'))
  .map((p) => p.slice(1))
  .sort();

console.log(`Found ${tables.length} tables/views:`);
tables.forEach((t, i) => console.log(`${i + 1}. ${t}`));
