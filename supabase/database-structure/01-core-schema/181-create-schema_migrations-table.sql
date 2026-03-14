-- =============================================================================
-- Table: schema_migrations
-- Exported: 2026-03-05T17:29:32.034Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.schema_migrations CASCADE;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version bigint,
    inserted_at timestamp without time zone DEFAULT now()
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_schema_migrations_created_at ON public.schema_migrations(created_at);
-- CREATE INDEX idx_schema_migrations_user_id ON public.schema_migrations(user_id);

