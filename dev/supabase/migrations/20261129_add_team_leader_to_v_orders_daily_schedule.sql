-- ==============================================================================
-- Migration: 20261129_add_team_leader_to_v_orders_daily_schedule.sql
-- Programação Diária: o cartão da OS (faixas OS's ABERTAS e PRIORIDADE DE
-- ATENDIMENTO) passa a exibir a equipe responsável e o líder da OS.
--
-- Acrescenta ao FINAL de v_orders_daily_schedule (CREATE OR REPLACE, só aditiva):
--   team_code, team_description (cfg_teams) e team_leader_name_short (users),
--   com as mesmas junções/aliases semânticos da v_orders.
-- fn_orders_daily_schedule_board usa to_jsonb(v): não precisa ser recriada.
--
-- Depende da 20261128. Aplicar manualmente no SQL Editor do Supabase. Idempotente.
-- Reverter: reaplicar a seção 1 da 20261128 não funciona (CREATE OR REPLACE não
-- remove colunas) — use DROP VIEW ... CASCADE e reaplique a 20261128 inteira.
-- ==============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.v_orders_daily_schedule WITH (security_invoker = true) AS
SELECT
    o.id,
    o.contract_id,
    o.parent_id,
    o.order_mask,
    o.status_id,
    os.code         AS status_code,
    os.description  AS status_description,
    o.status_at,
    o.team_id,
    o.team_leader_id,
    op.code         AS priority_code,
    op.description  AS priority_description,
    o.unit_id,
    u.description_full AS unit_description,
    o.asset_tag_id,
    at.description  AS asset_tag_description,
    ats.description AS asset_tag_sub_description,
    o.requested_services,
    ot.code         AS type_code,
    ots.code        AS type_sub_code,
    oo.code         AS object_code,
    o.requested_at,
    -- Novas (20261129): equipe responsável e líder da OS.
    t.code          AS team_code,
    t.description   AS team_description,
    tl.name_short   AS team_leader_name_short
FROM public.orders o
     -- Junções obrigatórias (as mesmas INNER JOIN da v_orders: mesmas OSs no resultado).
     JOIN public.cfg_orders_types       ot  ON ot.id  = o.type_id
     JOIN public.cfg_orders_statuses    os  ON os.id  = o.status_id
     JOIN public.cfg_orders_priorities  op  ON op.id  = o.priority_id
     JOIN public.units                  u   ON u.id   = o.unit_id
     JOIN public.cfg_systems            sp  ON sp.id  = o.system_parent_id
     JOIN public.cfg_systems            s   ON s.id   = o.system_id
     JOIN public.cfg_units_types        utp ON utp.id = o.unit_type_parent_id
     JOIN public.cfg_units_types        ut  ON ut.id  = o.unit_type_id
     -- Opcionais usadas no cartão.
LEFT JOIN public.cfg_orders_types_subs  ots ON ots.id = o.type_sub_id
LEFT JOIN public.cfg_orders_objects     oo  ON oo.id  = o.object_id
LEFT JOIN public.cfg_assets_tags        at  ON at.id  = o.asset_tag_id
LEFT JOIN public.cfg_assets_tags_subs   ats ON ats.id = o.asset_tag_sub_id
LEFT JOIN public.cfg_teams              t   ON t.id   = o.team_id
LEFT JOIN public.users                  tl  ON tl.id  = o.team_leader_id;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Conferência (devem vir preenchidas nas OSs com equipe):
--   SELECT order_mask, team_code, team_leader_name_short
--     FROM public.v_orders_daily_schedule
--    WHERE team_id IS NOT NULL
--    LIMIT 10;
