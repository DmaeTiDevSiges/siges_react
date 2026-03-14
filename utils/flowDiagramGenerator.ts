/**
 * Flow Diagram Generator Utility
 * Gera diagramas Mermaid a partir de arquivos .flow
 */

import { Flow, FlowStep } from './flowConverter';

export interface DiagramOptions {
    includeValidations?: boolean;
    includeErrorPaths?: boolean;
    orientation?: 'TD' | 'LR'; // Top-Down or Left-Right
}

/**
 * Gera um diagrama Mermaid flowchart a partir de um flow
 */
export function generateMermaidDiagram(
    flow: Flow,
    options: DiagramOptions = {}
): string {
    const {
        includeValidations = true,
        includeErrorPaths = true,
        orientation = 'TD'
    } = options;

    let diagram = `flowchart ${orientation}\n`;

    // Adiciona nós para cada passo
    if (flow.passos && flow.passos.length > 0) {
        flow.passos.forEach((passo, index) => {
            const nodeId = `step${index + 1}`;
            const label = sanitizeLabel(passo.titulo);

            // Usa diferentes formas baseado no tipo de passo
            if (passo.quando?.toLowerCase().includes('validar') ||
                passo.titulo.toLowerCase().includes('validar')) {
                // Diamante para decisões/validações
                diagram += `    ${nodeId}{${label}}\n`;
            } else if (index === 0) {
                // Círculo para início
                diagram += `    ${nodeId}([${label}])\n`;
            } else if (index === flow.passos.length - 1) {
                // Círculo duplo para fim
                diagram += `    ${nodeId}(((${label})))\n`;
            } else {
                // Retângulo para passos normais
                diagram += `    ${nodeId}[${label}]\n`;
            }
        });

        // Adiciona conexões entre passos
        for (let i = 0; i < flow.passos.length - 1; i++) {
            diagram += `    step${i + 1} --> step${i + 2}\n`;
        }
    }

    // Adiciona nós de erro se solicitado
    if (includeErrorPaths && flow.casosDeErro && flow.casosDeErro.length > 0) {
        diagram += `\n    %% Casos de Erro\n`;
        flow.casosDeErro.forEach((erro, index) => {
            const errorId = `error${index + 1}`;
            const label = sanitizeLabel(erro.substring(0, 30));
            diagram += `    ${errorId}[/${label}/]\n`;
            diagram += `    style ${errorId} fill:#ffcccc,stroke:#ff0000\n`;
        });
    }

    // Adiciona estilos
    diagram += `\n    %% Estilos\n`;
    diagram += `    classDef startEnd fill:#90EE90,stroke:#006400,stroke-width:2px\n`;
    diagram += `    classDef validation fill:#FFE4B5,stroke:#FF8C00,stroke-width:2px\n`;
    diagram += `    class step1 startEnd\n`;
    if (flow.passos && flow.passos.length > 0) {
        diagram += `    class step${flow.passos.length} startEnd\n`;
    }

    return diagram;
}

/**
 * Gera um diagrama de sequência Mermaid
 */
export function generateSequenceDiagram(flow: Flow): string {
    let diagram = `sequenceDiagram\n`;
    diagram += `    participant U as Usuário\n`;
    diagram += `    participant S as Sistema\n`;
    diagram += `    participant DB as Database\n\n`;

    if (flow.passos && flow.passos.length > 0) {
        flow.passos.forEach((passo) => {
            const action = sanitizeLabel(passo.titulo);

            // Determina quem inicia a ação baseado no contexto
            if (passo.quando?.toLowerCase().includes('usuário') ||
                passo.titulo.toLowerCase().includes('usuário')) {
                diagram += `    U->>S: ${action}\n`;
            } else if (passo.titulo.toLowerCase().includes('database') ||
                passo.titulo.toLowerCase().includes('banco')) {
                diagram += `    S->>DB: ${action}\n`;
                diagram += `    DB-->>S: Resultado\n`;
            } else {
                diagram += `    S->>S: ${action}\n`;
            }
        });
    }

    return diagram;
}

/**
 * Gera um diagrama de estado Mermaid
 */
export function generateStateDiagram(flow: Flow): string {
    let diagram = `stateDiagram-v2\n`;
    diagram += `    [*] --> Início\n`;

    if (flow.passos && flow.passos.length > 0) {
        let previousState = 'Início';

        flow.passos.forEach((passo, index) => {
            const stateName = `Estado${index + 1}`;
            const label = sanitizeLabel(passo.titulo);

            diagram += `    ${previousState} --> ${stateName}: ${label}\n`;
            previousState = stateName;
        });

        diagram += `    ${previousState} --> [*]\n`;
    }

    return diagram;
}

/**
 * Sanitiza labels para uso em Mermaid
 */
function sanitizeLabel(text: string): string {
    if (!text) return '';

    return text
        .replace(/"/g, "'")
        .replace(/\[/g, '(')
        .replace(/]/g, ')')
        .replace(/\n/g, ' ')
        .trim()
        .substring(0, 50); // Limita tamanho
}

/**
 * Gera todos os tipos de diagramas para um flow
 */
export function generateAllDiagrams(flow: Flow): {
    flowchart: string;
    sequence: string;
    state: string;
} {
    return {
        flowchart: generateMermaidDiagram(flow),
        sequence: generateSequenceDiagram(flow),
        state: generateStateDiagram(flow)
    };
}

/**
 * Gera arquivo markdown com diagramas embutidos
 */
export function generateDiagramDocument(flow: Flow): string {
    const diagrams = generateAllDiagrams(flow);

    let doc = `# ${flow.metadata.nome} - Diagramas\n\n`;
    doc += `**Categoria:** ${flow.metadata.categoria}  \n`;
    doc += `**Versão:** ${flow.metadata.versão}\n\n`;
    doc += `---\n\n`;

    doc += `## Fluxograma\n\n`;
    doc += `\`\`\`mermaid\n${diagrams.flowchart}\`\`\`\n\n`;

    doc += `## Diagrama de Sequência\n\n`;
    doc += `\`\`\`mermaid\n${diagrams.sequence}\`\`\`\n\n`;

    doc += `## Diagrama de Estados\n\n`;
    doc += `\`\`\`mermaid\n${diagrams.state}\`\`\`\n\n`;

    return doc;
}
