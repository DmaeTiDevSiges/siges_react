-- =============================================================================
-- View: v_app
-- Description: Application version configuration view
-- =============================================================================

DROP VIEW IF EXISTS public.v_app CASCADE;

CREATE OR REPLACE VIEW public.v_app AS
 SELECT cfg_app.id,
    cfg_app.apk_url,
    cfg_app.version_app,
    cfg_app.version_app_mask,
    cfg_app.logo_url,
    cfg_app.version_app_offline,
    cfg_app.n8n_available_last_at
   FROM public.cfg_app;
