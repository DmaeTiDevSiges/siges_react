/**
 * manualChunker.ts
 * Chunking puro (sem dependências) de texto extraído de manuais técnicos.
 * Separado do serviço para permitir teste unitário isolado.
 *
 * Estratégia:
 * - Split por páginas já feito antes (cada página entra com seu número).
 * - Divide por headings (linhas CURTAS em caps / numeradas) quando possível,
 *   depois por parágrafos, com overlap entre chunks consecutivos.
 * - Alvo ~1200 chars, limite 2000 chars (padrão de manuais do PLANO_IA_SIGES.md).
 */

export interface ChunkInput {
  text: string;
  pageNumber?: number;
}

export interface ManualChunk extends ChunkInput {
  index: number;
}

const TARGET_SIZE = 1200;
const MAX_SIZE = 2000;
const OVERLAP = 150;

/** Heurística de heading: linha curta, maiúsculas ou numerada ("3.2 Troca do filtro") */
const isHeading = (line: string): boolean => {
  const t = line.trim();
  if (!t || t.length > 80) return false;
  if (/^\d+(\.\d+)*[.)]?\s+\S/.test(t)) return true; // numerado
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length < 4) return false;
  const upperRatio = (letters.match(/[A-ZÀ-Þ]/g) || []).length / letters.length;
  return upperRatio > 0.7;
};

/** Limpa ruído comum de extração de PDF */
const cleanText = (text: string): string =>
  text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Divide um texto longo em chunks ≤ MAX_SIZE respeitando parágrafos,
 * com overlap aproximado entre chunks consecutivos.
 */
const splitLongText = (text: string): string[] => {
  if (text.length <= MAX_SIZE) return [text];

  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  for (const para of paragraphs) {
    // Parágrafo maior que o limite: corta por frases
    if (para.length > MAX_SIZE) {
      pushCurrent();
      const sentences = para.split(/(?<=[.!?;:])\s+/);
      let sentenceBuffer = '';
      for (const sentence of sentences) {
        if ((sentenceBuffer + ' ' + sentence).length > TARGET_SIZE && sentenceBuffer) {
          chunks.push(sentenceBuffer.trim());
          // overlap: começa o próximo pelo fim do anterior
          sentenceBuffer = sentenceBuffer.slice(-OVERLAP) + ' ' + sentence;
        } else {
          sentenceBuffer += (sentenceBuffer ? ' ' : '') + sentence;
        }
      }
      if (sentenceBuffer.trim()) current = sentenceBuffer.trim();
      continue;
    }

    if ((current + '\n\n' + para).length > TARGET_SIZE && current) {
      pushCurrent();
      // overlap aproximado: carrega o final do chunk anterior
      current = current.slice(-OVERLAP) ? current.slice(-OVERLAP) : '';
      current = (current ? current + '\n\n' : '') + para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  pushCurrent();
  return chunks.filter(c => c.length > 0);
};

/**
 * Converte o texto de uma página (ou documento inteiro) em chunks.
 * Cada chunk herda o número da página de origem.
 */
export const chunkManualText = (pageText: string, pageNumber?: number): ManualChunk[] => {
  const cleaned = cleanText(pageText);
  if (!cleaned) return [];

  const lines = cleaned.split('\n');
  const sections: string[] = [];
  let section = '';

  for (const line of lines) {
    if (isHeading(line) && section.trim()) {
      sections.push(section.trim());
      section = line;
    } else {
      section += (section ? '\n' : '') + line;
    }
  }
  if (section.trim()) sections.push(section.trim());

  const chunks: string[] = [];
  for (const s of sections) {
    if (s.length <= MAX_SIZE) {
      chunks.push(s);
    } else {
      chunks.push(...splitLongText(s));
    }
  }

  // Junta chunks vizinhos pequenos (evita fragmentos de 1 linha)
  const merged: string[] = [];
  for (const chunk of chunks) {
    const last = merged[merged.length - 1];
    if (last && last.length + chunk.length + 2 <= TARGET_SIZE) {
      merged[merged.length - 1] = `${last}\n\n${chunk}`;
    } else {
      merged.push(chunk);
    }
  }

  return merged
    .filter(c => c.trim().length >= 30) // descarta lixo mínimo
    .map((text, index) => ({ text: text.trim(), pageNumber, index }));
};
