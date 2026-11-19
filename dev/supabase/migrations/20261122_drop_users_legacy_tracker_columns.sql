-- ==============================================================================
-- Migration: 20261122_drop_users_legacy_tracker_columns.sql
-- Remove de public.users as colunas de posição que ficaram sem uso desde a
-- 20261111 (a posição atual mora em public.users_tracker):
--   latitude, longitude, tracker_accuracy, tracked_at, tracker_heartbeat_at
--
-- Também remove o espelhamento da 20261121 (trigger + função), que só existia
-- para APKs <= 1.1.62 que gravavam essas colunas direto em users.
--
-- ATENÇÃO: não há trava de APK antigo (removida a pedido). Quem ainda grava
-- posição direto em users (APK <= 1.1.62) passa a falhar no PATCH (coluna
-- inexistente) e deixa de enviar posição. Em 18/11/2026, 27 usuários tinham
-- gravado em users nos últimos 7 dias.
--
-- Sem CASCADE de propósito: se alguma view/função-SQL ainda depender dessas
-- colunas, o DROP falha e a transação inteira é desfeita (nada é perdido).
-- Já pego na 1ª tentativa: v_users (lia users.latitude/longitude) e, por
-- dependência, v_teams_leaders. v_users é redefinida abaixo para ler de
-- users_tracker; v_teams_leaders não muda (não seleciona essas colunas).
-- Corpos plpgsql NÃO são rastreados pelo Postgres; confira antes (pré-voo abaixo).
--
-- Dados: a posição atual já está em users_tracker (1 linha por usuário). Os
-- valores antigos de users são descartados.
-- Aplicar manualmente no SQL Editor. Idempotente.
-- Reverter: 20261122_drop_users_legacy_tracker_columns_DOWN.sql (recria as colunas
--           vazias e copia a posição de users_tracker).
--
-- PRÉ-VOO (rode antes e confira que não aparece nada inesperado):
--   -- funções que ainda citam as colunas de users (users_tracker.* é esperado):
--   SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public'
--      AND (p.prosrc ~* 'users\s+(AS\s+)?\w*\s*SET[^;]*(latitude|longitude|tracked_at|tracker_)'
--           OR p.prosrc ~* '\mu(sers)?\.(latitude|longitude|tracked_at|tracker_accuracy|tracker_heartbeat_at)\M');
--   -- views/colunas dependentes (precisa dar 0 linhas):
--   SELECT DISTINCT v.relname FROM pg_depend d
--     JOIN pg_rewrite r ON r.oid = d.objid JOIN pg_class v ON v.oid = r.ev_class
--     JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
--    WHERE d.refobjid = 'public.users'::regclass
--      AND a.attname IN ('latitude','longitude','tracker_accuracy','tracked_at','tracker_heartbeat_at');
-- ==============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.users_tracker') IS NULL THEN
        RAISE EXCEPTION 'Aplique antes 20261111_use_users_tracker_last_location.sql (users_tracker ausente).';
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_users_sync_position_to_tracker ON public.users;
DROP FUNCTION IF EXISTS public.fn_users_sync_position_to_tracker();

-- v_users lia users.latitude/longitude e impedia o DROP (v_teams_leaders depende de
-- v_users). CREATE OR REPLACE mantém nomes, tipos e ordem das colunas, então
-- v_teams_leaders e os GRANTs seguem intactos; latitude/longitude agora vêm de
-- users_tracker. Se o banco vivo tiver colunas a mais/diferentes do schema.sql, o
-- REPLACE falha e a transação é desfeita: nesse caso, reenvie a definição viva
-- (SELECT pg_get_viewdef('public.v_users'::regclass, true)).
CREATE OR REPLACE VIEW public.v_users WITH (security_invoker='true') AS
 SELECT users.id,
    users.uuid,
    cfg_departments.company_id,
    cfg_companies.code AS company_code,
    cfg_companies.description AS company_description,
    cfg_companies.img_file_path AS company_img_file_path,
    cfg_companies.img_file_name AS company_img_file_name,
    cfg_companies.email_sufix AS company_email_sufix,
    cfg_companies.is_available AS company_is_available,
    cfg_teams.department_id,
    cfg_departments.code AS department_code,
    cfg_departments.description AS department_description,
    users.email,
    users.name_short,
    users.name_full,
    users.team_id,
    cfg_teams.code AS team_code,
    cfg_teams.description AS team_description,
    users.team_amount,
    users.team_id_previous,
    users.status_id,
    cfg_users_statuses.code AS status_code,
    cfg_users_statuses.description AS status_description,
    users.is_team_leader,
    users.is_admin,
    users.is_admin_super,
    users.img_file_path,
    users.img_file_name,
    users.ov_id_in_progress,
    users.ov_id_in_progress_mask,
    users.o_id_in_progress,
    users.op_id_in_progress,
    users.ov_in_progress_leader_id,
    users.profile_id,
    cfg_profiles.description AS profile_description,
    users.vehicle_id,
    users.is_available,
    users.is_ov_in_progress,
    users.version_app,
    contracts.id AS o_contract_id_in_progress,
    users.o_type_id_in_progress,
    users.o_type_sub_id_in_progress,
    users.o_plan_id_in_progress,
    users.o_asset_tag_id_in_progress,
    users.o_unit_id_in_progress,
    users.o_system_id_in_progress,
    users.o_system_parent_id_in_progress,
    users.o_unit_type_id_in_progress,
    users.o_object_id_in_progress,
    users.token_fcm,
    users.notifications_amount,
    users.mobile,
    users.mobile_full,
    users.mobile_mask,
    users.mobile_whatsapp,
    users_tracker.latitude,
    users_tracker.longitude,
    users.tracker_interval_seconds,
    users.shift_start,
    users.shift_end,
    users.last_online
   FROM ((((((((public.users
     LEFT JOIN public.users_tracker ON ((users_tracker.user_id = users.id)))
     LEFT JOIN public.cfg_teams ON ((users.team_id = cfg_teams.id)))
     JOIN public.cfg_departments ON ((cfg_teams.department_id = cfg_departments.id)))
     JOIN public.cfg_companies ON ((cfg_departments.company_id = cfg_companies.id)))
     JOIN public.cfg_users_statuses ON ((users.status_id = cfg_users_statuses.id)))
     LEFT JOIN public.cfg_profiles ON ((users.profile_id = cfg_profiles.id)))
     LEFT JOIN public.orders ON ((users.o_id_in_progress = orders.id)))
     LEFT JOIN public.contracts ON ((orders.contract_id = contracts.id)))
  ORDER BY users.name_short;

ALTER TABLE public.users
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS longitude,
    DROP COLUMN IF EXISTS tracker_accuracy,
    DROP COLUMN IF EXISTS tracked_at,
    DROP COLUMN IF EXISTS tracker_heartbeat_at;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Conferência (deve devolver 0 linhas):
--   SELECT column_name FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'users'
--      AND column_name IN ('latitude','longitude','tracker_accuracy','tracked_at','tracker_heartbeat_at');
-- Depois teste: mapa de líderes (UsersTracker) e a posição de um líder com o app aberto.
