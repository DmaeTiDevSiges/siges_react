/**
 * manualRagService.ts
 * RAG dos manuais técnicos:
 *
 * 1. INDEXAÇÃO — baixa o arquivo do R2, extrai texto (PDFs via Gemini File API
 *    com mediaResolution, texto puro direto), chunka (manualChunker) e grava
 *    embeddings no ai_knowledge (pgvector 768d) com proveniência tm_id/tm_file_id.
 * 2. BUSCA — dado o texto da pergunta e os tm_ids dos ativos da visita,
 *    retorna os trechos mais relevantes (RPC match_manual_knowledge).
 *
 * Mídia indexável: pdf, docx, txt, csv (texto). Imagens e planilhas binárias
 * não são indexadas (são apenas visualizáveis na aba Manuais).
 */

import { supabase } from '../core/supabase';
import { r2Service } from '../media/r2Service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chunkManualText, ManualChunk } from './manualChunker';
import type { TechnicalManualFile } from '../../types';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);

const MAX_FILE_BYTES = 18 * 1024 * 1024; // limite seguro inline (File API aceita 20MB total)
const EMBED_BATCH = 8; // chunks por requisição de embedding

export type IndexResultStatus = 'completed' | 'partial' | 'error' | 'skipped';

export interface IndexResult {
  status: IndexResultStatus;
  chunks: number;
  message: string;
}

export interface ManualExcerpt {
  content: string;
  documentName: string;
  pageNumber?: number;
  manualId: string;
  similarity: number;
}

export const isGeminiConfigured = (): boolean => !!geminiApiKey;

const isTextExtractable = (file: TechnicalManualFile): boolean => {
  const ext = file.docFileName.split('.').pop()?.toLowerCase() || '';
  return ['pdf', 'docx', 'doc', 'txt', 'csv'].includes(ext) || file.fileType === 'pdf' || file.fileType === 'doc';
};

const extOf = (file: TechnicalManualFile): string =>
  file.docFileName.split('.').pop()?.toLowerCase() || '';

/** Cache em memória dos arquivos já indexados nesta sessão (evita re-request ao abrir a tela) */
let indexedFilesCache: Map<string, { chunks: number; indexedAt: string }> | null = null;

export const manualRagService = {
  /** Limpa o cache local (após reindexação) */
  invalidateCache() {
    indexedFilesCache = null;
  },

  /**
   * Consulta quantos chunks indexados existem para um arquivo.
   * Cache em memória com TTL curto para não martelar o Supabase na renderização.
   */
  async getFileChunkCount(tmFileId: string): Promise<number> {
    if (!indexedFilesCache) {
      indexedFilesCache = new Map();
    }
    const cached = indexedFilesCache.get(tmFileId);
    if (cached) return cached.chunks;

    try {
      const { count, error } = await supabase
        .from('ai_knowledge')
        .select('*', { count: 'exact', head: true })
        .eq('tm_file_id', parseInt(tmFileId));
      if (error) throw error;
      const chunks = count || 0;
      indexedFilesCache.set(tmFileId, { chunks, indexedAt: new Date().toISOString() });
      return chunks;
    } catch (err) {
      console.warn('[ManualRAG] chunk count failed:', err);
      return 0;
    }
  },

  /**
   * Extrai texto de um arquivo usando a Gemini File API.
   * PDFs: o modelo devolve o texto das páginas (mais fiel que pdf.js em scans).
   * Fallback para texto puro: leitura direta.
   */
  async extractDocumentText(file: TechnicalManualFile): Promise<{ pages: { pageNumber: number; text: string }[] }> {
    const ext = extOf(file);

    // Texto puro: leitura direta
    if (['txt', 'csv'].includes(ext)) {
      const blob = await r2Service.downloadFile(`${file.docFilePath}/${file.docFileName}`);
      const text = await blob.text();
      return { pages: [{ pageNumber: 1, text }] };
    }

    // PDF/DOCX: Gemini File API (upload + prompt de extração)
    const blob = await r2Service.downloadFile(`${file.docFilePath}/${file.docFileName}`);
    if (blob.size > MAX_FILE_BYTES) {
      throw new Error(`Arquivo muito grande para indexação (${(blob.size / 1024 / 1024).toFixed(1)} MB). Limite: 18 MB.`);
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const mimeType = blob.type && blob.type !== 'application/octet-stream' ? blob.type : (mimeMap[ext] || 'application/pdf');

    const result = await model.generateContent([
      'Extraia TODO o texto deste documento técnico, página por página. ' +
      'FORMATO EXATO de resposta: uma linha "=== PÁGINA N ===" antes do texto de cada página, ' +
      'sem comentários, sem markdown, sem resumos. Preserve a ordem e o conteúdo integral.',
      {
        inlineData: {
          mimeType,
          data: btoa(String.fromCharCode(...bytes)),
        },
      },
    ]);

    const raw = result.response.text() || '';
    if (!raw.trim()) {
      throw new Error('Extração retornou texto vazio (documento escaneado sem OCR?).');
    }

    // Parse "=== PÁGINA N ===" → páginas
    const pages: { pageNumber: number; text: string }[] = [];
    const parts = raw.split(/=+\s*P[ÁA]GINA\s+(\d+)\s*=+/i);
    // parts[0] = texto antes da 1ª marcação; pares [num, texto]
    if (parts[0]?.trim()) {
      pages.push({ pageNumber: 1, text: parts[0].trim() });
    }
    for (let i = 1; i < parts.length; i += 2) {
      const num = parseInt(parts[i], 10) || pages.length + 1;
      const text = (parts[i + 1] || '').trim();
      if (text) pages.push({ pageNumber: num, text });
    }

    return { pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: raw.trim() }] };
  },

  /**
   * Indexa (ou reindexa) um arquivo de manual no pgvector.
   */
  async indexFile(file: TechnicalManualFile, manualId: string, documentName: string): Promise<IndexResult> {
    if (!geminiApiKey) {
      return { status: 'error', chunks: 0, message: 'VITE_GEMINI_API_KEY não configurada.' };
    }
    if (!isTextExtractable(file)) {
      return { status: 'skipped', chunks: 0, message: 'Tipo de arquivo sem texto indexável (imagem/planilha).' };
    }

    try {
      // 1. Remove indexação anterior (reindexação idempotente)
      await this.deleteFileIndex(file.id);

      // 2. Extração de texto
      const { pages } = await this.extractDocumentText(file);
      const fullText = pages.map(p => p.text).join('\n\n');
      if (!fullText.trim()) {
        return { status: 'error', chunks: 0, message: 'Nenhum texto extraído do documento.' };
      }

      // 3. Chunking (página a página, mantendo proveniência)
      const chunks: ManualChunk[] = [];
      for (const page of pages) {
        chunks.push(...chunkManualText(page.text, page.pageNumber));
      }
      if (chunks.length === 0) {
        return { status: 'error', chunks: 0, message: 'Documento sem conteúdo textual suficiente para indexar.' };
      }

      // 4. Embeddings em lote + insert
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      let indexed = 0;
      let failures = 0;

      for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
        const batch = chunks.slice(i, i + EMBED_BATCH);
        try {
          const embedResponses = await Promise.all(
            batch.map(c => model.embedContent(c.text))
          );

          const rows = batch.map((c, j) => ({
            content: c.text,
            embedding: embedResponses[j].embedding.values.slice(0, 768),
            source_type: 'manual',
            tm_id: parseInt(manualId),
            tm_file_id: parseInt(file.id),
            document_name: documentName,
            page_number: c.pageNumber ?? null,
            metadata: {
              documentName,
              fileType: file.fileType,
              category: file.tmCategoryDescription || null,
              chunkIndex: c.index,
            },
          }));

          const { error } = await supabase.from('ai_knowledge').insert(rows);
          if (error) throw error;
          indexed += batch.length;
        } catch (batchErr) {
          console.error('[ManualRAG] batch embed/insert failed:', batchErr);
          failures += batch.length;
        }
      }

      this.invalidateCache();

      if (indexed === 0) {
        return { status: 'error', chunks: 0, message: 'Falha ao gravar os embeddings no banco.' };
      }
      return {
        status: failures > 0 ? 'partial' : 'completed',
        chunks: indexed,
        message: failures > 0
          ? `${indexed} trechos indexados (${failures} falharam).`
          : `${indexed} trechos indexados com sucesso.`,
      };
    } catch (err: any) {
      console.error('[ManualRAG] indexFile failed:', err);
      return { status: 'error', chunks: 0, message: err?.message || 'Erro desconhecido na indexação.' };
    }
  },

  /** Remove os chunks de um arquivo (usado antes de reindexar e ao excluir o arquivo) */
  async deleteFileIndex(tmFileId: string): Promise<void> {
    const id = parseInt(tmFileId);
    if (isNaN(id)) return;
    const { error } = await supabase
      .from('ai_knowledge')
      .delete()
      .eq('tm_file_id', id);
    if (error) {
      console.error('[ManualRAG] deleteFileIndex failed:', error);
      throw error;
    }
    this.invalidateCache();
  },

  /** Remove os chunks de todos os arquivos de um manual */
  async deleteManualIndex(tmId: string): Promise<void> {
    const id = parseInt(tmId);
    if (isNaN(id)) return;
    const { error } = await supabase
      .from('ai_knowledge')
      .delete()
      .eq('tm_id', id);
    if (error) {
      console.error('[ManualRAG] deleteManualIndex failed:', error);
      throw error;
    }
    this.invalidateCache();
  },

  /**
   * BUSCA RAG — retorna os trechos mais relevantes dos manuais informados.
   * Silencioso: qualquer falha retorna [] (o assistente segue sem trechos).
   */
  async searchManualExcerpts(query: string, tmIds: string[], matchCount = 6): Promise<ManualExcerpt[]> {
    const ids = (tmIds || []).map(id => parseInt(id)).filter(id => !isNaN(id));
    if (!query.trim() || ids.length === 0 || !geminiApiKey) return [];

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const response = await model.embedContent(query);
      const embedding = response.embedding.values.slice(0, 768);

      const { data, error } = await supabase.rpc('match_manual_knowledge', {
        query_embedding: embedding,
        p_tm_ids: ids,
        match_threshold: 0.35,
        match_count: matchCount,
      });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        content: row.content,
        documentName: row.document_name || 'Manual',
        pageNumber: row.page_number ?? undefined,
        manualId: row.tm_id?.toString() || '',
        similarity: row.similarity,
      }));
    } catch (err) {
      console.warn('[ManualRAG] searchManualExcerpts failed (RAG desativado nesta requisição):', err);
      return [];
    }
  },
};
