import fs from 'fs';

const json = JSON.parse(fs.readFileSync('vps_schema_info.json', 'utf8'));
const paths = Object.keys(json.paths || {});

// Heuristic: views in this schema are usually prefixed with "v_" or "v" (e.g., v_orders)
const views = paths
  .filter((p) => {
    const name = p.replace(/^\//, '');
    return /^v[_\-]/i.test(name) || /^v[A-Za-z]/.test(name);
  })
  .map((p) => p.slice(1))
  .sort();

console.log(`Found ${views.length} views:`);
views.forEach((t, i) => console.log(`${i + 1}. ${t}`));
