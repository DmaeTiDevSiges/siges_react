-- Migration: Add is_evaluable column to cfg_teams
-- Description: Adds is_evaluable boolean to control which teams can be evaluated
-- Date: 2026-08-19

-- 1. Add column
ALTER TABLE public.cfg_teams ADD COLUMN IF NOT EXISTS is_evaluable boolean DEFAULT true;

-- 2. Update v_teams view (DROP + CREATE to include new column)
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
    cfg_teams.version,
    cfg_teams.is_evaluable
   FROM public.cfg_teams
  WHERE (cfg_teams.is_deleted = false)
  ORDER BY cfg_teams.sort_order, cfg_teams.description;
