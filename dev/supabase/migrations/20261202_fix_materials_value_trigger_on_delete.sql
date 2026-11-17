-- ==============================================================================
-- Migration: 20261202_fix_materials_value_trigger_on_delete.sql
-- Custo de materiais da visita não baixava ao REMOVER O ATIVO da visita.
--
-- Por quê: trg_orders_visits_assets_update_materials_value (AFTER INSERT OR UPDATE
-- OR DELETE em orders_visits_assets_materials) chama
-- fc_orders_visits_assets_update_materials_value(), que só usava NEW. No DELETE
-- não existe NEW: o WHERE virava "ov_id = NULL", nada era recalculado e
-- orders_visits.ov_materials_value ficava com o custo antigo.
--   • Remover UM material (removeMaterialFromAsset) faz UPDATE is_deleted = true
--     → funcionava.
--   • Remover O ATIVO (removeAssetFromOrderVisit) faz DELETE das linhas de
--     material → não recalculava (o bug).
--
-- O que faz:
--   1. Função auxiliar fc_orders_visits_recalc_materials_value(ov_id, asset_id):
--      mesma conta de antes (ativo → soma dos materiais não excluídos; visita →
--      soma dos ativos).
--   2. Função do gatilho passa a usar OLD no DELETE e, no UPDATE que troca a
--      visita/ativo da linha, recalcula o lado antigo e o novo.
--      CREATE OR REPLACE (sem DROP): o gatilho existente continua ligado.
--   3. Acerta as visitas que já ficaram com o valor errado (só onde difere).
--      Valores aprovados (ov_costs_approved_*) NÃO são alterados.
--
-- Idempotente. Reverter: 20261202_fix_materials_value_trigger_on_delete_DOWN.sql
--
-- Prévia do acerto (rodar ANTES, opcional) — visitas com valor divergente:
--   SELECT ov.id, ov.ov_materials_value AS gravado, COALESCE(s.total, 0) AS correto
--     FROM public.orders_visits ov
--     LEFT JOIN (SELECT ov_id, SUM(COALESCE(materials_value, 0)) AS total
--                  FROM public.orders_visits_assets GROUP BY ov_id) s ON s.ov_id = ov.id
--    WHERE COALESCE(ov.ov_materials_value, 0) <> COALESCE(s.total, 0);
-- ==============================================================================

BEGIN;

-- 1. Recalcula o custo de materiais de um ativo da visita e o total da visita.
CREATE OR REPLACE FUNCTION public.fc_orders_visits_recalc_materials_value(p_ov_id BIGINT, p_asset_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF p_ov_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.orders_visits_assets
       SET materials_value = (
           SELECT COALESCE(SUM(value_total), 0)
             FROM public.orders_visits_assets_materials
            WHERE ov_id = p_ov_id
              AND asset_id = p_asset_id
              AND is_deleted = false
       )
     WHERE ov_id = p_ov_id
       AND asset_id = p_asset_id;

    UPDATE public.orders_visits
       SET ov_materials_value = (
           SELECT COALESCE(SUM(materials_value), 0)
             FROM public.orders_visits_assets
            WHERE ov_id = p_ov_id
       )
     WHERE id = p_ov_id;
END;
$$;

-- 2. Função do gatilho: OLD no DELETE; no UPDATE, o lado antigo e (se mudou) o novo.
CREATE OR REPLACE FUNCTION public.fc_orders_visits_assets_update_materials_value()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        PERFORM public.fc_orders_visits_recalc_materials_value(OLD.ov_id, OLD.asset_id);
    END IF;

    IF TG_OP = 'INSERT'
       OR (TG_OP = 'UPDATE' AND (NEW.ov_id IS DISTINCT FROM OLD.ov_id
                                 OR NEW.asset_id IS DISTINCT FROM OLD.asset_id)) THEN
        PERFORM public.fc_orders_visits_recalc_materials_value(NEW.ov_id, NEW.asset_id);
    END IF;

    RETURN NULL; -- AFTER ... FOR EACH ROW: o retorno é ignorado
END;
$$;

-- 3. Acerto do que já ficou errado (só linhas divergentes).
UPDATE public.orders_visits_assets a
   SET materials_value = s.total
  FROM (
      SELECT a2.id, COALESCE(SUM(m.value_total) FILTER (WHERE m.is_deleted = false), 0) AS total
        FROM public.orders_visits_assets a2
        LEFT JOIN public.orders_visits_assets_materials m
               ON m.ov_id = a2.ov_id AND m.asset_id = a2.asset_id
       GROUP BY a2.id
  ) s
 WHERE s.id = a.id
   AND COALESCE(a.materials_value, 0) <> s.total;

UPDATE public.orders_visits ov
   SET ov_materials_value = COALESCE(s.total, 0)
  FROM public.orders_visits ov2
  LEFT JOIN (
      SELECT ov_id, SUM(COALESCE(materials_value, 0)) AS total
        FROM public.orders_visits_assets
       GROUP BY ov_id
  ) s ON s.ov_id = ov2.id
 WHERE ov2.id = ov.id
   AND COALESCE(ov.ov_materials_value, 0) <> COALESCE(s.total, 0);

COMMIT;

-- Conferência (deve voltar 0 linhas): rodar a "Prévia do acerto" do cabeçalho.
