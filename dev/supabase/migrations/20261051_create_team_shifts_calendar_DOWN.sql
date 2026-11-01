-- DOWN da migration 20261051_create_team_shifts_calendar.sql
-- Remove marcações diárias sem alterar os totais mensais existentes.

DROP FUNCTION IF EXISTS public.save_team_shifts_calendar(date, bigint, jsonb);
DROP FUNCTION IF EXISTS public.get_team_shifts_calendar(date, bigint);
DROP TABLE IF EXISTS public.teams_shifts_calendar;
