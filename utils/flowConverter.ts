/**
 * Flow Converter Utility
 * Converte arquivos .flow (linguagem natural) em código TypeScript de referência
 */

export interface FlowMetadata {
    nome: string;
    categoria: string;
    versão: string;
    descrição: string;
    autor?: string;
    data?: string;
}

export interface FlowStep {
    numero: number;
    titulo: string;
    quando?: string;
    acao?: string;
    resultadoEsperado?: string;
}

export interface Flow {
    metadata: FlowMetadata;
    contexto?: string;
    passos: FlowStep[];
    validacoes?: string[];
    casosDeErro?: string[];
    dadosNecessarios?: string[];
    observacoes?: string[];
}

/**
 * Parseia o conteúdo de um arquivo .flow
 */
export function parseFlowContent(content: string): Flow {
    const lines = content.split(/\r?\n/);
    const flow: Flow = {
        metadata: {
            nome: '',
            categoria: '',
            versão: '',
            descrição: ''
        },
        passos: []
    };

    let inMetadata = false;
    let metadataParsed = false;
    let currentSection = '';
    let metadataContent = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detecta início dos metadados (somente se ainda não foi parseado e estiver no início)
        if (trimmed === '---' && !metadataParsed) {
            if (!inMetadata) {
                // Só começa se for uma das primeiras linhas
                if (i < 5) {
                    inMetadata = true;
                    metadataContent = '';
                }
            } else {
                // Fim dos metadados
                inMetadata = false;
                metadataParsed = true;
                flow.metadata = parseMetadata(metadataContent);
            }
            continue;
        }

        // Coleta metadados
        if (inMetadata) {
            metadataContent += line + '\n';
            continue;
        }

        // Pula linhas de separação (horizontal rules)
        if (trimmed === '---') {
            continue;
        }

        // Detecta seções
        if (line.startsWith('## ')) {
            const section = line.replace('## ', '').trim();
            // Normaliza nomes de seções
            if (section.toLowerCase().includes('context') || section.toLowerCase().includes('contexto')) {
                currentSection = 'Contexto';
            } else if (section.toLowerCase().includes('passos') || section.toLowerCase().includes('etapas') || section.toLowerCase().includes('steps')) {
                currentSection = 'Passos';
            } else if (section.toLowerCase().includes('regras') || section.toLowerCase().includes('business rules')) {
                currentSection = 'Validacoes';
            } else if (section.toLowerCase().includes('resultado final') || section.toLowerCase().includes('final result')) {
                currentSection = 'Observacoes';
            } else if (section.toLowerCase().includes('erro') || section.toLowerCase().includes('error')) {
                currentSection = 'CasosDeErro';
            } else {
                currentSection = section;
            }
            continue;
        }

        // Processa conteúdo baseado na seção
        if (currentSection === 'Contexto' && line.trim()) {
            flow.contexto = (flow.contexto || '') + line.trim() + ' ';
        }

        if (currentSection === 'Passos') {
            if (line.trim().startsWith('### ')) {
                // Tenta capturar número e título
                const titleMatch = line.match(/^###\s*(\d+)\.\s*(.*)/) || line.match(/^###\s*\[(.*?)\]/) || [null, null, line.replace('### ', '').trim()];
                const title = titleMatch[2] || titleMatch[1];
                flow.passos.push({
                    numero: flow.passos.length + 1,
                    titulo: title,
                });
            } else if (flow.passos.length > 0) {
                const currentStep = flow.passos[flow.passos.length - 1];
                const trimmed = line.trim();

                const lowerLine = trimmed.toLowerCase();

                // Regexes more robust for When/Action/Expected Result
                const whenMatch = trimmed.match(/^\*\*?(?:quando|when):?\*\*?\s*(.*)/i);
                const actionMatch = trimmed.match(/^\*\*?(?:ação|acao|action):?\*\*?\s*(.*)/i);
                const resultMatch = trimmed.match(/^\*\*?(?:resultado esperado|expected result):?\*\*?\s*(.*)/i);

                if (whenMatch) {
                    currentStep.quando = whenMatch[1].trim();
                } else if (actionMatch) {
                    currentStep.acao = (currentStep.acao || '') + (actionMatch[1].trim());
                } else if (resultMatch) {
                    currentStep.resultadoEsperado = (currentStep.resultadoEsperado || '') + (resultMatch[1].trim());
                } else if (trimmed.startsWith('- ')) {
                    const content = trimmed.substring(2);
                    if (currentStep.resultadoEsperado !== undefined && !currentStep.acao) {
                        // This is tricky, if both exist we might need state. 
                        // But usually a step has Action then Result.
                    }

                    if (currentStep.resultadoEsperado) {
                        currentStep.resultadoEsperado += '\n- ' + content;
                    } else {
                        currentStep.acao = (currentStep.acao || '') + '\n- ' + content;
                    }
                }
            }
        }

        if (currentSection === 'Validacoes' && trimmed.startsWith('- ')) {
            flow.validacoes = flow.validacoes || [];
            flow.validacoes.push(trimmed.substring(2).trim());
        }

        if (currentSection === 'CasosDeErro' && trimmed.startsWith('- ')) {
            flow.casosDeErro = flow.casosDeErro || [];
            flow.casosDeErro.push(trimmed.substring(2).trim());
        }

        if (currentSection === 'Observacoes' && trimmed.startsWith('- ')) {
            flow.observacoes = flow.observacoes || [];
            flow.observacoes.push(trimmed.substring(2).trim());
        }
    }

    return flow;
}

/**
 * Parseia os metadados YAML do flow
 */
function parseMetadata(content: string): FlowMetadata {
    const metadata: any = {};
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
        const trimmedLine = line.trim();
        // Remove '---' if accidentally included
        if (trimmedLine === '---' || !trimmedLine) continue;

        const match = trimmedLine.match(/^([^:]+):\s*(.+)$/);
        if (match) {
            const [, rawKey, value] = match;
            const key = rawKey.trim().toLowerCase();
            const val = value.trim();

            if (key === 'name' || key === 'nome') metadata.nome = val;
            else if (key === 'category' || key === 'categoria') metadata.categoria = val;
            else if (key === 'version' || key === 'versão' || key === 'versao') metadata.versão = val;
            else if (key === 'description' || key === 'descrição' || key === 'descricao') metadata.descrição = val;
            else if (key === 'author' || key === 'autor') metadata.autor = val;
            else if (key === 'date' || key === 'data') metadata.data = val;
            else metadata[key] = val;
        }
    }

    return metadata;
}

/**
 * Gera código TypeScript de referência baseado no flow
 */
export function generateTypeScriptReference(flow: Flow): string {
    const { metadata, contexto, passos } = flow;

    let code = `/**
 * ${metadata.nome}
 * 
 * Categoria: ${metadata.categoria}
 * Versão: ${metadata.versão}
 * Descrição: ${metadata.descrição}
 * 
 * ATENÇÃO: Este código foi gerado automaticamente a partir de um arquivo .flow
 * Use como REFERÊNCIA para implementação. Adapte conforme necessário.
 */

`;

    // Adiciona contexto como comentário
    if (contexto) {
        code += `/**
 * CONTEXTO:
 * ${contexto.trim()}
 */

`;
    }

    // Gera interfaces baseadas no flow
    code += generateInterfaces(flow);
    code += '\n';

    // Gera função principal
    code += generateMainFunction(flow);
    code += '\n';

    // Gera funções auxiliares
    code += generateHelperFunctions(flow);
    code += '\n';

    // Adiciona Regras e Observações ao final
    if ((flow.validacoes && flow.validacoes.length > 0) || (flow.observacoes && flow.observacoes.length > 0) || (flow.casosDeErro && flow.casosDeErro.length > 0)) {
        code += `/**\n`;

        if (flow.validacoes && flow.validacoes.length > 0) {
            code += ` * REGRAS DE NEGÓCIO:\n`;
            flow.validacoes.forEach(v => code += ` * - ${v}\n`);
            code += ` *\n`;
        }

        if (flow.casosDeErro && flow.casosDeErro.length > 0) {
            code += ` * CASOS DE ERRO:\n`;
            flow.casosDeErro.forEach(e => code += ` * - ${e}\n`);
            code += ` *\n`;
        }

        if (flow.observacoes && flow.observacoes.length > 0) {
            code += ` * RESULTADO FINAL:\n`;
            flow.observacoes.forEach(o => code += ` * - ${o}\n`);
        }

        code += ` */\n`;
    }

    return code;
}

/**
 * Gera interfaces TypeScript baseadas no flow
 */
function generateInterfaces(flow: Flow): string {
    const flowName = toPascalCase(flow.metadata.nome);

    return `// Interfaces para ${flow.metadata.nome}

export interface ${flowName}Input {
  userId: string;
  // Adicione outros campos conforme necessário
}

export interface ${flowName}Result {
  success: boolean;
  message?: string;
  data?: any;
}
`;
}

/**
 * Gera função principal baseada no flow
 */
function generateMainFunction(flow: Flow): string {
    const functionName = toCamelCase(flow.metadata.nome);
    const flowName = toPascalCase(flow.metadata.nome);

    let code = `/**
 * Função principal: ${flow.metadata.nome}
 * 
 * Esta função implementa o fluxo descrito em linguagem natural.
 * Revise cada passo e adapte conforme a arquitetura do seu projeto.
 */
export async function ${functionName}(
  input: ${flowName}Input
): Promise<${flowName}Result> {
  try {
    // TODO: Implementar os passos do fluxo
    
`;

    // Adiciona comentários para cada passo
    if (flow.passos && flow.passos.length > 0) {
        flow.passos.forEach((passo, index) => {
            code += `    // Passo ${index + 1}: ${passo.titulo}\n`;
            if (passo.quando) {
                code += passo.quando.split('\n').map((l, i) => `    // ${i === 0 ? 'Quando: ' : ''}${l}`).join('\n') + '\n';
            }
            if (passo.acao) {
                code += passo.acao.split('\n').map((l, i) => `    // ${i === 0 ? 'Ação: ' : ''}${l}`).join('\n') + '\n';
            }
            if (passo.resultadoEsperado) {
                code += passo.resultadoEsperado.split('\n').map((l, i) => `    // ${i === 0 ? 'Resultado Esperado: ' : ''}${l}`).join('\n') + '\n';
            }
            code += `    // TODO: Implementar passo ${index + 1}\n\n`;
        });
    }

    code += `    return {
      success: true,
      message: 'Fluxo executado com sucesso'
    };
  } catch (error) {
    console.error('Erro ao executar ${flow.metadata.nome}:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
`;

    return code;
}

/**
 * Gera funções auxiliares baseadas no flow
 */
function generateHelperFunctions(flow: Flow): string {
    return `/**
 * Funções auxiliares para ${flow.metadata.nome}
 * 
 * Adicione aqui funções de validação, formatação, etc.
 */

// Exemplo de função de validação
function validate${toPascalCase(flow.metadata.nome)}Input(
  input: any
): boolean {
  // TODO: Implementar validações
  return true;
}
`;
}

/**
 * Converte string para PascalCase
 */
export function toPascalCase(str: string): string {
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

/**
 * Gera documentação markdown do flow
 */
export function generateFlowDocumentation(flow: Flow): string {
    const { metadata, contexto, passos } = flow;

    let doc = `# ${metadata.nome}\n\n`;
    doc += `**Categoria:** ${metadata.categoria}  \n`;
    doc += `**Versão:** ${metadata.versão}  \n`;
    doc += `**Descrição:** ${metadata.descrição}\n\n`;

    if (metadata.autor) {
        doc += `**Autor:** ${metadata.autor}  \n`;
    }
    if (metadata.data) {
        doc += `**Data:** ${metadata.data}  \n`;
    }

    doc += '\n---\n\n';

    if (contexto) {
        doc += `## Contexto\n\n${contexto.trim()}\n\n`;
    }

    if (passos && passos.length > 0) {
        doc += `## Passos do Fluxo\n\n`;
        passos.forEach((passo, index) => {
            doc += `### ${index + 1}. ${passo.titulo}\n\n`;
            if (passo.quando) {
                doc += `**Quando:** ${passo.quando}\n\n`;
            }
            if (passo.acao) {
                doc += `**Ação:** ${passo.acao}\n\n`;
            }
            if (passo.resultadoEsperado) {
                doc += `**Resultado Esperado:** ${passo.resultadoEsperado}\n\n`;
            }
        });
    }

    if (flow.validacoes && flow.validacoes.length > 0) {
        doc += `## Regras de Negócio\n\n`;
        flow.validacoes.forEach(v => {
            doc += `- ${v}\n`;
        });
        doc += '\n';
    }

    if (flow.casosDeErro && flow.casosDeErro.length > 0) {
        doc += `## Casos de Erro\n\n`;
        flow.casosDeErro.forEach(e => {
            doc += `- ${e}\n`;
        });
        doc += '\n';
    }

    if (flow.observacoes && flow.observacoes.length > 0) {
        doc += `## Resultado Final\n\n`;
        flow.observacoes.forEach(o => {
            doc += `- ${o}\n`;
        });
        doc += '\n';
    }

    return doc;
}

/**
 * Converte um arquivo .flow em TypeScript e documentação Markdown.
 * @param inputPath Caminho para o arquivo .flow.
 * @param outDir Diretório de saída opcional (padrão: 'flows/generated').
 */
export function convertFlowFile(inputPath: string, outDir: string = 'flows/generated'): void {
    const { readFileSync, writeFileSync } = require('fs');
    const path = require('path');
    const content = readFileSync(inputPath, 'utf-8');
    const flow = parseFlowContent(content);
    const ts = generateTypeScriptReference(flow);
    const md = generateFlowDocumentation(flow);

    const baseName = path.basename(inputPath, '.flow');
    const outputDir = path.resolve(outDir);
    // Ensure output directory exists
    try { require('fs').mkdirSync(outputDir, { recursive: true }); } catch (e) { }
    writeFileSync(path.join(outputDir, `${baseName}.ts`), ts);
    writeFileSync(path.join(outputDir, `${baseName}.md`), md);
}
