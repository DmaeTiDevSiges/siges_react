# Auditoria de Banco de Dados — SIGES

> **Feature**: registro automático de inclusões, alterações e exclusões de registros
> nas tabelas de negócio, com tela de consulta para administradores.
> **Versão do fluxo**: audit-log v1.0.0 · **Data**: 2026-10-31

---

## 1. Visão geral

O SIGES passa a registrar cada `INSERT`, `UPDATE` e `DELETE` relevante em uma tabela
própria de auditoria (`public.audits_logs`), capturando **quem** fez, **quando**, **em
qual tabela** e **o que mudou** (com snapshot antes → depois).

| Pergunta | Resposta |
|---|---|
| Onde é gravado? | Tabela `public.audits_logs` (reativada do sistema legado) |
| Como é gravado? | Triggers `AFTER INSERT OR UPDATE DELETE` no banco (função `fc_audit_log()`) |
| Por que no banco e não no app? | A app não tem camada central de mutação — cada serviço chama o Supabase direto; há escritas via RPCs, imports e n8n. Só o banco captura **todas** as origens. |
| Quem pode ver? | Super admin (bypass) + perfis com a permissão da rota `audit_log` |
| Onde consultar no app? | **Ajustes → Acesso e Segurança → Auditoria** |

---

## 2. Arquitetura

```
App (services/*) · RPCs · n8n · SQL manual
                 │
                 ▼  (qualquer escrita)
   tabela auditada (ex.: orders)
                 │
                 ▼  trigger trg_audit_<tabela>  (AFTER I/U/D, per row)
          public.fc_audit_log()          ← SECURITY DEFINER
                 │  · autoria: auth.uid() → users.id
                 │  · ignora UPDATE só de updated_at/updated_user_id
                 │  · redige colunas sensíveis ([REDACTED])
                 ▼
          public.audits_logs             ← RLS: leitura p/ authenticated,
                                           escrita SÓ via trigger
                 │
                 ▼
   views/Settings/Audit/AuditLogList.tsx  (filtros + diff antes→depois)
```

### Decisões de design

1. **Reutilização da tabela legada** — `audits_logs` existia vazia e órfã desde o
   sistema anterior (Databasus), com o shape quase exato do necessário.
2. **Padrão de trigger** — seguido do precedente de produção
   `fc_orders_statuses_logs()` (SECURITY DEFINER + `SET search_path` + autoria via
   `auth.uid()` com fallback NULL).
3. **Sem retenção nesta fase** — crescimento contínuo por decisão registrada;
   os índices deixam um `DELETE` manual futuro simples.
4. **Realtime intocado** — triggers `AFTER` não alteram o payload dos canais
   existentes; `audits_logs` **não** foi adicionada à publicação `supabase_realtime`.

---

## 3. Banco de dados (migrations)

As migrations são aplicadas **manualmente no SQL Editor do Supabase**, nesta ordem:

| # | Arquivo | O que faz |
|---|---|---|
| 1 | `dev/supabase/migrations/20261046_reactivate_audits_logs.sql` | Prepara a tabela |
| 2 | `dev/supabase/migrations/20261047_create_audit_triggers.sql` | Função + triggers |
| 3 | `dev/supabase/migrations/20261048_add_audit_log_route.sql` | Rota `audit_log` |
| 4 | `dev/supabase/migrations/20261049_use_user_id_in_audits_logs.sql` | `user_uuid` → `user_id` (FK) |
| 5 | `dev/supabase/migrations/20261050_manage_audited_tables.sql` | Configuração protegida das tabelas e RPCs para gerenciar triggers |

Cada uma tem seu `_DOWN.sql` correspondente (reversível; dados já gravados são
preservados — remoção de histórico é decisão operacional).

> A migration 20261050 deve ser aplicada depois da 20261049. Sem ela, o formulário
> de configuração não estará disponível no banco, embora a tela de auditoria continue
> funcionando.

### 3.1 `20261046` — Tabela

- Novas colunas: `record_id text` (PK do registro auditado), `schema_name text`,
  `origin text` (reservado).
- `table_name` e `operation` passam a `NOT NULL` (seguro: tabela vazia).
- Default de `created_date` alterado para `America/Sao_Paulo` — regra de fuso do
  projeto: *timestamp sem offset = horário local de SP*.
- Índices: `(table_name, id DESC)`, `(user_uuid, id DESC)` *(recriado em `user_id`
  pela 20261049)*, `(created_date DESC)`, `(table_name, record_id)`.
- **RLS endurecido**: sai a policy "Universal Access" (permitia escrita de qualquer
  client); entra `authenticated_read` (SELECT apenas) + `REVOKE` de DML para
  `anon`/`authenticated`.

### 3.2 `20261047` — Função e triggers

`public.fc_audit_log()` (plpgsql, SECURITY DEFINER):

- **Autoria**: `auth.uid()` → `users.uuid` → `users.id` gravado em `user_id`
  (coluna única de autoria desde a 20261049 — `user_uuid` foi removida).
  Escritores sem JWT (n8n, imports, jobs, SQL manual) ficam com `NULL` — visível na
  tela como "Sistema / sem sessão".
- **Anti-ruído**: `UPDATE` que só altera `updated_at`/`updated_user_id` **não**
  gera linha de auditoria (comparação dos jsonb sem essas colunas).
- **Redação**: colunas sensíveis (`password`, `token`, `secret`, `api_key`,
  `impersonation_password_backup`, ...) são gravadas como `[REDACTED]`.
- Grava `data_old` (DELETE/UPDATE) e `data_new` (INSERT/UPDATE) como `jsonb`.

Triggers: um por tabela, `trg_audit_<tabela>`, `AFTER INSERT OR UPDATE DELETE
FOR EACH ROW`, instalados por loop idempotente (só instala se a tabela existir;
tabelas ausentes geram `RAISE NOTICE`, não erro).

### 3.3 Escopo de tabelas (74 tabelas configuráveis)

**Auditadas**: ordens e visitas (`orders*`), ativos (`assets*`), materiais e
almoxarifado (`materials*`, `warehouses*`, `carts_materials`), usuários e
ferramentas (`users`, `tools`), unidades/clientes/contratos (`units`, `clients`,
`contracts*`), veículos (`vehicles*`), perfis/rotas (`cfg_profiles*`, `cfg_routes`)
e configurações de negócio (`cfg_*`).

**Fora do escopo** (alto volume/ruído ou já são logs): `orders_visits_chat*`,
`users_notifications`, `users_tracker`, `ai_*`, gamification (`leader_*`),
`logs_api`, `orders_statuses_logs`, a própria `audits_logs`.

> A lista vive no array `audited_tables` da migration 20261047 — para incluir uma
> tabela nova na instalação inicial, adicione o nome na migration **e** em
> `AUDITED_TABLES` em `types/index.ts` (labels da tela). A migration 20261050 mantém
> a allowlist usada pela tela de configuração; para suportar uma tabela nova em um
> banco já implantado, uma migration futura deve inserir o nome em
> `public.cfg_audits_tables` após validar que é uma tabela de negócio segura para
> auditoria. O formulário em **Ajustes → Acesso e Segurança → Tabelas auditadas**
> permite ao super admin ativar/desativar os triggers das tabelas dessa allowlist.
> Desativar a captura não exclui registros já gravados em `audits_logs`.

### 3.4 `20261048` — Rota de permissão

- `cfg_routes`: `route_key = 'audit_log'`, parent = `settings`,
  `is_visible_to_admin = false` (gerenciada pelo super admin na matriz de permissões).
- Negada por padrão: sem grant, só o super admin vê (bypass em `PermissionsContext`).
- Para conceder a um perfil, descomente o bloco final da migration.

### 3.5 `20261049` — `user_uuid` → `user_id` (FK)

- **O que muda**: a autoria passa a ser a coluna única `user_id`, com
  `FOREIGN KEY → public.users(id)` (`ON DELETE SET NULL`); a coluna
  `user_uuid` é removida.
- **Por quê**: `users.id` (bigint) é a PK canônico do projeto e `user_uuid` era
  redundante (sempre derivável de `users.uuid`). A FK também habilita join
  embutido no PostgREST — sem ela a query `user:user_id(...)` falhava com
  `PGRST200` (*"Could not find a relationship"*).
- **Ordem interna** (importante): backfill de `user_id` → criação da FK →
  `CREATE OR REPLACE` da função **sem** `user_uuid` → `DROP COLUMN` → índice
  recriado em `(user_id, id DESC)`. Trocar a ordem quebraria as triggers.
- `ON DELETE SET NULL`: excluir usuário nunca bloqueia e nunca apaga histórico —
  apenas zera a autoria.
- **Backfill guardado** por existência da coluna: a UP é **re-executável**
  (2ª rodada não tenta ler `user_uuid` já removida).
- **Fecha lacuna de `anon`**: o `GRANT ALL` legado concedia `SELECT` a `anon` e a
  20261046 só revogava o DML — o grant permanecia exposto no catálogo (a RLS já o
  neutralizava na prática). Agora: `REVOKE ALL ... FROM anon`.
- O app continua resolvendo o nome numa segunda query (`auditService`), então a
  tela funciona **mesmo antes** de aplicar esta migration.

### 3.6 `20261050` — Configurar tabelas auditadas

- Cria `public.cfg_audits_tables` como allowlist das 74 tabelas já gerenciadas
  pela auditoria, inicializando o estado a partir dos triggers existentes.
- `get_audit_table_config()` lista o estado real dos triggers e indica tabelas
  que não existem no banco atual.
- `set_audit_table_config(jsonb)` aplica todas as mudanças numa única transação:
  instala ou remove `trg_audit_<tabela>` e atualiza o estado de configuração.
- Ambos os RPCs verificam `users.uuid = auth.uid()` e
  `users.is_admin_super = true`. O acesso direto à tabela de configuração fica
  revogado para `PUBLIC`, `anon` e `authenticated`.
- Desativar a auditoria de uma tabela afeta somente gravações futuras; não apaga
  eventos existentes em `audits_logs`.
- A migration DOWN remove tabela/RPCs sem recriar triggers nem apagar o histórico.

---

## 4. App (React)

| Arquivo | Papel |
|---|---|
| `services/core/auditService.ts` | Consulta de eventos e leitura/atualização da configuração via RPC |
| `services/dataService.ts` | Proxies tipados de auditoria na fachada pública |
| `types/index.ts` | Tipos de log/configuração, operações, labels e allowlist da UI |
| `views/Settings/Audit/AuditLogList.tsx` | Tela de consulta |
| `views/Settings/Audit/AuditTablesConfig.tsx` | Formulário de tabelas auditadas, exclusivo do super admin |
| `views/Settings/SettingsRouter.tsx` | `case 'audit-log'` + `AuditLogGate` (permissão) |
| `views/Settings/AppSettings.tsx` | Atalho de consulta por permissão e atalho de configuração para super admin |
| `app/routes.tsx` + `App.tsx` | Lazy load + união `Screen` + back handler |

### Tela de consulta

- **Filtros**: tabela (labels amigáveis), operação (Inclusão/Alteração/Exclusão),
  período (de/até), busca por tabela ou `record_id`.
- **Lista**: paginação de 20/página (mais recente primeiro), badge da operação,
  tabela, registro `#id`, autor e data/hora (`formatDateInBrazil` — fuso de SP).
- **Detalhe (modal)**: metadados completos (incl. `users.id` do autor) e **tabela de diff** —
  em UPDATE mostra apenas os campos que mudaram, com antes (vermelho) → depois
  (verde); em INSERT/DELETE mostra todos os campos do snapshot.

---

## 5. Segurança

- **Escrita**: impossível via client — RLS sem policy de INSERT/UPDATE/DELETE e
  `REVOKE` de DML para `anon`/`authenticated`; só a função SECURITY DEFINER dos
  triggers grava (validado: escrita direta retorna `permission denied`).
- **Leitura**: apenas `authenticated` + policy SELECT; no app, gate `AuditLogGate`
  (`canView('audit_log')`) e item de menu condicionado.
- **Configuração de triggers**: apenas super admin; as RPCs verificam essa função
  no banco, além do gate visual da tela. A allowlist impede usar o formulário para
  instalar triggers em tabelas arbitrárias.
- **Impersonation** (`impersonateUser`): o `auth.uid()` da sessão é o usuário
  impersonado — o log registra a sessão efetiva (decisão conhecida).
- **Colunas sensíveis**: redigidas na gravação (ver §3.2).

---

## 6. Operação

### Limpeza/manual (sem retenção automática)

```sql
-- Exemplo: remover eventos com mais de 12 meses
DELETE FROM public.audits_logs
WHERE created_date < (TIMEZONE('America/Sao_Paulo', now()) - INTERVAL '12 months');
```

### Conferir se a auditoria está ativa

```sql
-- Triggers instalados
SELECT tgname FROM pg_trigger
WHERE tgname LIKE 'trg_audit_%' AND NOT tgisinternal
ORDER BY tgname;

-- Últimos eventos
SELECT id, created_date, table_name, operation, record_id, user_id
FROM public.audits_logs ORDER BY id DESC LIMIT 50;
```

### Adicionar tabela ao escopo (futuro)

1. Migration: adicionar o nome ao array em `20261047_create_audit_triggers.sql`
   (ou criar migration nova com o mesmo loop) e re-executar.
2. App: adicionar `{ key, label }` em `AUDITED_TABLES` (`types/index.ts`).

---

## 7. Rollback

Na ordem inversa, via arquivos `_DOWN.sql`:

1. `20261049_use_user_id_in_audits_logs_DOWN.sql` — remove a FK, restaura
   `user_uuid` + índice + função (backfill inverso).
2. `20261048_add_audit_log_route_DOWN.sql` — remove grants + rota.
3. `20261047_create_audit_triggers_DOWN.sql` — dropa triggers + função
   (**preserva** as linhas já auditadas).
4. `20261046_reactivate_audits_logs_DOWN.sql` — remove colunas/índices, restaura
   policy "Universal Access" e grants originais.

> Rode os DOWNs em ordem: o 1049 precisa devolver `user_uuid` antes de a função
> legada passar a referenciá-la; e o 1046 depende dos triggers já removidos (senão
> nada mais escreve na tabela e o restablecimento do RLS antigo fica inconsistente).

---

## 8. Validação executada (2026-10-31)

Testado em PostgreSQL 18 local (instância efêmera) com roles Supabase simuladas:

- ✅ 3 migrations aplicam sem erro; re-execução é idempotente (sem duplicar triggers).
- ✅ `20261049` valida o ciclo completo **UP → re-UP → DOWN → re-UP** em PG 17 local
  (banco descartável, 16 asserções): FK criada, `user_uuid` removido, backfill nos
  dois sentidos, índices, anti-ruído, redação, autor `NULL` sem JWT e RLS.
- ✅ INSERT/UPDATE/DELETE geram 3 linhas com autor correto (`user_id` → `users.id`).
- ✅ UPDATE "touch" (só `updated_at`/`updated_user_id`) **não** gera linha.
- ✅ Colunas sensíveis gravam `[REDACTED]`.
- ✅ Escritores sem JWT gravam com autor `NULL`.
- ✅ `authenticated` lê o log; escrita direta falha (`permission denied`).
- ✅ Ciclo completo DOWN → UP re-aplicável.
- ✅ `npx jest`: 302/302 testes do projeto + 6/6 novos (`services/core/auditService.test.ts`).

---

## 9. Checklist de implantação

- [ ] Aplicar `20261046_reactivate_audits_logs.sql` no SQL Editor.
- [ ] Aplicar `20261047_create_audit_triggers.sql` (conferir os NOTICE de tabelas ausentes).
- [ ] Aplicar `20261048_add_audit_log_route.sql`.
- [ ] Aplicar `20261049_use_user_id_in_audits_logs.sql` (FK `user_id` + remoção de
      `user_uuid`) — confirmar com
      `SELECT column_name FROM information_schema.columns WHERE table_name='audits_logs' AND column_name='user_uuid';`
      (deve voltar vazio).
- [ ] Smoke test: criar/editar/excluir um registro de teste pela app e conferir a tela
      **Ajustes → Auditoria** (ou `SELECT * FROM audits_logs ORDER BY id DESC`).
- [ ] (Opcional) Conceder `audit_log` a perfis específicos na matriz de permissões.
