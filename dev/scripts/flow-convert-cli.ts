#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { parseFlowContent, generateTypeScriptReference, generateFlowDocumentation } from './utils/flowConverter.ts';
import { generateDiagramDocument } from './utils/flowDiagramGenerator.ts';
import { generateTestTemplate } from './utils/flowTestGenerator.ts';

// Parse command line arguments
interface CliOptions {
    inputPaths: string[];
    outputDir: string;
    generateDiagrams: boolean;
    generateTests: boolean;
    watch: boolean;
}

function parseArgs(): CliOptions {
    const args = process.argv.slice(2);
    const options: CliOptions = {
        inputPaths: [],
        outputDir: 'flows/generated',
        generateDiagrams: false,
        generateTests: false,
        watch: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--diagram' || arg === '-d') {
            options.generateDiagrams = true;
        } else if (arg === '--test' || arg === '-t') {
            options.generateTests = true;
        } else if (arg === '--watch' || arg === '-w') {
            options.watch = true;
        } else if (arg === '--out' || arg === '-o') {
            options.outputDir = args[++i];
        } else if (arg === '--help' || arg === '-h') {
            showHelp();
            process.exit(0);
        } else if (!arg.startsWith('-')) {
            options.inputPaths.push(arg);
        }
    }

    return options;
}

function showHelp() {
    console.log(`
Flow Converter - Converte arquivos .flow em TypeScript

Uso:
  npm run flow-convert <arquivo.flow> [opções]

Opções:
  -d, --diagram     Gera diagramas Mermaid
  -t, --test        Gera templates de testes
  -o, --out <dir>   Diretório de saída (padrão: flows/generated)
  -w, --watch       Modo watch (reconverte ao detectar mudanças)
  -h, --help        Mostra esta ajuda

Exemplos:
  npm run flow-convert flows/notifications/my-flow.flow
  npm run flow-convert flows/**/*.flow --diagram --test
  npm run flow-convert flows/auth/*.flow --out=src/generated
  `);
}

function expandGlobPattern(pattern: string): string[] {
    const files: string[] = [];

    // Simple glob expansion for *.flow and **/*.flow
    if (pattern.includes('*')) {
        const baseDir = pattern.split('*')[0];
        const recursive = pattern.includes('**');

        function scanDir(dir: string) {
            try {
                const entries = readdirSync(dir);
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry);
                    const stat = statSync(fullPath);

                    if (stat.isDirectory() && recursive) {
                        scanDir(fullPath);
                    } else if (stat.isFile() && entry.endsWith('.flow')) {
                        files.push(fullPath);
                    }
                }
            } catch (e) {
                // Ignore errors
            }
        }

        scanDir(baseDir || '.');
    } else {
        files.push(pattern);
    }

    return files;
}

function convertFlow(inputPath: string, options: CliOptions): void {
    try {
        console.log(`\n📄 Convertendo: ${inputPath}`);

        const content = readFileSync(inputPath, 'utf-8');
        const flow = parseFlowContent(content);
        const ts = generateTypeScriptReference(flow);
        const md = generateFlowDocumentation(flow);

        const baseName = path.basename(inputPath, '.flow');
        const outDir = path.resolve(options.outputDir);
        mkdirSync(outDir, { recursive: true });

        // Generate TypeScript and Markdown
        writeFileSync(path.join(outDir, `${baseName}.ts`), ts);
        writeFileSync(path.join(outDir, `${baseName}.md`), md);
        console.log(`  ✅ Gerado: ${baseName}.ts`);
        console.log(`  ✅ Gerado: ${baseName}.md`);

        // Generate diagrams if requested
        if (options.generateDiagrams) {
            const diagrams = generateDiagramDocument(flow);
            writeFileSync(path.join(outDir, `${baseName}.diagrams.md`), diagrams);
            console.log(`  ✅ Gerado: ${baseName}.diagrams.md`);
        }

        // Generate tests if requested
        if (options.generateTests) {
            const tests = generateTestTemplate(flow);
            writeFileSync(path.join(outDir, `${baseName}.test.ts`), tests);
            console.log(`  ✅ Gerado: ${baseName}.test.ts`);
        }

    } catch (error) {
        console.error(`  ❌ Erro ao converter ${inputPath}:`, error instanceof Error ? error.message : error);
    }
}

// Main execution
const options = parseArgs();

if (options.inputPaths.length === 0) {
    console.error('❌ Erro: Nenhum arquivo .flow especificado');
    console.log('Use --help para ver as opções disponíveis');
    process.exit(1);
}

// Expand glob patterns
const allFiles: string[] = [];
for (const pattern of options.inputPaths) {
    allFiles.push(...expandGlobPattern(pattern));
}

if (allFiles.length === 0) {
    console.error('❌ Erro: Nenhum arquivo .flow encontrado');
    process.exit(1);
}

console.log(`\n🚀 Flow Converter`);
console.log(`📁 Diretório de saída: ${options.outputDir}`);
console.log(`📊 Gerar diagramas: ${options.generateDiagrams ? 'Sim' : 'Não'}`);
console.log(`🧪 Gerar testes: ${options.generateTests ? 'Sim' : 'Não'}`);
console.log(`📝 Arquivos encontrados: ${allFiles.length}`);

// Convert all files
for (const file of allFiles) {
    convertFlow(file, options);
}

console.log(`\n✨ Conversão concluída! ${allFiles.length} arquivo(s) processado(s)\n`);

// Watch mode
if (options.watch) {
    console.log('👀 Modo watch ativado. Aguardando mudanças...');
    console.log('   (Pressione Ctrl+C para sair)\n');

    // TODO: Implement file watching
    console.log('⚠️  Modo watch ainda não implementado');
}

