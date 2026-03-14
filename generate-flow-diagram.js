import { readFileSync, writeFileSync } from 'fs';
import { parseFlowContent } from './utils/flowConverter.js';
import { generateDiagramDocument } from './utils/flowDiagramGenerator.js';

const inputPath = process.argv[2] || 'flows/servicesRequests/create-service-request.flow';
const outputPath = process.argv[3] || 'flows/generated/create-service-request.diagrams.md';

try {
    console.log(`\n📄 Lendo flow: ${inputPath}`);
    const content = readFileSync(inputPath, 'utf-8');

    console.log('🔄 Parseando conteúdo...');
    const flow = parseFlowContent(content);

    console.log('📊 Gerando diagramas...');
    const diagrams = generateDiagramDocument(flow);

    console.log(`💾 Salvando em: ${outputPath}`);
    writeFileSync(outputPath, diagrams);

    console.log('✅ Diagrama gerado com sucesso!\n');
} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
