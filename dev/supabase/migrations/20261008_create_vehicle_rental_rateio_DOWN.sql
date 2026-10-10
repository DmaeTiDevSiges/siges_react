-- ============================================================
-- DOWN: Rateio de Aluguel Veicular
-- Data: 2026-10-08
-- Reversão da migration 20261008_create_vehicle_rental_rateio.sql
--
--   ATENÇÃO: apaga os dados da feature (contratos, competências,
--   rateios e linhas 'rental' geradas nas visitas).
--   Como a reversão da view exige DROP VIEW (que não admite
--   remover coluna via CREATE OR REPLACE), esta parte também é
--   irreversível sem a migration original (re-executar a UP
--   restaura tudo).
--
--   Ordem: objetos dependentes primeiro; nenhum DROP ... CASCADE.
-- ============================================================

-- 1. Triggers de guarda (precisam sair antes de apagar as linhas)
DROP TRIGGER IF EXISTS trg_orders_visits_vehicles_rateio_guard ON public.orders_visits_vehicles;
DROP TRIGGER IF EXISTS trg_vehicle_rental_allocation_guard ON public.vehicles_rentals_allocations;
DROP TRIGGER IF EXISTS trg_vehicle_rental_period_guard ON public.vehicle_rental_periods;

-- 2. Remove as linhas de rateio geradas (o rollup recalcula
--    ov_vehicles_value/ov_total_value de cada visita)
DELETE FROM public.orders_visits_vehicles
WHERE cost_type IN ('rental', 'variable');

-- 3. Funções (RPCs + guards)
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_contract(bigint, date);
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_summary(date);
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_detail(bigint, date);
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_calculate(bigint, date, bigint);
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_allocate(bigint, date, bigint);
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_close(bigint, date, bigint);
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_reopen(bigint, date, bigint);
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_revert(bigint, date, bigint);
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_period_guard();
DROP FUNCTION IF EXISTS public.fc_vehicle_rental_allocation_guard();
DROP FUNCTION IF EXISTS public.fc_orders_visits_vehicles_rateio_guard();

-- 4. Tabelas (allocations antes de periods, periods antes de contratos)
DROP TABLE IF EXISTS public.vehicles_rentals_allocations;
DROP TABLE IF EXISTS public.vehicle_rental_periods;

-- 5. Função financeira restaurada ao formato original (sem cost_type).
--    DROP sem CASCADE: se houver dependente, falha com erro claro.
DROP FUNCTION IF EXISTS public.fc_financial_orders_visits_vehicles_sum(integer[]);

CREATE FUNCTION public.fc_financial_orders_visits_vehicles_sum(ov_ids integer[])
RETURNS TABLE(vehicle_description text, unit text, value_unit numeric, discount numeric, amount_total numeric, value_total numeric)
    LANGUAGE sql
    SET search_path TO 'public'
    AS $$
  SELECT
    vos.vehicle_description,
    vos.unit,
    vos.value_unit,
    vos.discount,
    SUM(vos.amount) AS amount_total,
    SUM(vos.value_total) AS value_total
  FROM public.v_orders_visits_vehicles vos
  WHERE vos.ov_id = ANY(ov_ids)
  GROUP BY
    vos.vehicle_description,
    vos.unit,
    vos.value_unit,
    vos.discount
  ORDER BY
    vos.vehicle_description;
$$;

GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(integer[]) TO postgres;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(integer[]) TO anon;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(integer[]) TO authenticated;
GRANT ALL ON FUNCTION public.fc_financial_orders_visits_vehicles_sum(integer[]) TO service_role;

-- 6. View restaurada sem cost_type (remover coluna exige DROP VIEW;
--    sem CASCADE => falha com erro claro se houver dependente)
DROP VIEW IF EXISTS public.v_orders_visits_vehicles;

CREATE VIEW public.v_orders_visits_vehicles WITH (security_invoker='true') AS
 SELECT ovv.id,
    ovv.ov_id,
    ovv.vehicle_id,
    v.description AS vehicle_description,
    v.plates AS vehicle_plates,
    v.unit,
    ovv.recorder_start,
    ovv.recorder_end,
    ovv.amount,
    ovv.value_unit,
    ovv.value_total,
    ovv.discount,
    ovv.version_mode
   FROM (public.orders_visits_vehicles ovv
     JOIN public.vehicles v ON ((v.id = ovv.vehicle_id)))
  WHERE (ovv.is_deleted = false);

GRANT ALL ON TABLE public.v_orders_visits_vehicles TO postgres;
GRANT ALL ON TABLE public.v_orders_visits_vehicles TO anon;
GRANT ALL ON TABLE public.v_orders_visits_vehicles TO authenticated;
GRANT ALL ON TABLE public.v_orders_visits_vehicles TO service_role;

-- 7. cost_type removido de orders_visits_vehicles
ALTER TABLE public.orders_visits_vehicles
    DROP CONSTRAINT IF EXISTS orders_visits_vehicles_cost_type_ck;
ALTER TABLE public.orders_visits_vehicles
    DROP COLUMN IF EXISTS cost_type;

-- 8. Trigger BEFORE restaurado ao comportamento original
CREATE OR REPLACE FUNCTION public.fc_orders_visits_vehicles_before_save() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_price numeric;
BEGIN

    SELECT value_unit
    INTO v_price
    FROM public.vehicles
    WHERE id = NEW.vehicle_id;

    NEW.value_unit := COALESCE(v_price,0);

    NEW.amount :=
        GREATEST(
            COALESCE(NEW.recorder_end,0)
            - COALESCE(NEW.recorder_start,0),
            0
        );

    NEW.value_total :=
        NEW.amount
        * NEW.value_unit
        * COALESCE(NEW.discount,1);

    RETURN NEW;

END;
$$;

-- 9. Tabelas de configuração
DROP TABLE IF EXISTS public.cfg_vehicles_rentals_contracts;
DROP TABLE IF EXISTS public.cfg_vehicles_costs_types;

-- 10. Rotas e permissões criadas
DELETE FROM public.cfg_profiles_access
WHERE route_id IN (
    SELECT id FROM public.cfg_routes
    WHERE route_key IN ('transport_rental_apportionment', 'settings_vehicle_cost_types')
);

DELETE FROM public.cfg_routes
WHERE route_key IN ('transport_rental_apportionment', 'settings_vehicle_cost_types');

-- ============================================================
-- FIM DO DOWN
-- ============================================================
