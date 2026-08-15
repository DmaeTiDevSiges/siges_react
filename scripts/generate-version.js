import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const versionFile = path.join(publicDir, 'app_version.txt');

function readCurrentVersion() {
  try {
    if (fs.existsSync(versionFile)) {
      return JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return null;
}

function promptUser(defaultMask) {
  return new Promise((resolve) => {
    // 1. Argumento de linha de comando
    const argVersion = process.argv[2];
    if (argVersion) {
      resolve(argVersion);
      return;
    }

    // 2. Variável de ambiente
    const envVersion = process.env.APP_VERSION;
    if (envVersion) {
      resolve(envVersion);
      return;
    }

    // 3. Prompt interativo (só em terminal)
    const isCI = process.env.CI === 'true' || process.env.CI === '1';
    const isNonInteractive = !process.stdin.isTTY;
    if (isCI || isNonInteractive) {
      resolve(defaultMask || '0.0.1');
      return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`\n  Versão do app (Enter para manter "${defaultMask}"): `, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      resolve(trimmed || defaultMask || '0.0.1');
    });
  });
}

async function main() {
  const current = readCurrentVersion();
  const defaultMask = current?.version_app_mask || '0.0.1';

  const versionAppMask = await promptUser(defaultMask);

  const versionInfo = {
    version_app_mask: versionAppMask,
    timestamp: new Date().toISOString()
  };

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));

  console.log(`✅ app_version.txt generated: version_app_mask=${versionAppMask}`);
}

main();
