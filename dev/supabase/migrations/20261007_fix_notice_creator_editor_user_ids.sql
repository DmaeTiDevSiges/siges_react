-- =====================================================
-- Migration: Corrige created_user_id / updated_user_id dos avisos
-- Description: O app gravava created_user_id/updated_user_id com
--              parseInt(supabase.auth.getUser().id) — o auth devolve o
--              UUID, então o valor virava os dígitos iniciais do UUID
--              (outro usuário) ou NULL. O certo é public.users.id
--              (lookup por users.uuid = auth.uid), como fazem
--              appTipsService, notificationsService e os demais serviços.
--
--              Esta migration:
--                1) mostra (diagnóstico) o valor atual x o valor
--                   recuperável de cada aviso;
--                2) regrava created_user_id/updated_user_id quando o
--                   valor armazenado bate com o prefixo numérico do UUID
--                   de UM (e só um) usuário — que é exatamente o que
--                   `parseInt(uuid)` produzia;
--                3) confirma o resultado.
--
--              Idempotente: rodar de novo não altera nada.
--              ⚠️ Rode a seção 1 (diagnóstico) primeiro e confira antes
--              das seções 2 e 3. Aplicação manual no SQL Editor do
--              Supabase (ver AGENTS.md).
-- =====================================================

SET timezone = 'America/Sao_Paulo';

-- =============================================================================
-- 1) DIAGNÓSTICO (somente leitura) — rode primeiro e confira
-- =============================================================================
-- candidato = usuário cujo UUID começa com os mesmos dígitos que o valor
-- gravado (parseInt lê os dígitos iniciais até a primeira letra/traço).
-- "ambiguos" > 1 significa prefixo igual para mais de um usuário: a linha
-- NÃO será corrigida automaticamente.

SELECT n.id,
       left(n.title, 40)                              AS aviso,
       n.created_user_id                              AS criador_atual_id,
       cu.name_full                                   AS criador_atual_nome,
       cand.id                                        AS criador_recuperado_id,
       cand.name_full                                 AS criador_recuperado_nome,
       n.updated_user_id                              AS editor_atual_id,
       uu.name_full                                   AS editor_atual_nome,
       edand.id                                       AS editor_recuperado_id,
       edand.name_full                                AS editor_recuperado_nome,
       n.created_at,
       n.updated_at
  FROM public.cfg_app_notices n
  LEFT JOIN public.users cu  ON cu.id  = n.created_user_id
  LEFT JOIN public.users uu  ON uu.id  = n.updated_user_id
  LEFT JOIN LATERAL (
         SELECT u.id, u.name_full, count(*) OVER () AS ambiguos
           FROM public.users u
          WHERE substring(u.uuid::text FROM '^[0-9]+') IS NOT NULL
            AND substring(u.uuid::text FROM '^[0-9]+')::bigint = n.created_user_id
       ) cand  ON true
  LEFT JOIN LATERAL (
         SELECT u.id, u.name_full
           FROM public.users u
          WHERE n.updated_user_id IS NOT NULL
            AND substring(u.uuid::text FROM '^[0-9]+') IS NOT NULL
            AND substring(u.uuid::text FROM '^[0-9]+')::bigint = n.updated_user_id
       ) edand ON true
 ORDER BY n.id;

-- =============================================================================
-- 2) Corrige created_user_id (apenas correspondência única de prefixo)
-- =============================================================================
WITH prefixo AS (
    SELECT u.id,
           substring(u.uuid::text FROM '^[0-9]+')::bigint AS parsed
      FROM public.users u
     WHERE substring(u.uuid::text FROM '^[0-9]+') IS NOT NULL
)
UPDATE public.cfg_app_notices n
   SET created_user_id = p.id
  FROM prefixo p
 WHERE n.created_user_id = p.parsed
   AND p.id <> n.created_user_id
   AND NOT EXISTS (
         SELECT 1 FROM prefixo p2
          WHERE p2.parsed = n.created_user_id
            AND p2.id <> p.id
       );

-- =============================================================================
-- 3) Corrige updated_user_id (NULL não é recuperável — fica sem "Alterado")
-- =============================================================================
WITH prefixo AS (
    SELECT u.id,
           substring(u.uuid::text FROM '^[0-9]+')::bigint AS parsed
      FROM public.users u
     WHERE substring(u.uuid::text FROM '^[0-9]+') IS NOT NULL
)
UPDATE public.cfg_app_notices n
   SET updated_user_id = p.id
  FROM prefixo p
 WHERE n.updated_user_id IS NOT NULL
   AND n.updated_user_id = p.parsed
   AND p.id <> n.updated_user_id
   AND NOT EXISTS (
         SELECT 1 FROM prefixo p2
          WHERE p2.parsed = n.updated_user_id
            AND p2.id <> p.id
       );

-- =============================================================================
-- 4) Verificação final
-- =============================================================================
SELECT n.id,
       left(n.title, 40)          AS aviso,
       n.created_user_id,
       cu.name_full               AS criador,
       n.updated_user_id,
       uu.name_full               AS alterado_por
  FROM public.cfg_app_notices n
  LEFT JOIN public.users cu ON cu.id = n.created_user_id
  LEFT JOIN public.users uu ON uu.id = n.updated_user_id
 ORDER BY n.id;
