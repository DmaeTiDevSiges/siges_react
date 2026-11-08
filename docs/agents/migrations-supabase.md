> Movido do `AGENTS.md` em 08/11/2026, sem alteração. Resumo das regras no `AGENTS.md`.

## 🗄️ Migrations Supabase — CUIDADO COM `DROP ... CASCADE` (AGO/2026)

As migrations são aplicadas **manualmente pelo usuário** no SQL Editor do Supabase
(ver também `.agent/rules/GEMINI.md`). O banco vivo é a fonte da verdade do schema.

### Regras ao escrever migrations de views/funções

1. **Identifique TODAS as dependentes ANTES de qualquer `DROP ... CASCADE`.**
   `DROP VIEW ... CASCADE` apaga views/funções dependentes **sem recriá-las**,
   quebrando funcionalidades já em produção. Para descobrir dependentes use:
   ```sql
   SELECT dependent.relname AS dependent
   FROM pg_depend d
     JOIN pg_rewrite r ON r.oid = d.objid
     JOIN pg_class dependent ON dependent.oid = r.ev_class
     JOIN pg_class source ON source.oid = d.refobjid
   WHERE source.relname = '<view_name>' AND source.relkind = 'v';
   ```
   E/ou faça `grep` dos arquivos em `dev/supabase/migrations/` e `dev/supabase/schema.sql`.

2. **Preferência: `CREATE OR REPLACE VIEW` em vez de `DROP CASCADE`.**
   Quando a mudança é **apenas aditiva** (novas colunas ao final), `CREATE OR REPLACE`
   preserva todas as dependentes. Reserve `DROP CASCADE` só quando for necessário
   REMOVER colunas (o `CREATE OR REPLACE` não permite remover).

3. **Se usar `DROP ... CASCADE`, recrie os dependentes no MESMO arquivo.**
Caso conhecido: a view `v_orders_visits_assets` depende de `v_orders_visits`
   (definida em `20260307_create_v_orders_visits_assets.sql`). Migrações que fazem
   `DROP VIEW public.v_orders_visits CASCADE` DEVEM anexar no final a recriação de
   `v_orders_visits_assets` (idempotente: `DROP VIEW IF EXISTS` + `CREATE OR REPLACE`).

4. **Confira o nome real das colunas no banco vivo.**
   Não copie cegamente definições antigas. Exemplo real: `cfg_assets_statuses`
   usa a coluna `color` — e NÃO `status_color`. `cfg_assets_priorities` é quem tem `color`.
   O schema de referência `dev/supabase/schema.sql` (dump 2026-09-23) pode ficar
   defasado em relação ao banco vivo; valide contra a DB remota quando houver dúvida.

5. **Sempre valide: rode a SQL no editor e teste a feature afetada** (ex: aba Ativos
   da visita técnica usa `v_orders_visits_assets`) antes de declarar concluído.
