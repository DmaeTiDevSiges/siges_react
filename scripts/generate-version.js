import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionInfo = {
  version: new Date().getTime().toString(),
  timestamp: new Date().toISOString()
};

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(
  path.join(publicDir, 'version.txt'),
  JSON.stringify(versionInfo, null, 2)
);

console.log('✅ version.txt generated:', versionInfo.version);
