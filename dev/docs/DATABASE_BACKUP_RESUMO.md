# 🗄️ Database Structure Backup System

## ✅ Sistema de Backup e Restauração de Estrutura do Banco de Dados

Este sistema mantém **automaticamente** toda a estrutura do banco de dados organizada e pronta para restauração, respeitando a ordem de criação para evitar problemas com dependências.

---

## 📁 Estrutura Criada

```
supabase/
└── database-structure/              # ← NOVO! Criado automaticamente
    ├── README.md                    # Documentação interna
    ├── 00-seed-data/               # Dados de referência (tabelas lookup)
    │   ├── 001-cfg_users_statuses.sql
    │   ├── 002-cfg_contracts_statuses.sql
    │   └── ...
    ├── 01-core-schema/             # Tabelas base (sem FKs)
    │   ├── 001-create-users-table.sql
    │   ├── 002-create-companies-table.sql
    │   └── ...
    ├── 02-business-schema/         # Tabelas de negócio (com FKs)
    │   ├── 001-create-v-orders-table.sql
    │   ├── 002-create-assets-table.sql
    │   └── ...
    ├── 03-views/                   # Views do banco
    │   ├── 001-create-v_orders_visits-view.sql
    │   └── ...
    ├── 04-functions/               # Funções PostgreSQL
    ├── 05-triggers/                # Triggers
    ├── 06-policies/                # Políticas RLS
    ├── 07-indexes/                 # Índices de performance
    └── 08-constraints/             # Constraints adicionais
```

---

## 🚀 Uso Rápido

### 1️⃣ Exportar Estrutura Atual

```bash
# Exporta toda a estrutura do banco
npm run db:export
```

**O que acontece:**
- ✅ Conecta no seu banco Supabase
- ✅ Extrai TODAS as tabelas, views, funções, triggers, policies
- ✅ Organiza em pastas numeradas (ordem de dependência)
- ✅ Cria arquivos SQL idempotentes (seguros para rodar múltiplas vezes)
- ✅ Gera arquivo de metadata com timestamp

**Resultado esperado:**
```
📦 Exporting seed data...
   ✅ cfg_users_statuses (3 rows)
   
🏗️  Exporting core schema...
   ✅ users
   ✅ companies
   
💼 Exporting business schema...
   ✅ v_orders
   ✅ assets
   
👁️  Exporting views...
   ✅ v_orders_visits

✅ Export completed successfully!
📄 Files created: 47
```

---

### 2️⃣ Validar Antes de Restaurar

```bash
# Verifica se está tudo OK
npm run db:validate
```

**Verificações:**
- ✅ Nomenclatura dos arquivos (devem começar com 001-, 002-, etc.)
- ✅ Comentários de cabeçalho
- ✅ Padrões de idempotência
- ✅ Erros de sintaxe SQL
- ✅ Duplicidades
- ✅ Idade do export (alerta se > 7 dias)

---

### 3️⃣ Restaurar para Outro Banco

```bash
# Restaurar completo (interativo)
npm run db:restore

# Restaurar sem confirmação
npm run db:restore -- --yes

# Dry run (testa sem fazer mudanças)
npm run db:restore -- --dry-run

# Restaurar em servidor específico
npm run db:restore -- --host meu-host --database siges_prod --user postgres
```

**Ordem de execução:**
```
00-seed-data      → Primeiro (dados de referência)
01-core-schema    → Segundo (tabelas base)
02-business-schema→ Terceiro (tabelas com FKs)
03-views          → Quarto (views dependem de tabelas)
04-functions      → Quinto
05-triggers       → Sexto
06-policies       → Sétimo
07-indexes        → Oitavo
08-constraints    → Nono
```

---

## 📋 Scripts Disponíveis

Adicionados ao `package.json`:

| Script | Descrição |
|--------|-----------|
| `npm run db:export` | Exporta estrutura atual do banco |
| `npm run db:restore` | Restaura estrutura para o banco |
| `npm run db:validate` | Valida arquivos antes de restaurar |
| `npm run db:backup` | (Futuro) Backup completo com dados |

---

## 🔍 Exemplo Prático

### Cenário: Configurar Ambiente de Desenvolvimento

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd siges_react

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com credenciais do banco

# 4. Valide estrutura exportada
npm run db:validate

# 5. Restaure para banco local
npm run db:restore -- --host localhost --database siges_dev

# 6. Popule com dados de exemplo (opcional)
psql -h localhost -U postgres -d siges_dev -f supabase/data/*.sql
```

**Pronto!** Seu ambiente de desenvolvimento está configurado! 🎉

---

## 🎯 Casos de Uso

### ✅ Setup de Novo Desenvolvedor

```bash
# Novo dev no time?
npm run db:restore -- --host dev-machine --database siges
# Em 5 minutos ele tem o banco igual produção!
```

---

### ✅ Deploy de Mudanças de Schema

```bash
# 1. Faça mudanças no schema em dev
ALTER TABLE users ADD COLUMN phone TEXT;

# 2. Exporte
npm run db:export

# 3. Revise mudanças
git diff supabase/database-structure/

# 4. Commit
git add supabase/database-structure/
git commit -m "Add phone column to users"

# 5. Teste em staging
npm run db:restore -- --host staging --database siges_staging

# 6. Deploy em produção
npm run db:restore -- --host prod --database siges_prod
```

---

### ✅ Recuperação de Desastre

```bash
# Banco caiu? Sem problemas!

# 1. Crie banco novo
createdb -h seu-host -U postgres siges_novo

# 2. Restaure estrutura
npm run db:restore -- --host seu-host --database siges_novo --yes

# 3. Restaure dados (de backup separado)
psql -h seu-host -U postgres -d siges_novo -f backup_dados.sql

# 4. Verifique
npm run db:validate
```

---

## 🔧 Variáveis de Ambiente

Necessário configurar em `.env.local`:

```bash
# Para banco local/dev
VITE_SUPABASE_DB_HOST=localhost
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=siges_dev
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=sua_senha

# Para self-hosted (Docker)
VITE_SUPABASE_DB_HOST=supabase_db
VITE_SUPABASE_DB_PORT=5432
VITE_SUPABASE_DB_NAME=postgres
VITE_SUPABASE_DB_USER=postgres
VITE_SUPABASE_DB_PASSWORD=postgres
```

---

## 📊 Ordem de Dependência Explicada

### Por que a ordem importa?

Se você criar `orders` antes de `users`, vai erro de FK!

**Nosso sistema resolve isso automaticamente:**

```
Nível 0: cfg_users_statuses     ← Sem dependências
Nível 1: users                   ← Depende só de Level 0
Nível 2: orders                  ← Depende de users
Nível 3: order_items             ← Depende de orders
Nível 4: v_order_items (view)   ← Depende de order_items
```

Cada nível vai para uma pasta numerada diferente!

---

## 🛡️ Recursos de Segurança

### ✅ Idempotência

Todos os arquivos podem rodar múltiplas vezes:

```sql
-- Sempre seguro de rodar
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE IF NOT EXISTS public.users (...);

-- Ou
CREATE OR REPLACE VIEW my_view AS ...;

-- Ou
INSERT INTO table (id, name) 
VALUES (1, 'Test')
ON CONFLICT (id) DO NOTHING;
```

---

### ✅ Validação Automática

O script de validação verifica:
- ❌ Tabelas duplicadas
- ❌ Erros de sintaxe
- ❌ Quotes não fechados
- ⚠️ Arquivos muito grandes
- ⚠️ Export antigo (> 7 dias)

---

### ✅ Dry Run

Sempre teste antes de restaurar:

```bash
# Veja o que aconteceria (sem fazer mudanças)
npm run db:restore -- --dry-run

# Output:
📄 Would execute: 001-cfg_users_statuses.sql
📄 Would execute: 002-cfg_contracts_statuses.sql
...
✅ Dry run completed. No changes were made.
```

---

## 📖 Fluxo Recomendado

### Dia a Dia

```bash
# Trabalhando no schema
ALTER TABLE users ADD COLUMN new_field TEXT;

# Após cada mudança significativa
npm run db:export

# Commit das mudanças
git add supabase/database-structure/
git status  # Veja o que mudou
git commit -m "Update schema: added new_field to users"
```

---

### Antes de Deploy

```bash
# Validação
npm run db:validate

# Teste em staging
npm run db:restore -- --host staging --database siges_staging

# Se tudo OK, produção
npm run db:restore -- --host prod --database siges_prod --yes
```

---

### Rotina de Backup

```bash
# Diariamente (recomendado)
npm run db:export

# Ou use cron job:
# 0 2 * * * cd /path/to/project && npm run db:export
```

---

## 🔎 Troubleshooting

### Erro: "Cannot find module 'pg'"

**Solução:**
```bash
npm install pg
```

---

### Erro: Connection refused

**Solução:**
```bash
# Verifique variáveis de ambiente
cat .env.local | grep DB_

# Teste conexão manual
psql -h localhost -U postgres -c "SELECT 1"
```

---

### Erro: Foreign key constraint failed

**Solução:**
- Verifique se arquivos estão numerados corretamente
- Tabelas referenciadas devem vir ANTES das tabelas que referenciam
- Re-exporte: `npm run db:export`

---

### Erro: File naming convention

**Solução:**
```bash
# Arquivos DEVEM começar com número de 3 dígitos
# Errado: create-users.sql
# Certo: 001-create-users.sql

mv create-users.sql 001-create-users.sql
```

---

## 📚 Documentação Completa

Para detalhes avançados, veja:

- **[DATABASE_BACKUP_GUIDE.md](DATABASE_BACKUP_GUIDE.md)** - Guia completo com todos os comandos
- **[supabase/database-structure/README.md](supabase/database-structure/README.md)** - Documentação interna do sistema

---

## ✨ Benefícios

### ✅ Para o Time

- 🚀 Setup de ambiente em 5 minutos
- 🔄 Schema sempre sincronizado entre devs
- 📋 Histórico completo de mudanças
- 🎯 Deploy consistente e previsível

---

### ✅ Para Produção

- 🛡️ Recuperação rápida de desastres
- 📊 Versionamento de schema
- ✅ Zero downtime deployments
- 🔒 Rollback fácil se necessário

---

### ✅ Para Desenvolvimento

- 💻 Banco local idêntico a produção
- 🧪 Testes mais confiáveis
- 🐛 Debug mais fácil
- 📝 Documentação automática

---

## 🎓 Próximos Passos

1. **Exporte seu banco agora:**
   ```bash
   npm run db:export
   ```

2. **Valide:**
   ```bash
   npm run db:validate
   ```

3. **Teste restore em banco de teste:**
   ```bash
   npm run db:restore -- --host localhost --database siges_test --dry-run
   ```

4. **Commit da estrutura:**
   ```bash
   git add supabase/database-structure/
   git commit -m "Add automated database structure backup"
   ```

---

## 🆘 Precisa de Ajuda?

1. Rode validação: `npm run db:validate`
2. Check logs de export
3. Teste dry-run: `npm run db:restore -- --dry-run`
4. Consulte guia completo: [DATABASE_BACKUP_GUIDE.md](DATABASE_BACKUP_GUIDE.md)

---

**Criado em:** 2026-03-05  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para produção

---

## 🎉 Resumo em 1 Minuto

```bash
# Quer exportar?
npm run db:export

# Quer validar?
npm run db:validate

# Quer restaurar?
npm run db:restore

# Fez mudança no schema?
npm run db:export  # Faça isso SEMPRE!
```

**É isso!** Simples e automático! 🚀
