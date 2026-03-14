#!/usr/bin/env node
/**
 * Flow Converter CLI - Simplified JavaScript version
 * Converts .flow files to TypeScript code, diagrams, and tests
 */

const fs = require('fs');
const path = require('path');

// Simple argument parser
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        inputPaths: [],
        outputDir: 'flows/generated',
        generateDiagrams: false,
        generateTests: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--diagram' || arg === '-d') {
            options.generateDiagrams = true;
        } else if (arg === '--test' || arg === '-t') {
            options.generateTests = true;
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
  node flow-convert.js <arquivo.flow> [opções]

Opções:
  -d, --diagram     Gera diagramas Mermaid
  -t, --test        Gera templates de testes
  -o, --out <dir>   Diretório de saída (padrão: flows/generated)
  -h, --help        Mostra esta ajuda

Exemplos:
  node flow-convert.js flows/notifications/my-flow.flow
  node flow-convert.js flows/servicesRequests/create-service-request.flow --diagram --test
  `);
}

// Load converter modules
const { parseFlowContent, generateTypeScriptReference, generateFlowDocumentation } = require('./utils/flowConverter.ts');

function convertFlow(inputPath, options) {
    try {
        console.log(`\n📄 Convertendo: ${inputPath}`);

        const content = fs.readFileSync(inputPath, 'utf-8');
        const flow = parseFlowContent(content);
        const ts = generateTypeScriptReference(flow);
        const md = generateFlowDocumentation(flow);

        const baseName = path.basename(inputPath, '.flow');
        const outDir = path.resolve(options.outputDir);

        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        // Generate TypeScript and Markdown
        fs.writeFileSync(path.join(outDir, `${baseName}.ts`), ts);
        fs.writeFileSync(path.join(outDir, `${baseName}.md`), md);
        console.log(`  ✅ Gerado: ${baseName}.ts`);
        console.log(`  ✅ Gerado: ${baseName}.md`);

        // Generate diagrams if requested
        if (options.generateDiagrams) {
            const { generateDiagramDocument } = require('./utils/flowDiagramGenerator.ts');
            const diagrams = generateDiagramDocument(flow);
            fs.writeFileSync(path.join(outDir, `${baseName}.diagrams.md`), diagrams);
            console.log(`  ✅ Gerado: ${baseName}.diagrams.md`);
        }

        // Generate tests if requested
        if (options.generateTests) {
            const { generateTestTemplate } = require('./utils/flowTestGenerator.ts');
            const tests = generateTestTemplate(flow);
            fs.writeFileSync(path.join(outDir, `${baseName}.test.ts`), tests);
            console.log(`  ✅ Gerado: ${baseName}.test.ts`);
        }

    } catch (error) {
        console.error(`  ❌ Erro ao converter ${inputPath}:`, error.message);
        console.error(error.stack);
    }
}

// Main execution
const options = parseArgs();

if (options.inputPaths.length === 0) {
    console.error('❌ Erro: Nenhum arquivo .flow especificado');
    console.log('Use --help para ver as opções disponíveis');
    process.exit(1);
}

console.log(`\n🚀 Flow Converter`);
console.log(`📁 Diretório de saída: ${options.outputDir}`);
console.log(`📊 Gerar diagramas: ${options.generateDiagrams ? 'Sim' : 'Não'}`);
console.log(`🧪 Gerar testes: ${options.generateTests ? 'Sim' : 'Não'}`);

// Convert all files
for (const file of options.inputPaths) {
    convertFlow(file, options);
}

console.log(`\n✨ Conversão concluída!\n`);
