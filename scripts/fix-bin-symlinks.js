import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(rootDir, 'node_modules');

function scanAndFixBinDir(binDir) {
  if (!fs.existsSync(binDir)) return 0;
  let fixed = 0;
  const entries = fs.readdirSync(binDir);
  for (const entry of entries) {
    const fullPath = path.join(binDir, entry);
    try {
      const lstat = fs.lstatSync(fullPath);
      if (lstat.isSymbolicLink()) continue;

      const fd = fs.openSync(fullPath, 'r');
      const buffer = Buffer.alloc(8);
      const bytesRead = fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      if (bytesRead >= 7 && buffer.toString('utf8', 0, 7) === 'IntxLNK') {
        const fullContent = fs.readFileSync(fullPath);
        const target = fullContent.slice(8).toString('utf16le').replace(/\0/g, '').replace(/\\/g, '/');
        fs.unlinkSync(fullPath);
        fs.symlinkSync(target, fullPath);
        fixed++;
      }
    } catch {
      // ignore individual file errors
    }
  }
  return fixed;
}

function findAndFixAllBins(dir, depth = 0) {
  if (depth > 4 || !fs.existsSync(dir)) return 0;
  let totalFixed = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const fullPath = path.join(dir, ent.name);
        if (ent.name === '.bin') {
          totalFixed += scanAndFixBinDir(fullPath);
        } else if (!ent.name.startsWith('.') && ent.name !== 'dist' && ent.name !== 'build') {
          totalFixed += findAndFixAllBins(fullPath, depth + 1);
        }
      }
    }
  } catch {
    // ignore
  }
  return totalFixed;
}

const count = findAndFixAllBins(nodeModulesDir);
if (count > 0) {
  console.log(`[fix-bin-symlinks] Convertidos ${count} links NTFS (IntxLNK) para symlinks Linux válidos.`);
}
