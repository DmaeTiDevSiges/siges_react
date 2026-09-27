-- =============================================================================
-- Migration: materials — próximo id = primeiro livre a partir de 1
-- Data: 2026-09-26 (revisada: limite de busca para não estourar statement_timeout)
-- Aplicação: manual, no SQL Editor do Supabase (ver AGENTS.md)
-- =============================================================================
-- Objetivo:
--   1) reajustar public.materials_id_seq para que o próximo id seja o menor
--      inteiro >= 1 que NÃO existe em materials.id;
--   2) manter essa regra no tempo: quando o valor vindo da sequência (ou um id
--      enviado explicitamente pelo cliente) já existir, o trigger atribui o
--      primeiro livre. Sem isso, após ~57 inserts o nextval bateria no id 59
--      e a gravação falharia por violação de materials_pkey.
--
-- ⚠ A busca do 1º livre usa generate_series(1, COUNT(*)+1) e NUNCA
--   generate_series(1, MAX(id)+1): como 1º livre <= nº de linhas + 1 (se os
--   N+1 primeiros inteiros existissem seriam necessárias N+1 linhas), o custo
--   fica limitado a ~N sondagens no PK. A versão anterior com MAX(id)+1 gerava
--   ~991 mi de itens, materializava o anti-join e dava
--   "57014 canceling statement due to statement timeout" no INSERT.
--
-- Idempotente e aditiva: nenhum DROP ... CASCADE, nenhuma renumeração de ids
-- existentes (as FKs de warehouses_materials, materials_purchases,
-- assets_materials e orders_visits_assets_materials permanecem válidas).
-- Convive com o trigger existente tgr_materials_searchable (usa só code e
-- description, não depende de id).
--
-- Situação verificada em 2026-09-26 (leitura via REST):
--   32.825 linhas | id min = 1 | id max = 991.103.569 | 1º livre = 2
--   10 menores ids: 1, 59, 75, 83, 166, 190, 224, 265, 273, 281
-- =============================================================================

-- 1) Função: atribui a NEW.id o primeiro inteiro >= 1 sem linha em materials
CREATE OR REPLACE FUNCTION public.fc_materials_first_free_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    free_id     bigint;
    candidate   bigint;
BEGIN
    -- Caminho rápido: id (vindo da sequência ou do cliente) ainda livre
    IF NEW.id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.materials m WHERE m.id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Só daqui em diante o id muda: serializa para dois inserts não
    -- escolherem o mesmo id livre
    PERFORM pg_advisory_xact_lock(20260926);

    -- 1º livre <= nº de linhas (id >= 1) + 1  => busca limitada e barata
    SELECT n
      INTO free_id
      FROM generate_series(
             1,
             (SELECT COUNT(*) + 1 FROM public.materials WHERE id >= 1)
           ) AS g(n)
     WHERE NOT EXISTS (SELECT 1 FROM public.materials m WHERE m.id = n)
     LIMIT 1;

    -- Fallback extremo (nunca deve ocorrer): próximo após o maior id
    IF free_id IS NULL THEN
        SELECT COALESCE(MAX(id), 0) + 1 INTO free_id FROM public.materials;
    END IF;

    NEW.id := free_id;

    -- Sincroniza a sequência com a fronteira: próximos inserts seguem daí
    PERFORM setval('public.materials_id_seq', free_id, true);

    RETURN NEW;
END;
$$;

-- 2) Trigger BEFORE INSERT que aplica a regra
DROP TRIGGER IF EXISTS trg_materials_first_free_id ON public.materials;

CREATE TRIGGER trg_materials_first_free_id
    BEFORE INSERT ON public.materials
    FOR EACH ROW
    EXECUTE FUNCTION public.fc_materials_first_free_id();

-- 3) Reajusta a sequência para o primeiro id livre (próximo nextval = esse valor)
DO $$
DECLARE
    free_id bigint;
BEGIN
    SELECT n
      INTO free_id
      FROM generate_series(
             1,
             (SELECT COUNT(*) + 1 FROM public.materials WHERE id >= 1)
           ) AS g(n)
     WHERE NOT EXISTS (SELECT 1 FROM public.materials m WHERE m.id = n)
     LIMIT 1;

    IF free_id IS NULL THEN
        SELECT COALESCE(MAX(id), 0) + 1 INTO free_id FROM public.materials;
    END IF;

    PERFORM setval('public.materials_id_seq', free_id - 1, false);

    RAISE NOTICE 'materials_id_seq reajustado: próximo id = %', free_id;
END;
$$;

-- =============================================================================
-- Verificação pós-aplicação:
--   SELECT last_value, is_called FROM public.materials_id_seq;  -- 1 / false
--   INSERT de teste deve gravar id = 2 e, na sequência, 3, 4 ... (pula ids
--   já existentes, ex.: 59).
-- =============================================================================
