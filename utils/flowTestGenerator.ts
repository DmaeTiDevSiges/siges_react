/**
 * Flow Test Generator Utility
 * Gera templates de testes Jest a partir de arquivos .flow
 */

import { Flow, FlowStep } from './flowConverter';

export interface TestGeneratorOptions {
    includeStepTests?: boolean;
    includeValidationTests?: boolean;
    includeErrorTests?: boolean;
    testFramework?: 'jest' | 'vitest';
}

/**
 * Gera template de teste Jest/Vitest para um flow
 */
export function generateTestTemplate(
    flow: Flow,
    options: TestGeneratorOptions = {}
): string {
    const {
        includeStepTests = true,
        includeValidationTests = true,
        includeErrorTests = true,
        testFramework = 'jest'
    } = options;

    const functionName = toCamelCase(flow.metadata.nome);
    const flowName = toPascalCase(flow.metadata.nome);

    let code = `/**\n`;
    code += ` * Testes para: ${flow.metadata.nome}\n`;
    code += ` * Gerado automaticamente a partir de: ${flow.metadata.nome}.flow\n`;
    code += ` * \n`;
    code += ` * ATENÇÃO: Este é um template de teste.\n`;
    code += ` * Implemente os testes conforme necessário.\n`;
    code += ` */\n\n`;

    code += `import { ${functionName} } from './${flow.metadata.nome}';\n`;
    code += `import { ${flowName}Input, ${flowName}Result } from './${flow.metadata.nome}';\n\n`;

    code += `describe('${flow.metadata.nome}', () => {\n`;

    // Setup e teardown
    code += `  beforeEach(() => {\n`;
    code += `    // TODO: Setup inicial (mock de database, etc.)\n`;
    code += `  });\n\n`;

    code += `  afterEach(() => {\n`;
    code += `    // TODO: Cleanup\n`;
    code += `  });\n\n`;

    // Teste de sucesso geral
    code += `  describe('Fluxo completo', () => {\n`;
    code += `    it('deve executar o fluxo completo com sucesso', async () => {\n`;
    code += `      // Arrange\n`;
    code += `      const input: ${flowName}Input = {\n`;
    code += `        userId: 'test-user-id',\n`;
    code += `        // TODO: Adicionar outros campos necessários\n`;
    code += `      };\n\n`;
    code += `      // Act\n`;
    code += `      const result = await ${functionName}(input);\n\n`;
    code += `      // Assert\n`;
    code += `      expect(result.success).toBe(true);\n`;
    code += `      expect(result.message).toBeDefined();\n`;
    code += `    });\n`;
    code += `  });\n\n`;

    // Testes para cada passo
    if (includeStepTests && flow.passos && flow.passos.length > 0) {
        code += `  describe('Passos individuais', () => {\n`;
        flow.passos.forEach((passo, index) => {
            const testName = sanitizeTestName(passo.titulo);
            code += `    it('Passo ${index + 1}: ${testName}', async () => {\n`;
            code += `      // TODO: Testar - ${passo.titulo}\n`;
            if (passo.quando) {
                code += `      // Quando: ${passo.quando}\n`;
            }
            if (passo.resultadoEsperado) {
                code += `      // Resultado esperado: ${passo.resultadoEsperado}\n`;
            }
            code += `      expect(true).toBe(true); // Placeholder\n`;
            code += `    });\n\n`;
        });
        code += `  });\n\n`;
    }

    // Testes de validação
    if (includeValidationTests && flow.validacoes && flow.validacoes.length > 0) {
        code += `  describe('Validações', () => {\n`;
        flow.validacoes.forEach((validacao, index) => {
            const testName = sanitizeTestName(validacao.substring(0, 50));
            code += `    it('deve validar: ${testName}', async () => {\n`;
            code += `      // TODO: Implementar validação - ${validacao}\n`;
            code += `      expect(true).toBe(true); // Placeholder\n`;
            code += `    });\n\n`;
        });
        code += `  });\n\n`;
    }

    // Testes de casos de erro
    if (includeErrorTests && flow.casosDeErro && flow.casosDeErro.length > 0) {
        code += `  describe('Casos de erro', () => {\n`;
        flow.casosDeErro.forEach((erro, index) => {
            const testName = sanitizeTestName(erro.substring(0, 50));
            code += `    it('deve tratar erro: ${testName}', async () => {\n`;
            code += `      // TODO: Implementar teste de erro - ${erro}\n`;
            code += `      // Arrange: Configurar cenário de erro\n`;
            code += `      // Act: Executar ação que causa erro\n`;
            code += `      // Assert: Verificar tratamento adequado\n`;
            code += `      expect(true).toBe(true); // Placeholder\n`;
            code += `    });\n\n`;
        });
        code += `  });\n\n`;
    }

    code += `});\n`;

    return code;
}

/**
 * Gera testes de integração
 */
export function generateIntegrationTests(flow: Flow): string {
    const functionName = toCamelCase(flow.metadata.nome);
    const flowName = toPascalCase(flow.metadata.nome);

    let code = `/**\n`;
    code += ` * Testes de Integração para: ${flow.metadata.nome}\n`;
    code += ` */\n\n`;

    code += `import { ${functionName} } from './${flow.metadata.nome}';\n\n`;

    code += `describe('${flow.metadata.nome} - Integração', () => {\n`;
    code += `  it('deve integrar com o banco de dados', async () => {\n`;
    code += `    // TODO: Testar integração com database real\n`;
    code += `    expect(true).toBe(true);\n`;
    code += `  });\n\n`;

    code += `  it('deve integrar com serviços externos', async () => {\n`;
    code += `    // TODO: Testar integração com APIs/serviços\n`;
    code += `    expect(true).toBe(true);\n`;
    code += `  });\n`;
    code += `});\n`;

    return code;
}

/**
 * Sanitiza nome para usar em testes
 */
function sanitizeTestName(text: string): string {
    if (!text) return '';
    return text
        .replace(/\n/g, ' ')
        .replace(/"/g, "'")
        .trim();
}

/**
 * Converte string para PascalCase
 */
function toPascalCase(str: string): string {
    if (!str) return '';
    return str
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Converte string para camelCase
 */
function toCamelCase(str: string): string {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
