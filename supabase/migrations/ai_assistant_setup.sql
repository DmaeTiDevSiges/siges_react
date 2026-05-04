-- AI Assistant Setup Migration
-- Execute this in your Supabase SQL Editor

-- 1. Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the table for AI knowledge (RAG)
CREATE TABLE IF NOT EXISTS ai_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(768), -- Gemini standard dimension
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source_type TEXT -- 'manual', 'business_rule', 'history'
);

-- 3. Create index for semantic search
CREATE INDEX IF NOT EXISTS ai_knowledge_embedding_idx ON ai_knowledge USING ivfflat (embedding vector_cosine_ops);

-- 4. Create tables for chat history
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Helper function for similarity search
CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.content,
    k.metadata,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM ai_knowledge k
  WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 6. Enable RLS
ALTER TABLE ai_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- 7. Basic Policies
CREATE POLICY "Users can read knowledge" ON ai_knowledge FOR SELECT USING (true);
CREATE POLICY "Users can manage their own sessions" ON ai_chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read messages from their sessions" ON ai_messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM ai_chat_sessions 
        WHERE id = ai_messages.session_id AND user_id = auth.uid()
    )
);
