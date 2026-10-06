-- =====================================================================
-- RAG dos Manuais Técnicos
-- Estende ai_knowledge para indexar o CONTEÚDO dos arquivos dos
-- manuais técnicos (chunking + embeddings pgvector 768d, padrão
-- existente do ai_assistant_setup.sql).
-- Aplicar manualmente no SQL Editor do Supabase.
-- =====================================================================

-- 1. Colunas de proveniência para chunks de documentos
ALTER TABLE public.ai_knowledge
  ADD COLUMN IF NOT EXISTS tm_id INTEGER,
  ADD COLUMN IF NOT EXISTS tm_file_id BIGINT,
  ADD COLUMN IF NOT EXISTS document_name TEXT,
  ADD COLUMN IF NOT EXISTS page_number INTEGER;

COMMENT ON COLUMN public.ai_knowledge.tm_id IS 'Manual técnico de origem (technicals_manuals.id)';
COMMENT ON COLUMN public.ai_knowledge.tm_file_id IS 'Arquivo de origem (technicals_manuals_files.id)';
COMMENT ON COLUMN public.ai_knowledge.document_name IS 'Nome do documento de origem (redundância p/ debug)';
COMMENT ON COLUMN public.ai_knowledge.page_number IS 'Página de origem no documento';

-- 2. Índices para deleção/contagem por manual e por arquivo
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_tm_id
  ON public.ai_knowledge(tm_id)
  WHERE tm_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_tm_file_id
  ON public.ai_knowledge(tm_file_id)
  WHERE tm_file_id IS NOT NULL;

-- =====================================================================
-- 3. RPC de busca vetorial (RAG) filtrando pelos manuais
--    Recebe os IDs dos manuais dos ativos da visita (para restringir
--    a busca ao acervo relevante) e retorna os trechos mais próximos.
--    Segue o mesmo padrão de match_knowledge (ai_assistant_setup.sql).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.match_manual_knowledge (
  query_embedding VECTOR(768),
  p_tm_ids INT[],
  match_threshold FLOAT DEFAULT 0.35,
  match_count INT DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  tm_id INTEGER,
  tm_file_id BIGINT,
  document_name TEXT,
  page_number INTEGER,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    k.id,
    k.content,
    k.metadata,
    k.tm_id,
    k.tm_file_id,
    k.document_name,
    k.page_number,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM public.ai_knowledge k
  WHERE k.tm_id = ANY(p_tm_ids)
    AND 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- 4. Grants (mesmo padrão do match_knowledge)
GRANT ALL ON FUNCTION public.match_manual_knowledge(VECTOR(768), INT[], FLOAT, INT) TO postgres;
GRANT ALL ON FUNCTION public.match_manual_knowledge(VECTOR(768), INT[], FLOAT, INT) TO anon;
GRANT ALL ON FUNCTION public.match_manual_knowledge(VECTOR(768), INT[], FLOAT, INT) TO authenticated;
GRANT ALL ON FUNCTION public.match_manual_knowledge(VECTOR(768), INT[], FLOAT, INT) TO service_role;

-- =====================================================================
-- 5. RLS — chunks de manuais seguem a policy de leitura já existente
--    ("Users can read knowledge"). Nada a fazer. Insert/update/delete
--    são feitos pelo app autenticado conforme as policies vigentes.
-- =====================================================================
