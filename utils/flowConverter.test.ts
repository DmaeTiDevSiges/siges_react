import { convertFlowFile } from './flowConverter';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import * as path from 'path';

describe('flow conversion CLI', () => {
    const tempDir = path.resolve('tmp_test_flow');
    const flowFile = path.join(tempDir, 'sample.flow');
    const outDir = path.join(tempDir, 'generated');

    beforeAll(() => {
        mkdirSync(tempDir, { recursive: true });
        const sampleContent = `---
nome: Sample Flow
categoria: Test
versão: 1.0
descrição: Test flow
---\n\n## Contexto\nEste é um contexto de teste.\n\n## Passos\n- passo 1`;
        writeFileSync(flowFile, sampleContent);
    });

    afterAll(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    test('generates .ts and .md files', () => {
        convertFlowFile(flowFile, outDir);
        const tsPath = path.join(outDir, 'sample.ts');
        const mdPath = path.join(outDir, 'sample.md');
        expect(existsSync(tsPath)).toBeTruthy();
        expect(existsSync(mdPath)).toBeTruthy();
        const tsContent = readFileSync(tsPath, 'utf-8');
        const mdContent = readFileSync(mdPath, 'utf-8');
        expect(tsContent).toContain('Sample Flow');
        expect(mdContent).toContain('# Sample Flow');
    });
});
