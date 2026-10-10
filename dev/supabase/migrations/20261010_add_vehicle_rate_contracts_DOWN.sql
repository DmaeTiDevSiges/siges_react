-- ============================================================
-- DOWN: Contratos de R$/km (custo operacional por Km)
-- Date: 2026-10-10
-- Description:
--   Reverte integralmente a migration
--   20261010_add_vehicle_rate_contracts.sql:
--     • restaura fc_orders_visits_vehicles_before_save exatamente
--       como definida em 20261009_add_vehicle_monthly_expenses.sql
--       (corpo copiado literalmente — odômetro volta a usar
--       vehicles.value_unit, sem exigir contrato);
--     • remove fc_vehicle_rate_contract e a tabela
--       cfg_vehicle_rate_contracts;
--     • remove a rota transport_rate_contracts e seus grants.
--
--   Ordem: objetos dependentes primeiro; nenhum DROP ... CASCADE.
--   Aplicação MANUAL no SQL Editor do Supabase.
--
--   ⚠ A remoção da tabela perde os contratos de R$/km cadastrados
--     (não há downgrade de dados). Linhas de odômetro já gravadas
--     mantêm o value_unit congelado — nada muda nelas.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Remove a rota e os grants dela
-- ------------------------------------------------------------
DELETE FROM public.cfg_profiles_access
WHERE route_id IN (
    SELECT id FROM public.cfg_routes WHERE route_key = 'transport_rate_contracts'
);

DELETE FROM public.cfg_routes
WHERE route_key = 'transport_rate_contracts';

-- ------------------------------------------------------------
-- 1. Restaura o trigger BEFORE (corpo literal da Fase 2 —
--    20261009_add_vehicle_monthly_expenses.sql §4)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fc_orders_visits_vehicles_before_save() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    v_price numeric;
BEGIN

    -- Conversão de origem feita pela apuração (odometer <-> rate):
    -- só cost_type muda; amount/value_unit/value_total/recorder e
    -- desconto ficam intactos (o rollup recalcula o mesmo total).
    IF TG_OP = 'UPDATE'
       AND NEW.cost_type IS DISTINCT FROM OLD.cost_type
       AND NEW.ov_id IS NOT DISTINCT FROM OLD.ov_id
       AND NEW.vehicle_id IS NOT DISTINCT FROM OLD.vehicle_id
       AND NEW.recorder_start IS NOT DISTINCT FROM OLD.recorder_start
       AND NEW.recorder_end IS NOT DISTINCT FROM OLD.recorder_end
       AND NEW.amount IS NOT DISTINCT FROM OLD.amount
       AND NEW.discount IS NOT DISTINCT FROM OLD.discount
       AND NEW.is_deleted IS NOT DISTINCT FROM OLD.is_deleted THEN
        RETURN NEW;
    END IF;

    -- Linhas de rateio/despesa não têm odômetro: preserva amount/value_unit
    -- informados e recalcula apenas value_total.
    IF NEW.cost_type IN ('rental', 'variable') THEN
        NEW.recorder_start := NULL;
        NEW.recorder_end   := NULL;
        NEW.value_unit     := COALESCE(NEW.value_unit, 0);
        NEW.amount         := COALESCE(NEW.amount, 0);
        NEW.value_total    := ROUND(
            NEW.amount * NEW.value_unit * COALESCE(NEW.discount, 1), 2
        );
        RETURN NEW;
    END IF;

    -- Linha já convertida para 'rate': jamais recalcula (só a RPC de
    -- estorno devolve a 'odometer'; fora do flag o guard bloqueia)
    IF NEW.cost_type = 'rate' THEN
        RETURN NEW;
    END IF;

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

-- ------------------------------------------------------------
-- 2. Remove a função e a tabela de contratos de R$/km
--    (nenhuma outra objeto depende dela; a tabela só é referenciada
--    por fc_vehicle_rate_contract, já removida abaixo)
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fc_vehicle_rate_contract(bigint, date);

DROP TABLE IF EXISTS public.cfg_vehicle_rate_contracts;

-- ============================================================
-- FIM DO DOWN 20261010_add_vehicle_rate_contracts_DOWN.sql
-- ============================================================
