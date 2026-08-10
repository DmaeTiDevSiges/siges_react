-- =============================================================================
-- Table: assets_attributes_values
-- Exported: 2026-03-05T17:29:34.065Z
-- Method: REST API Enhanced Extraction
-- =============================================================================

DROP TABLE IF EXISTS public.assets_attributes_values CASCADE;

CREATE TABLE IF NOT EXISTS public.assets_attributes_values (
    asset_id integer,
    field_key character varying(255),
    value character varying(255)
);

-- Indexes (add based on your query patterns):
-- CREATE INDEX idx_assets_attributes_values_created_at ON public.assets_attributes_values(created_at);
-- CREATE INDEX idx_assets_attributes_values_user_id ON public.assets_attributes_values(user_id);

