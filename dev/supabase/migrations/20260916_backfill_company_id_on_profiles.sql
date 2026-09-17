-- Migration: Backfill company_id on cfg_profiles from cfg_departments
-- The company_id column was added with a default of '1', but existing profiles
-- need to be updated to reflect their actual company via department_id → cfg_departments.company_id

UPDATE cfg_profiles p
SET company_id = d.company_id
FROM cfg_departments d
WHERE p.department_id = d.id
  AND (p.company_id IS NULL OR p.company_id = 1)
  AND d.company_id IS NOT NULL;
