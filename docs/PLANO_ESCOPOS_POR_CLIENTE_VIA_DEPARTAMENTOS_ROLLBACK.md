# Rollback — Escopo de dados por cliente via `cfg_departments.clients_ids`

> **Data:** 2026-10-23 (revisão 3 — 2026-10-26)
> **Objetivo:** Reverter a implementação de escopo por cliente, por fase, restaurando o comportamento original do app e do banco.
> **Plano:** `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS.md`
> **Runbook:** `docs/RUNBOOK_IMPLANTACAO_INCREMENTAL_ESCOPO_CLIENTES.md`
> **Migrations:**
> - `dev/supabase/migrations/20261026_units_clients_ids_compat.sql` — Fase 1A (aditiva)
> - `dev/supabase/migrations/20261026_client_scope.sql` — Fase 1D (barreira real)

---

## 0. Pré-requisitos — SNAPSHOT (executar ANTES de aplicar a migration de escopo)

> ⚠️ **Este é o passo mais importante do rollback.** Sem snapshot, restaurar as
> políticas originais é chute: nem todas as tabelas usam `"Universal Access"`
> (ver §2.2.3). Rode as 3 consultas abaixo no SQL Editor do Supabase **antes**
> de qualquer alteração de escopo e salve a saída em
> `dev/supabase/backups_pre_scope/` no repositório, commitada.

### 0.1 Script de restauração de TODAS as policies do schema `public`

Gera dois blocos: primeiro o `DROP` de todas as policies atuais, depois o
`CREATE` fiel de cada uma (comando, papéis, `USING` e `WITH CHECK`).

```sql
-- BLOCO A — drops (gera 1 linha por policy)
SELECT format('DROP POLICY IF EXISTS %I ON %I.%I;',
              policyname, schemaname, tablename)
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- BLOCO B — creates fiéis (gera 1 statement por policy)
SELECT format(
  'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
  policyname, schemaname, tablename,
  CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
  cmd,
  array_to_string(roles, ', '),
  CASE WHEN qual      IS NOT NULL THEN E'\n  USING (' || qual || ')'      ELSE '' END,
  CASE WHEN with_check IS NOT NULL THEN E'\n  WITH CHECK (' || with_check || ')' ELSE '' END
)
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Salvar como `dev/supabase/backups_pre_scope/policies_<AAAA-MM-DD>.sql`
(bloco A + bloco B na ordem).

### 0.2 Índices (para saber o que é pré-existente x o que a migration criou)

```sql
SELECT indexdef || ';'
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Salvar como `dev/supabase/backups_pre_scope/indexes_<AAAA-MM-DD>.sql`.

### 0.3 Definição das views

```sql
SELECT '--- ' || c.relname || E'\n' || pg_get_viewdef(c.oid, true)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v'
ORDER BY c.relname;
```

Salvar como `dev/supabase/backups_pre_scope/views_<AAAA-MM-DD>.sql`.

### 0.4 Ao criar as migrations

- **Fase 1A:** criar `dev/supabase/migrations/20261026_units_clients_ids_compat_DOWN.sql`
  com o bloco do §2.7 (trigger/função, view, índice e coluna `units.clients_ids`).
- **Fase 1D:** criar `dev/supabase/migrations/20261026_client_scope_DOWN.sql`
  contendo **somente** os objetos criados pela 1D (policies, funções, triggers,
  índices e colunas do escopo). **Não** incluir o trigger/função de
  sincronização nem `units.clients_ids`, que pertencem à 1A.
- Anotar no topo de cada migration **exatamente** quais objetos ela cria
  (índices, colunas, policies, views alteradas) — o rollback §2 só remove o que
  a migration criou.
- O §2 deste documento é o rollback **completo** (1A + 1D). Para rollback
  parcial, usar §2.7 (1A) ou, na 1D, remover **apenas** policies/funções/colunas
  do escopo, mantendo `units.clients_ids`, o trigger/função de sincronização, a
  view `v_units_clients` e o índice GIN da 1A.

### 0.5 Rollback por fase (resumo)

| Fase | O que reverter | Onde | Impacto na web antiga |
| :-- | :-- | :-- | :-- |
| **1A** | Trigger/função, view `v_units_clients`, índice GIN e coluna `units.clients_ids` | §2.7 | Nenhum (objetos aditivos) |
| **1B** | Deploy do app novo; banco permanece aditivo | §3 | Nenhum |
| **1C** | Correções de dados (restaurar backup/snapshot); sem rollback de schema | §0 + backup | Nenhum, se os dados forem revertidos |
| **1D** | Policies `client_scope_*`, funções, triggers, índices e colunas de escopo; restaurar snapshot; restaurar a função de sincronização para a versão 1A (se alterada) | §2.1–§2.6 (somente objetos da 1D) | **Sim** — só após aposentadoria da web antiga |
| **5** | `units.client_id` dropado; views/funções redefinidas | §2.6 + backup | **Sim** — exige web antiga aposentada |

> **Regra:** rollback parcial não deve remover objetos de fases posteriores. Ex.:
> rollback da 1D mantém `units.clients_ids` (que é autoritativo); rollback da 1A
> remove a coluna, mas só é seguro enquanto o modo for single-client.

---

## 1. Ordem do rollback (importante)

1. **Banco** (§2) — remove a barreira real primeiro.
2. **App** (§3) — `git revert`/checkout da versão anterior + build.
3. **Estado do cliente** (§3, passo 3) — limpar `localStorage.siges_active_client_id`.
4. **Validação** (§4).

> Todos os comandos do §2 usam `IF EXISTS` / `DROP ... IF EXISTS` — o script é
> idempotente e pode ser reexecutado se algo falhar no meio.

---

## 2. Banco de dados

> **Rollback completo x parcial:** as seções §2.4–§2.6 removem também os
> objetos da Fase 1A (`units.clients_ids`, trigger/função de sincronização,
> índice GIN e view `v_units_clients`). Em um rollback **apenas da Fase 1D**,
> mantenha esses objetos e remova somente as policies, funções, triggers,
> índices e colunas pertencentes ao escopo. A web antiga depende do trigger de
> sincronização enquanto estiver ativa.

### 2.1 Remover TODAS as policies `client_scope_*` (diretas E filhas)

Bloco dinâmico: varre `pg_policies` e remove qualquer policy cujo nome comece
com `client_scope_` em **qualquer** tabela do schema `public`. Cobrem as 6
tabelas diretas (`orders`, `clients`, `units`, `assets`, `contracts`,
`orders_visits`) e **todas** as filhas (`orders_visits_*`, `assets_*`,
`contracts_*`, `orders_*`, `units` etc.) sem depender de lista manual.

```sql
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND policyname LIKE 'client\_scope\_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                   p.policyname, p.tablename);
    RAISE NOTICE 'Removida policy public.%.% (%)',
                 p.tablename, p.policyname, p.cmd;
  END LOOP;
END $$;
```

> Se a migration de escopo usar outro prefixo de nome nas policies, ajustar o
> padrão do `LIKE`. Conferência ao vivo:
> `SELECT * FROM pg_policies WHERE schemaname='public' AND policyname LIKE 'client\_scope\_%';`
> → deve voltar **0 linhas** ao final do rollback.

### 2.2 Restaurar as policies originais

#### 2.2.1 Preferido — script do snapshot (§0.1)

Rodar o arquivo salvo em `backups_pre_scope/policies_<data>.sql` (bloco A +
bloco B). Restaura fielmente **qualquer** política, inclusive as exceções do
§2.2.3.

> Se outras migrations criaram policies **depois** do snapshot, o bloco A
> também as derruba. Nesse caso, regenere o script do §0.1 a partir do estado
> atual e remova manualmente apenas as linhas `client_scope_*` do bloco B.

#### 2.2.2 Fallback (sem snapshot) — recriar `"Universal Access"` nas atingidas

Somente para as tabelas que a migration de escopo **toca** e que usavam
`"Universal Access"` antes. Conferir a lista exata na própria migration (§0.4);
aqui estão as diretas + filhas conhecidas pelo dump de referência
(`dev/supabase/dump_export/list_policies.txt`):

```sql
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    -- diretas (escopo)
    'orders','clients','units','assets','contracts','orders_visits',
    -- filhas de orders / orders_visits
    'orders_followers','orders_statuses_logs',
    'orders_visits_assets','orders_visits_assets_activities',
    'orders_visits_assets_materials','orders_visits_chat',
    'orders_visits_chat_participants','orders_visits_chat_reads',
    'orders_visits_extras','orders_visits_extras_followers',
    'orders_visits_extras_teams','orders_visits_services',
    'orders_visits_teams','orders_visits_vehicles',
    'import_orders_visits_contracts',
    -- filhas de assets
    'assets_alerts','assets_attributes_values','assets_available',
    'assets_followers','assets_materials',
    'technicals_manuals_assets',
    -- filhas de contracts
    'contracts_managers','contracts_services',
    -- filhas de units
    'cfg_units_assets_tags'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'Tabela public.% não existe — pulando', t;
      CONTINUE;
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS "Universal Access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Universal Access" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true)',
      t);
    RAISE NOTICE 'Restaurada "Universal Access" em public.%', t;
  END LOOP;
END $$;
```

> ⚠️ **NÃO incluir** as tabelas do §2.2.3 nesse bloco — elas nunca tiveram
> `"Universal Access"`; recriá-la nelas **mudaria** o comportamento original
> (políticas mais restritivas virariam acesso total).

#### 2.2.3 Exceções — tabelas filhas com policies PRÓPRIAS (restaurar do snapshot)

Estas são filhas de tabelas escopadas mas **não** usam `"Universal Access"`.
Se a migration de escopo as tocou, o rollback delas só é fiel pelo snapshot
(§0.1). Fallback manual: copiar os `CREATE POLICY` originais de
`dev/supabase/schema.sql` (dump 2026-09-23):

| Tabela | Policies originais | Origem |
| :-- | :-- | :-- |
| `orders_visits_evaluations` | `Allow all authenticated {read,insert,update,delete} orders_visits_evaluations` (TO authenticated) | `20260913_enable_rls_evaluation_system.sql` / `schema.sql:19470` |
| `contracts_evaluation_requirements` | `Allow all authenticated {read,insert,update,delete} contracts_evaluation_requirement` (TO authenticated) | `20260913_enable_rls_evaluation_system.sql` / `schema.sql:19463` |
| `cfg_evaluation_requirements` | `Allow all authenticated {read,insert,update,delete} cfg_evaluation_requirements` (TO authenticated) | idem |
| `assets_loans` | `Users can {view,insert,update,delete} asset loans` | `20260915_create_asset_loans.sql` / `schema.sql:20422+` |
| `assets_loans_checklists` | `Users can {view,insert,update,delete} loan checklists` | `20260915_create_asset_loans.sql`, `20261003_enable_rls_assets_loans_checklists.sql` |
| `assets_loans_checklists_images` | `Users can {view,insert,delete} checklist images` | `20260915_create_asset_loans.sql` / `schema.sql:20436+` |
| `cfg_loans_checklists` | `Users can {view,insert,update,delete} loans checklists` | `20260915_create_cfg_loans_checklists.sql` |
| `cfg_assets_types_loans_checklists` | `Users can {view,insert,update,delete} asset type checklist associations` | `20260915_create_asset_loans.sql` |
| `orders_visits_maintenances_plans` | `Authenticated users can read visit maintenance plans` (só SELECT) | `20261023_create_orders_visits_maintenance_plans.sql` (tabela renomeada de `orders_visits_maintenance_plans`) |
| `autonomous_maintenance_plans_executions` (+ `_items`) | `authenticated can {select,insert,update} executions/items` (sem DELETE) | `migrations/autonomous_maintenance_plans_executions.sql` |
| `leader_scores_history` | `Authenticated can read leader_scores_history` (só SELECT) | módulo rankings (**não** escopado — a migration não deve tocar) |

> `cfg_evaluation_requirements` é filha indireta (via `contracts`); `assets_loans`
> e derivadas são filhas de `assets`. Incluídas aqui porque a Fase 1D diz
> "diretas + filhas" — se a migration não as tocar, não há nada a restaurar nelas.

### 2.3 Views

```sql
-- ✅ NÃO fazer: ALTER VIEW public.v_assets_loans SET (security_invoker = false);
```

`v_assets_loans` **já tem `security_invoker = true` desde a migration
`20261003_fix_v_assets_loans_security_invoker.sql`** — que é independente do
plano de escopo. Reverter para `false` desfaria uma correção de segurança
anterior e não faz parte deste rollback. (O item da Fase 1D "Alterar
`v_assets_loans` para `security_invoker = true`" é, na prática, um no-op —
ver nota no plano.)

Se a migration de escopo tiver alterado/criado outras views, restaurar as
definições do snapshot §0.3 com `CREATE OR REPLACE VIEW ... ` + `WITH
(security_invoker = ...)` conforme salvo.

Se a **Fase 1A** criou a view aditiva `v_units_clients`:

```sql
DROP VIEW IF EXISTS public.v_units_clients;
```

Se a **Fase 5** alterou `v_units`/`nearby_units` para calcular `client_id` a
partir de `clients_ids`, restaurar as definições originais do snapshot §0.3
antes de recriar `units.client_id`.

### 2.4 Triggers e funções

Rodar **depois** do §2.1/§2.2 (as policies originais não referenciam as
funções `fc_scope_*`; policies do escopo sim — por isso as policies saem
primeiro).

```sql
DROP TRIGGER IF EXISTS trg_validate_department_clients_ids ON public.cfg_departments;
DROP FUNCTION IF EXISTS public.fn_validate_department_clients_ids();

-- Nome conforme 20261026_units_clients_ids_compat.sql (Fase 1A/1D)
DROP TRIGGER IF EXISTS trg_units_sync_clients_ids ON public.units;
DROP FUNCTION IF EXISTS public.fn_sync_units_clients_ids();

DROP FUNCTION IF EXISTS public.fc_scope_has_resolution();
DROP FUNCTION IF EXISTS public.fc_scope_client_ids();
DROP FUNCTION IF EXISTS public.fc_scope_is_unrestricted();
DROP FUNCTION IF EXISTS public.fc_scope_department_id();
```

> Se a migration criar outras funções/trigger, derrubá-las também (lista exata
> em §0.4).
>
> **Rollback parcial da 1D:** se a 1D substituiu `fn_sync_units_clients_ids`
> pelo modo array-wins, **não** execute os `DROP` do trigger/função de
> sincronização acima. Restaure a versão single-client da Fase 1A
> (`20261026_units_clients_ids_compat.sql`), mantendo `units.clients_ids` e o
> índice GIN. O `DROP` do trigger/função só pertence ao rollback completo
> (1A + 1D).

### 2.5 Índices — SOMENTE os criados pela migration de escopo

```sql
-- Criados pela migration de escopo (confirmar nomes na migration, §0.4):
DROP INDEX IF EXISTS idx_cfg_departments_clients_ids_gin;
DROP INDEX IF EXISTS idx_units_clients_ids_gin;
DROP INDEX IF EXISTS idx_orders_client_id;
DROP INDEX IF EXISTS idx_units_client_id;
DROP INDEX IF EXISTS idx_assets_client_id;
DROP INDEX IF EXISTS idx_contracts_client_id;

-- ⚠️ NÃO dropar idx_assets_alerts_asset_id: é PRÉ-EXISTENTE ao plano de escopo
--    (criado em 20261003_fix_unindexed_fkeys_new_tables.sql). Não listar aqui.
```

> **Regra:** comparar com o snapshot §0.2. Índice que existia antes do escopo
> **nunca** entra no rollback. Se algum nome acima já existia no snapshot,
> remover a linha correspondente.

### 2.6 Colunas (por último)

```sql
ALTER TABLE public.cfg_departments DROP COLUMN IF EXISTS clients_ids;
ALTER TABLE public.units           DROP COLUMN IF EXISTS clients_ids;
```

> **Fase 1A/1B (single-client):** `units.clients_ids` é espelho de
> `units.client_id` via trigger; dropar a coluna não perde dados reais.
> **A partir da Fase 1D/multi-cliente:** `units.clients_ids` passa a ser
> autoritativo. Antes de qualquer drop, faça snapshot e confirme que
> `client_id` não é mais necessário. O rollback da Fase 5 exige restaurar o
> backup, não apenas `clients_ids[1]`.
> `users.department_id` **não** é tocado aqui (a Fase 5 é separada).

### 2.7 Rollback rápido da Fase 1A (sem tocar em policies)

Use **somente** se a Fase 1D ainda não foi aplicada e o modo é single-client.
Se multi-cliente já foi habilitado, faça backup antes.

```sql
DROP TRIGGER IF EXISTS trg_units_sync_clients_ids ON public.units;
DROP FUNCTION IF EXISTS public.fn_sync_units_clients_ids();
DROP VIEW IF EXISTS public.v_units_clients;
DROP INDEX IF EXISTS public.idx_units_clients_ids_gin;
ALTER TABLE public.units DROP COLUMN IF EXISTS clients_ids;
```

> A web antiga continua usando `units.client_id`; nenhum objeto dela é
> alterado. Reverter também o deploy do app novo (Fase 1B).

---

## 3. Aplicação (app)

1. Reverter o código: `git revert` dos commits do escopo (ou checkout do tag/
   commit anterior ao rollout) e novo build/publicação.
2. Validar login e acesso a todos os módulos.
3. Limpar o estado do seletor no navegador dos usuários afetados:
   `localStorage.removeItem('siges_active_client_id');`
   (versões antigas do app ignoram a chave — limpeza é higiene, não bloqueio).

---

## 4. Verificação pós-rollback

### 4.1 SQL

```sql
-- 1) Nenhuma policy de escopo restou (deve retornar 0 linhas)
SELECT * FROM pg_policies
WHERE schemaname = 'public' AND policyname LIKE 'client\_scope\_%';

-- 2) "Universal Access" de volta nas 6 diretas (deve retornar 6 linhas)
SELECT tablename, cmd FROM pg_policies
WHERE schemaname = 'public' AND policyname = 'Universal Access'
  AND tablename IN ('orders','clients','units','assets','contracts','orders_visits');

-- 3) Funções do escopo removidas (deve retornar 0 linhas)
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('fc_scope_has_resolution','fc_scope_client_ids',
                  'fc_scope_is_unrestricted','fc_scope_department_id');

-- 4) Rollback completo (1A+1D): colunas removidas (0 linhas).
--    Rollback só da 1D: units.clients_ids deve permanecer (1 linha).
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'clients_ids';

-- 5) Índice pré-existente intacto (deve retornar 1 linha)
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'idx_assets_alerts_asset_id';

-- 6) v_assets_loans continua com security_invoker = true (NÃO reverter)
SELECT c.relname, reloptions
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'v_assets_loans';
```

### 4.2 App

- [ ] Login (admin e usuário restrito)
- [ ] Módulos escopados: Clientes, Unidades, Ativos, Contratos, OS, Visitas
- [ ] Escrita: criar OS, iniciar/finalizar visita, editar ativo
- [ ] Dashboards e relatórios (Ranking de Líderes incluso — global)
- [ ] Módulos não-escopados: Materiais/Almoxarifados, Veículos, Ferramentas, Usuários, Avisos
- [ ] Seletor de cliente não aparece mais no cabeçalho
- [ ] Console do navegador sem erros 42501 (RLS) / permission denied

---

## 5. Referências

- `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS.md`
- `docs/RUNBOOK_IMPLANTACAO_INCREMENTAL_ESCOPO_CLIENTES.md`
- `dev/supabase/dump_export/list_policies.txt` — inventário de policies pré-escopo
- `dev/supabase/policies/policies.sql` — script master que unifica `"Universal Access"`
- `dev/supabase/migrations/20261003_fix_v_assets_loans_security_invoker.sql`
- `dev/supabase/migrations/20261003_fix_unindexed_fkeys_new_tables.sql` (índice pré-existente)
