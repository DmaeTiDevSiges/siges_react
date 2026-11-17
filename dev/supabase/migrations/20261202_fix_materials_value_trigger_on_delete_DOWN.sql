-- Reverte 20261202_fix_materials_value_trigger_on_delete.sql
-- Volta a função do gatilho à versão anterior (só NEW; DELETE não recalcula) e remove a auxiliar.
-- O acerto de valores feito na migration NÃO é desfeito (eram valores errados).

BEGIN;

CREATE OR REPLACE FUNCTION public.fc_orders_visits_assets_update_materials_value()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RAISE NOTICE 'trg_orders_visits_assets_update_materials_value executed for ov_id: %, asset_id: %', NEW.ov_id, NEW.asset_id;

    UPDATE public.orders_visits_assets
    SET materials_value = (
        SELECT COALESCE(SUM(value_total), 0)
        FROM public.orders_visits_assets_materials
        WHERE ov_id = NEW.ov_id
        AND asset_id = NEW.asset_id
        AND is_deleted = false
    )
    WHERE ov_id = NEW.ov_id AND asset_id = NEW.asset_id;

    UPDATE public.orders_visits
    SET ov_materials_value = (
        SELECT COALESCE(SUM(materials_value), 0)
        FROM public.orders_visits_assets
        WHERE ov_id = NEW.ov_id
    )
    WHERE id = NEW.ov_id;

    RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.fc_orders_visits_recalc_materials_value(BIGINT, BIGINT);

COMMIT;
