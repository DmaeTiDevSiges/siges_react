-- Migration: Add sort_order column to cfg_teams
-- Description: Adds sort_order column for team drag-and-drop reordering
-- Date: 2026-08-09

ALTER TABLE public.cfg_teams ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Set initial sort_order based on current description order
WITH ordered_teams AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY description) - 1 AS new_order
    FROM public.cfg_teams
    WHERE sort_order = 0 OR sort_order IS NULL
)
UPDATE public.cfg_teams t
SET sort_order = ot.new_order
FROM ordered_teams ot
WHERE t.id = ot.id;

-- Update v_teams view (must DROP + CREATE to change columns)
DROP VIEW IF EXISTS public.v_teams;

CREATE VIEW public.v_teams AS
 SELECT cfg_teams.id,
    cfg_teams.parent_id,
    cfg_teams.code,
    cfg_teams.description,
    cfg_teams.department_id,
    cfg_teams.is_available,
    cfg_teams.sort_order,
    cfg_teams.img_url,
    cfg_teams.users_total,
    cfg_teams.company_id,
    cfg_teams.created_user_id,
    cfg_teams.created_at,
    cfg_teams.updated_user_id,
    cfg_teams.updated_at,
    cfg_teams.deleted_user_id,
    cfg_teams.deleted_at,
    cfg_teams.is_deleted,
    cfg_teams.version
   FROM public.cfg_teams
  WHERE (cfg_teams.is_deleted = false)
  ORDER BY cfg_teams.sort_order, cfg_teams.description;
