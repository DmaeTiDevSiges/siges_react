# Runbook — Implantação incremental do escopo por cliente

> **Status:** EM PLANEJAMENTO — **Gate 2 concluído** (2026-10-27); **Fase 1C em execução** (dados e observação)  
> **Data:** 2026-10-26 (atualizado 2026-10-27)  
> **Plano:** `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS.md`  
> **Rollback:** `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS_ROLLBACK.md`  
> **Objetivo:** implantar `units.clients_ids` e o escopo por cliente em partes, sem downtime e sem interferir na versão antiga web.
>
> ⚠️ **Não executar em produção sem backup/snapshot, janela acordada e autorização explícita.** O SQL abaixo é um rascunho de implantação; validar em ambiente controlado antes.

---

## 1. Princípios

1. **Aditivo primeiro.** Criar coluna, trigger, índice e views novas. Não renomear, não dropar, não mudar tipos/assinaturas de objetos usados pela web antiga.
2. **Um escritor por coluna na transição.**
   - Web antiga escreve `units.client_id`.
   - App novo escreve `units.clients_ids`.
   - Trigger reconcilia os dois em modo single-client.
3. **Multi-cliente desligado** até a Fase 1D (após o Gate 4 / aposentadoria da web antiga).
4. **RLS só depois do Gate 4 (Fase 1D).** Enquanto a web antiga existir, as policies atuais (`"Universal Access"`) permanecem.
5. **Rollback por fase.** A web antiga continua funcionando se o app novo for revertido.
6. **Sem `DROP ... CASCADE`.** A Fase 5 redefine views/funções antes de dropar `units.client_id`.

---

## 2. Inventário de compatibilidade

| Objeto | Quem usa hoje | Durante as Fases 1A/1B/1C |
| :-- | :-- | :-- |
| `units.client_id` | Web antiga, views, funções | Mantido; fonte da web antiga |
| `units.clients_ids` | App novo | Criado na 1A; espelho single-client |
| `v_units` | Web antiga, app atual | **Não alterar** até a Fase 5 (a 1D não muda a view) |
| `fc_units_search*` | Web antiga / API | **Não alterar** até a Fase 5 |
| `nearby_units` | Web antiga / API | **Não alterar** até a Fase 5 |
| Policies `"Universal Access"` | Web antiga e app atual | **Não alterar** até a Fase 1D |
| `assets.client_id` | App atual | **Não usar como fonte de escopo**; escopo via `assets.unit_id` |
| `v_units_clients` | App novo (opcional) | View aditiva; web antiga ignora |

---

## 3. Fase 0 — Preparação

### 3.1 Snapshot e backup

- [ ] Snapshot do banco/Supabase antes de qualquer DDL.
- [ ] Exportar `units`:
  ```sql
  CREATE TABLE IF NOT EXISTS public.backup_units_client_scope_20261026 AS
  SELECT id, client_id, description, is_deleted
  FROM public.units;
  ```
  (Ou `pg_dump -t public.units`; manter até a Fase 5.)
- [ ] Snapshot de policies, índices e views conforme `PLANO_..._ROLLBACK.md` §0.
- [ ] Guardar o build/deploy atual da web antiga para rollback.

### 3.2 Auditoria da web antiga

- [ ] Confirmar que a web antiga **não envia `clients_ids`** em inserts/updates de `units`.
- [ ] Confirmar que ela escreve `client_id` via `unitsService`/payload explícito.
- [ ] Se houver fluxo genérico (`select('*')` + update/upsert do objeto inteiro), testar o trigger com esse payload antes do deploy.
- [ ] Escolher uma unidade de teste e um cliente de teste.

### 3.3 Baseline

```sql
-- Total e nulos
SELECT count(*) AS total,
       count(*) FILTER (WHERE client_id IS NULL) AS sem_cliente
FROM public.units;

-- Clientes inválidos (0/inexistente)
SELECT DISTINCT u.client_id
FROM public.units u
LEFT JOIN public.clients c ON c.id = u.client_id
WHERE u.client_id IS NOT NULL AND c.id IS NULL;

-- Assets sem unidade (para a Fase 1C)
SELECT count(*) FROM public.assets WHERE unit_id IS NULL;
```

---

## 4. Fase 1A — Compatibilidade aditiva

> **Impacto na web antiga:** nenhum. A coluna e o trigger são aditivos; `v_units`, `fc_*`, `nearby_units` e policies não mudam.

### 4.1 Migration `20261026_units_clients_ids_compat.sql`

Executar na ordem. O bloco DDL pode ir em transação; o índice `CONCURRENTLY` deve rodar fora dela.

```sql
-- 0) Evita espera indefinida por lock
SET lock_timeout = '5s';

BEGIN;

-- 1) Coluna aditiva (metadata-only no PG 11+)
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS clients_ids bigint[] NOT NULL DEFAULT '{}'::bigint[];

-- 2) Trigger de compatibilidade (modo single-client)
CREATE OR REPLACE FUNCTION public.fn_sync_units_clients_ids()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Web antiga pode serializar a linha inteira e mandar NULL; normaliza
    IF NEW.clients_ids IS NULL THEN
      NEW.clients_ids := '{}'::bigint[];
    END IF;

    -- Multi-cliente desligado nas Fases 1A/1B (remover na Fase 1D, após o Gate 4)
    IF cardinality(NEW.clients_ids) > 1 THEN
      RAISE EXCEPTION 'Multi-cliente desligado nesta fase (Fase 1A/1B)';
    END IF;

    IF NEW.client_id IS NOT NULL THEN
      -- Web antiga manda no escalar; app novo deve mandar somente o array
      NEW.clients_ids := ARRAY[NEW.client_id]::bigint[];
    ELSIF cardinality(NEW.clients_ids) > 0 THEN
      NEW.client_id := NEW.clients_ids[1];
    END IF;

    RETURN NEW;
  END IF;

  -- UPDATE
  -- Web antiga pode mandar clients_ids NULL ao serializar a linha inteira;
  -- preservar o array atual evita quebrar o fluxo legado.
  IF NEW.clients_ids IS NULL THEN
    NEW.clients_ids := OLD.clients_ids;
  END IF;

  IF NEW.client_id IS DISTINCT FROM OLD.client_id
     AND cardinality(OLD.clients_ids) > 1
     AND NEW.clients_ids IS NOT DISTINCT FROM OLD.clients_ids THEN
    RAISE EXCEPTION 'Unidade % tem múltiplos clientes; edite na versão nova', OLD.id;
  END IF;

  IF cardinality(NEW.clients_ids) > 1 THEN
    RAISE EXCEPTION 'Multi-cliente desligado nesta fase (Fase 1A/1B)';
  END IF;

  IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
    -- Escrita da web antiga (ou de fluxo legado que ainda usa o escalar)
    NEW.clients_ids := CASE
      WHEN NEW.client_id IS NULL THEN '{}'::bigint[]
      ELSE ARRAY[NEW.client_id]::bigint[]
    END;
  ELSIF NEW.clients_ids IS DISTINCT FROM OLD.clients_ids THEN
    -- Escrita do app novo (somente array)
    NEW.client_id := CASE
      WHEN cardinality(NEW.clients_ids) > 0 THEN NEW.clients_ids[1]
      ELSE NULL
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_units_sync_clients_ids ON public.units;
CREATE TRIGGER trg_units_sync_clients_ids
BEFORE INSERT OR UPDATE OF client_id, clients_ids ON public.units
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_units_clients_ids();

-- 3) Backfill (419 unidades; idempotente)
UPDATE public.units
SET clients_ids = ARRAY[client_id]::bigint[]
WHERE client_id IS NOT NULL
  AND cardinality(clients_ids) = 0;

COMMIT;
```

> **Regra de ouro:** o app novo **não envia `client_id`** no payload. Ele envia somente `clients_ids`. O trigger preenche `client_id` para a web antiga.
>
> **Não reexecutar a migration da 1A depois da 1D:** ela recria
> `fn_sync_units_clients_ids` no modo single-client e sobrescreveria a versão
> array-wins. A 1D é a única fase que deve substituir essa função.

### 4.2 Índice GIN

> Com 419 unidades, um `CREATE INDEX` normal dentro da transação é rápido. Use
> `CONCURRENTLY` apenas se quiser evitar qualquer lock de escrita — e, nesse
> caso, execute o comando **sozinho**, fora da transação. No SQL Editor do
> Supabase, rodar o bloco DDL e o índice em execuções separadas.

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_clients_ids_gin
  ON public.units USING GIN (clients_ids);
```

Se falhar (transação concorrente), dropar e repetir:

```sql
DROP INDEX CONCURRENTLY IF EXISTS public.idx_units_clients_ids_gin;
```

### 4.3 View aditiva opcional `v_units_clients`

```sql
CREATE OR REPLACE VIEW public.v_units_clients
WITH (security_invoker='true') AS
SELECT
  u.id AS unit_id,
  u.clients_ids,
  COALESCE(
    array_agg(c.name ORDER BY c.name) FILTER (WHERE c.id IS NOT NULL),
    '{}'::text[]
  ) AS client_names
FROM public.units u
LEFT JOIN public.clients c ON c.id = ANY(u.clients_ids)
GROUP BY u.id, u.clients_ids;

-- Seguir o padrão de grants das views existentes. Exemplo:
GRANT SELECT ON public.v_units_clients TO anon, authenticated;
```

Se a view/coluna não aparecer na API:

```sql
NOTIFY pgrst, 'reload schema';
```

### 4.4 Validação

```sql
-- 1) Divergências (deve retornar 0)
SELECT count(*) AS divergencias
FROM public.units
WHERE client_id IS NOT NULL
  AND (cardinality(clients_ids) <> 1 OR clients_ids[1] <> client_id);

-- 2) Escalar nulo com array preenchido (deve retornar 0)
SELECT count(*) AS escalar_nulo_array_preenchido
FROM public.units
WHERE client_id IS NULL AND cardinality(clients_ids) > 0;

-- 3) NULL dentro do array (deve retornar 0)
SELECT count(*) AS null_no_array
FROM public.units
WHERE EXISTS (SELECT 1 FROM unnest(clients_ids) x WHERE x IS NULL);

-- 4) Clientes inválidos (levantar para a Fase 1C)
SELECT DISTINCT u.client_id
FROM public.units u
LEFT JOIN public.clients c ON c.id = u.client_id
WHERE u.client_id IS NOT NULL AND c.id IS NULL;

-- 5) Unidades sem cliente (esperado: 73 hoje)
SELECT count(*) AS sem_cliente
FROM public.units
WHERE client_id IS NULL;
```

### 4.5 Smoke tests da web antiga

- [ ] Login.
- [ ] Lista de unidades.
- [ ] Editar uma unidade de teste: trocar o cliente A → B e salvar.
- [ ] Confirmar no banco:
  ```sql
  SELECT id, client_id, clients_ids
  FROM public.units
  WHERE id = <unidade_teste>;
  ```
  Esperado: `client_id = B`, `clients_ids = {B}`.
- [ ] Lista de ativos, ordens, visitas e manuais.
- [ ] Criar/editar uma OS ou visita que use unidade.
- [ ] Console sem erros 42501/permission denied.

### 4.6 Rollback da Fase 1A

```sql
DROP TRIGGER IF EXISTS trg_units_sync_clients_ids ON public.units;
DROP FUNCTION IF EXISTS public.fn_sync_units_clients_ids();
DROP VIEW IF EXISTS public.v_units_clients;
DROP INDEX IF EXISTS public.idx_units_clients_ids_gin;
ALTER TABLE public.units DROP COLUMN IF EXISTS clients_ids;
```

> Na 1A/1B o `clients_ids` é espelho de `client_id`; dropar a coluna não perde dados reais. Se multi-cliente já tiver sido habilitado, **não** usar este rollback sem backup.

### 4.7 Gate 1

> **Gate 1 CONCLUÍDO** (2026-10-27): Fase 1A validada. Migração `20261026_units_clients_ids_compat.sql` aplicada; 0 divergências; smoke tests da web antiga OK; rollback testado. Liberado para iniciar Fase 1B.

- [x] 0 divergências.
- [x] 0 `NULL` dentro do array.
- [x] Smoke tests da web antiga OK.
- [x] Rollback da 1A testado em ambiente controlado.
- [x] Nenhum objeto `v_units`/`fc_*`/`nearby_units`/policy alterado.

---

## 5. Fase 1B — App novo em modo single-client

> **Impacto na web antiga:** nenhum. O app novo é deployado em preview/canário e escreve somente `clients_ids`; o trigger mantém `client_id` para a web antiga.

### 5.1 Código

- [ ] `types/index.ts`
  - Adicionar `clientsIds: string[]` em `Unit`.
  - Manter `clientId?: string` como legado derivado.
- [ ] `services/core/unitsService.ts`
  - `searchUnits`: selecionar `clients_ids`; mapear `clientsIds` e `clientId = clients_ids[0]`.
  - `getUnitById`: buscar clientes por `clients_ids`; `clientName` agregado (para exibição).
  - `createUnit`: payload **somente** `clients_ids` (não enviar `client_id`).
  - `updateUnit`: payload **somente** `clients_ids`.
  - `getUnitsWithCoordinates`/`getUnits`/`getFilteredUnits`: incluir `clients_ids`; se algum caller usa `client_id`, derivar `client_id = clients_ids[0]` no mapping.
- [ ] `services/companies/companiesService.ts`
  - `getUnitsByClient`: `.contains('clients_ids', [Number(clientId)])`; guardar `clientId` vazio.
- [ ] `views/Settings/Clients/Units/UnitForm.tsx`
  - Single-select nesta fase; salvar `clientsIds: [cliente]`.
  - Não enviar `clientId` separado para o serviço.
- [ ] `views/Units/UnitsSearch.tsx`
  - Mapear `clientsIds`; exibir nomes via `clients`/`v_units_clients`.
- [ ] `views/Settings/SettingsRouter.tsx`
  - `selectedUnit?.clientsIds?.[0]` como fallback.
- [ ] `views/ServiceRequest/ServiceRequestForm.tsx`
  - Fallback `units.find(u => u.clientsIds?.includes(formData.clientId))`.
- [ ] Feature flag
  - `MULTI_CLIENT_UNITS=false` (UI multi-cliente desligada).
- [ ] Não alterar `v_units`, `fc_*`, `nearby_units` nem policies.

### 5.2 Regras de escrita

| Fluxo | Payload | Trigger |
| :-- | :-- | :-- |
| Web antiga edita cliente | `client_id = B` | `clients_ids = {B}` |
| App novo edita cliente | `clients_ids = {B}` | `client_id = B` |
| App novo cria unidade | `clients_ids = {B}` | `client_id = B` |
| Web antiga cria unidade | `client_id = B` | `clients_ids = {B}` |
| Web antiga limpa cliente | `client_id = NULL` | `clients_ids = {}` |

### 5.3 Deploy direto (sem canário)

> **Nota:** não haverá deploy em preview/canário. O app novo será implantado diretamente para todos os usuários. Como a Fase 1B é aditiva no banco (coluna/trigger/índice já existem da Fase 1A), o risco é limitado: a web antiga continua usando `client_id` e o trigger mantém a sincronia.

- [ ] Fazer build e deploy do app novo para produção (mesmo Supabase da web antiga).
- [ ] Testar login, unidades, ativos, ordens, visitas e manuais.
- [ ] Criar uma unidade de teste pelo app novo; confirmar na web antiga.
- [ ] Editar a unidade de teste pela web antiga; confirmar no app novo.
- [ ] Monitorar erros/console e logs do Supabase nas primeiras horas após o deploy.

### 5.4 Rollback da Fase 1B

- [ ] Reverter o deploy do app novo para o build anterior.
- [ ] Manter a coluna/trigger/índice (aditivos).
- [ ] A web antiga continua funcionando; nenhum dado é perdido.

### 5.5 Gate 2

> **Gate 2 CONCLUÍDO** (2026-10-27): Fase 1B validada. App novo escreve `clients_ids` em modo single-client. Deploy direto sem canário. Liberado para iniciar Fase 1C.

- [x] Canário sem erros. (deploy direto, sem canário)
- [x] 0 divergências `client_id` x `clients_ids`.
- [x] Web antiga com fluxos críticos OK.
- [x] `MULTI_CLIENT_UNITS=false`.
- [x] Nenhum objeto compartilhado alterado.

---

## 6. Fase 1C — Dados e observação (pré-escopo)

> **Impacto na web antiga:** nenhum de schema. Correções de dados podem mudar a exibição; comunicar e testar.

### 6.1 Pendências de dados

> **Efeito esperado no app novo:** unidades com `clients_ids = '{}'` (73 hoje) e
> os ativos vinculados a elas não aparecem em `getUnitsByClient`. A web antiga
> continua exibindo. Resolver ou aceitar explicitamente antes de ampliar o uso
> do app novo.

```sql
-- 73 unidades sem cliente (lista para decisão)
SELECT id, code, description
FROM public.units
WHERE client_id IS NULL
ORDER BY description;

-- Clientes inválidos
SELECT DISTINCT u.client_id, count(*) AS unidades
FROM public.units u
LEFT JOIN public.clients c ON c.id = u.client_id
WHERE u.client_id IS NOT NULL AND c.id IS NULL
GROUP BY u.client_id;

-- Assets sem unidade
SELECT count(*) AS assets_sem_unidade
FROM public.assets
WHERE unit_id IS NULL;

-- Orders nulos/0/divergentes
SELECT
  count(*) FILTER (WHERE o.client_id IS NULL) AS nulos,
  count(*) FILTER (WHERE o.client_id = 0) AS zero,
  count(*) FILTER (WHERE u.client_id IS NOT NULL AND o.client_id IS DISTINCT FROM u.client_id) AS divergentes
FROM public.orders o
LEFT JOIN public.units u ON u.id = o.unit_id;

-- Departamentos sem clients_ids (quando a coluna existir na 1D)
-- SELECT id, description FROM public.cfg_departments WHERE clients_ids IS NULL OR clients_ids = '{}';
```

### 6.2 Decisões

- [ ] As 73 unidades serão mapeadas para pelo menos 1 cliente ou ficarão admin-only?
- [ ] `client_id` inválido (`0`/inexistente) será corrigido ou tratado como vazio?
- [ ] Assets sem `unit_id` terão unidade atribuída ou fallback temporário?
- [ ] Orders nulos/0/divergentes serão corrigidos antes do RLS?
- [ ] `clients_ids = '{}'` significa **sem acesso** (recomendado) e não "todos".

### 6.3 Observação

- [ ] Rodar a query de divergências diariamente por 1–2 semanas.
- [ ] Monitorar logs do Supabase/PostgREST.
- [ ] Comparar listas de unidades/ativos entre web antiga e app novo.
- [ ] Não ligar RLS.

### 6.4 Gate 3

- [ ] Pendências acima resolvidas ou explicitamente aceitas.
- [ ] 0 divergências.
- [ ] 1–2 semanas de convivência sem incidentes.
- [ ] Rollback da 1A/1B ainda viável.

---

## 7. Fase 1D — Escopo real (somente após aposentar a web antiga)

> **Impacto na web antiga:** **alto** — RLS/policies passam a filtrar todas as requisições, inclusive da web antiga. Só executar com o Gate 4 aprovado.

### 7.1 Gate 4

- [ ] Web antiga sem tráfego (ou compatibilidade explicitamente validada).
- [ ] Snapshot de policies/views/índices conforme rollback §0.
- [ ] Rollback da 1D escrito e testado.
- [ ] Comunicação aos usuários sobre o seletor de cliente.

### 7.2 Migration `20261026_client_scope.sql`

Conteúdo conforme o plano principal, Fase 1D:

- [ ] Substituir `fn_sync_units_clients_ids` pelo modo **array-wins** (permite multi-cliente; remove o guard da Fase 1A/1B).
- [ ] `cfg_departments.clients_ids` + `CHECK` + GIN + trigger de validação.
- [ ] Funções `fc_scope_*`.
- [ ] Índices em `client_id` (`orders`, `units`, `assets`, `contracts`, `assets_alerts`).
- [ ] Substituição das policies `"Universal Access"` por policies `client_scope_*`.
- [ ] Policies em tabelas diretas + filhas, com os predicados do plano principal (`units` via `clients_ids &&`, `assets` via `unit_id`, `orders` via `client_id`).
- [ ] `v_assets_loans` já está `security_invoker=true`; não reverter.

### 7.3 Ordem de ativação

1. Aplicar a migration de banco (inclui o trigger array-wins).
2. Rodar testes REST com token restrito.
3. Ativar `ActiveClientProvider`/`ClientSelector` no app novo.
4. Ativar `ActiveClientGuard` nas rotas escopadas.
5. Habilitar multi-cliente em `UnitForm` somente depois da migration 1D (trigger array-wins), restrito a Admin/Super Admin (proposta).
6. Monitorar erros 42501/permission denied.
7. Expandir para todos os usuários.

### 7.4 Rollback da Fase 1D

Seguir `PLANO_..._ROLLBACK.md` §2:

- [ ] Remover policies `client_scope_*`.
- [ ] Restaurar policies do snapshot.
- [ ] Dropar funções/triggers/índices/colunas **do escopo**.
- [ ] Restaurar `fn_sync_units_clients_ids` para a versão single-client da Fase 1A, se a 1D a tiver substituído pelo modo array-wins.
- [ ] **Não** dropar `units.clients_ids`, o trigger de sincronização nem o índice GIN no rollback parcial da 1D.
- [ ] Reverter o app para o build anterior.
- [ ] Limpar `localStorage.siges_active_client_id` nos navegadores afetados.

### 7.5 Gate 4 concluído

- [ ] Policies de escopo ativas e testadas.
- [ ] Web antiga aposentada.
- [ ] App novo com seletor de cliente funcionando.
- [ ] Rollback validado.

---

## 8. Fase 5 — Limpeza e remoção de `units.client_id`

> **Pré-requisito:** Gate 5. A web antiga não existe mais; nenhum fluxo lê/escreve `units.client_id`. `clients_ids` é autoritativo.

### 8.1 Sequência segura (sem `CASCADE`)

1. **Backup/snapshot** de `units(id, client_id)` e das definições de `v_units`/`nearby_units`/`fc_*`.
2. **Redefinir `v_units`** para calcular `client_id` a partir de `clients_ids` **antes** de dropar a coluna. A view mantém as mesmas colunas, tipos e ordem; `fc_*` continuam válidas.
   - `client_id = (units.clients_ids)[1]` (bigint).
   - `client_name` pode ser agregado (`string_agg(...)::character varying`) ou mantido como o primeiro cliente; o app novo deve usar `v_units_clients`/lista.
   - Manter `WITH (security_invoker='true')`.
3. **Redefinir `nearby_units`** com `(u.clients_ids)[1]` no lugar de `u.client_id`; mesmo return type, então `CREATE OR REPLACE FUNCTION` é permitido.
4. **Dropar a coluna:**
   ```sql
   ALTER TABLE public.units DROP COLUMN client_id;
   ```
   Sem `CASCADE`: a view e a função já não dependem dela.
5. **Validar:**
   ```sql
   SELECT * FROM public.v_units LIMIT 1;
   SELECT * FROM public.fc_units_search('teste', 'live') LIMIT 1;
   SELECT * FROM public.fc_units_search_filters(...) LIMIT 1;
   SELECT * FROM public.nearby_units(-23.55, -46.63) LIMIT 1;
   ```
6. **Opcional:** remover `client_id`/`client_name` de `v_units` e `nearby_units`. Isso muda o return type de `fc_*`; exige `DROP FUNCTION` + recriação. Fazer em migration separada, depois de confirmar que nenhum consumidor externo usa essas colunas.

> **Limitação:** `v_units.client_id = (clients_ids)[1]` é uma projeção legada.
> `fc_units_search*` continuam funcionando para buscas single-client, mas não
> expandem unidades multi-cliente. O app novo deve filtrar por `clients_ids`/
> `v_units_clients`; para busca multi-cliente via `fc_*`, redefinir as funções.

### 8.2 Rollback da Fase 5

```sql
ALTER TABLE public.units ADD COLUMN client_id bigint;
UPDATE public.units
SET client_id = (clients_ids)[1]
WHERE client_id IS NULL;
```

Depois, restaurar as definições de `v_units`/`nearby_units` do snapshot. Se os valores originais de `client_id` importarem (multi-cliente/ordem), restaurar do backup, não apenas `clients_ids[1]`.

### 8.3 Limpeza de `users.department_id`

- [ ] Verificar divergências `users.department_id` x `cfg_teams.department_id`.
- [ ] Backup se houver divergências.
- [ ] Dropar `users.department_id` em migration separada.
- [ ] Atualizar `dev/supabase/schema.sql`.

---

## 9. Monitoramento

### 9.1 Consistência (Fases 1A/1B/1C)

```sql
SELECT count(*) AS divergencias
FROM public.units
WHERE client_id IS NOT NULL
  AND (cardinality(clients_ids) <> 1 OR clients_ids[1] <> client_id);

SELECT count(*) AS escalar_nulo_array_preenchido
FROM public.units
WHERE client_id IS NULL AND cardinality(clients_ids) > 0;
```

### 9.2 Logs

- Erros do trigger (`RAISE EXCEPTION`) no Supabase.
- Erros 42501/permission denied após a Fase 1D.
- PostgREST schema cache: `NOTIFY pgrst, 'reload schema';` se novos objetos não aparecerem.
- Performance de `getUnitsByClient` com índice GIN.

### 9.3 Web antiga

- [ ] Login, unidades, ativos, ordens, visitas, manuais.
- [ ] Criar/editar unidade e conferir `client_id`/`clients_ids`.
- [ ] Nenhum erro de permissão antes da Fase 1D.

---

## 10. Matriz de rollback

| Fase | Banco | App | Web antiga |
| :-- | :-- | :-- | :-- |
| 1A | Dropar trigger/função, view, índice e coluna `clients_ids` | Nenhum | Ilesa |
| 1B | Nenhum (aditivo) | Reverter deploy | Ilesa |
| 1C | Restaurar dados do backup | Nenhum | Ilesa (se dados revertidos) |
| 1D | Remover policies/funções/colunas do escopo; restaurar snapshot; restaurar função de sincronização 1A, se alterada | Reverter app | **Afetada** — só após aposentadoria |
| 5 | Restaurar backup; recriar `units.client_id`; restaurar views/funções | Reverter app | **Afetada** — só após aposentadoria |

---

## 11. Referências

- `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS.md`
- `docs/PLANO_ESCOPOS_POR_CLIENTE_VIA_DEPARTAMENTOS_ROLLBACK.md`
- `dev/supabase/schema.sql`
- `dev/supabase/dump_export/list_policies.txt`
- `services/core/unitsService.ts`
- `services/companies/companiesService.ts`
