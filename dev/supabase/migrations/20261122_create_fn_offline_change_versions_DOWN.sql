-- Reverte 20261122_create_fn_offline_change_versions.sql
-- (o app volta a refazer cada grupo após 1 dia).
DROP FUNCTION IF EXISTS public.fn_offline_change_versions(BIGINT, BIGINT[], BIGINT[], BIGINT[]);
