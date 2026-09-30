-- Migration: Hierarquia (organograma) dos setores da unidade
-- Data: 2026-09-29
-- Objetivo: permitir re-parenting de setores da unidade (cfg_units_assets_tags)
--           via organograma com drag-and-drop. A hierarquia fica na própria
--           tabela (decisão do usuário), por isso adicionamos parent_id.
-- Escopo: 100% ADITIVO — sem DROP, sem CASCADE, nenhuma view/função dependente
--         é afetada (cfg_units_assets_tags só alimenta views via SELECT).

-- 1) Colunas novas (idempotente)
ALTER TABLE public.cfg_units_assets_tags
    ADD COLUMN IF NOT EXISTS parent_id bigint;

ALTER TABLE public.cfg_units_assets_tags
    ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 2) FK para autoreferência (opcional, mas garante integridade do re-parent)
--    Nome único para não colidir com FKs existentes.
ALTER TABLE public.cfg_units_assets_tags
    ADD CONSTRAINT cfg_units_assets_tags_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES public.cfg_units_assets_tags(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

-- 3) Índice para lookup de filhos (build da árvore)
CREATE INDEX IF NOT EXISTS idx_units_assets_tags_parent_id
    ON public.cfg_units_assets_tags (parent_id);

-- 4) (Opcional) Backfill de nomes agrupados por vírgula.
--    Se a unidade tinha setores compostos como "ETA - Bomba 1, Bomba 2"
--    (pai antes de " - ", filhos após as vírgulas), semeia a hierarquia
--    por similaridade de nome. Comente o bloco se não quiser backfill.
--
--    OBS: o app usa 3 convenções de nome em cfg_units_assets_tags:
--      a) "PAI > FILHO"   (asset_tag_tag_sub_description com " > ")
--      b) "PAI - FILHO"   (tag_description com " - ")
--    Este backfill cobre o caso (a); o caso (b) é ambíguo (" - " também
--    aparece em nomes legítimos) e fica de fora de propósito.
--
-- WITH split AS (
--     SELECT id,
--            unit_id,
--            split_part(asset_tag_tag_sub_description, ' > ', 1) AS parent_name,
--            asset_tag_tag_sub_description AS full_name
--     FROM public.cfg_units_assets_tags
--     WHERE is_deleted = false AND is_active = true
--       AND asset_tag_tag_sub_description LIKE '%>%'
-- )
-- UPDATE public.cfg_units_assets_tags child
-- SET parent_id = parent_row.id
-- FROM split s
-- JOIN public.cfg_units_assets_tags parent_row
--      ON parent_row.unit_id = s.unit_id
--     AND parent_row.is_deleted = false
--     AND parent_row.asset_tag_tag_sub_description = s.parent_name
-- WHERE child.id = s.id
--   AND child.parent_id IS NULL;
