-- =============================================================================
-- RLS Policies
-- Note: Policy definitions may be incomplete via REST API
-- =============================================================================

-- Enable RLS on tables:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Common policies (add your custom ones here):

-- Example:
-- CREATE POLICY "Users can view own data"
-- ON users FOR SELECT
-- USING (auth.uid() = id);

