## Migração completa (estrutura) - `migration_20260302_2300`

Esta pasta foi criada para gerar um **dump SQL fiel do schema atual** (tabelas, views, funções, triggers, RLS, índices e grants) do seu banco Postgres do Supabase.

O fluxo é:

1. Garantir que o arquivo `.env.local` na raiz do projeto tenha a URL de conexão correta do Postgres (`SUPABASE_DB_URL`).
2. Rodar o script `export_schema.mjs`.
3. Usar o `schema.sql` gerado aqui para recriar a estrutura em outro servidor.

> **Importante:** Este exportador gera apenas **estrutura** (schema).  
> Para copiar também os **dados**, use `pg_dump` com `--data-only` diretamente no servidor.

---

### 1. Configurar `SUPABASE_DB_URL` no `.env.local`

No arquivo `.env.local` (na raiz do projeto), deixe uma linha assim:

```env
SUPABASE_DB_URL=postgresql://postgres:SUA_SENHA@HOST_ACESSIVEL:5432/postgres
```

No seu ambiente self‑hosted Supabase, um exemplo típico é:

```env
SUPABASE_DB_URL=postgresql://postgres:5894a7d4c078ba0d1bf086bc9f5995a8@localhost:5432/postgres
```

Esse exemplo supõe que:

- Você está rodando o script **no próprio VPS** (onde `localhost:5432` enxerga o `supabase_db`), **ou**
- Você abriu um túnel SSH do seu notebook para o container Postgres, por exemplo:

```bash
ssh -L 5432:supabase_db:5432 root@SEU_VPS
```

---

### 2. Gerar o `schema.sql` fiel ao banco atual

Na raiz do projeto (`d:\\AG\\Siges`), execute:

```bash
node supabase/migration_20260302_2300/export_schema.mjs
```

Se a conexão estiver correta, o script vai criar/atualizar:

- `supabase/migration_20260302_2300/schema.sql`

Esse arquivo conterá:

- Tabelas (incluindo constraints)
- Views
- Funções
- Triggers
- Índices
- RLS (policies)
- Grants de tabela (best‑effort)

---

### 3. Aplicar em outro servidor

Com o `schema.sql` pronto, no servidor de destino (onde o Postgres está rodando):

```bash
psql "postgresql://USUARIO:Senha@HOST:5432/postgres" -f supabase/migration_20260302_2300/schema.sql
```

Isso recria **toda a estrutura** do schema `public` (e eventuais extensões/grants detectados).

Se você também quiser copiar dados, faça no servidor de origem:

```bash
pg_dump --data-only --no-owner --no-privileges \
  "postgresql://postgres:5894a7d4c078ba0d1bf086bc9f5995a8@localhost:5432/postgres" \
  > supabase/migration_20260302_2300/data.sql
```

E depois aplique o `data.sql` no servidor de destino com `psql -f`.

