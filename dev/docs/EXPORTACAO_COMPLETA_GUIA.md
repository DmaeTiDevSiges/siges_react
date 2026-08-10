# Guia de Exportação Completa do Banco de Dados

## Problema Atual

✅ Exportação via REST API funcionou  
⚠️ **Mas está incompleta:**
- Faltam tabelas (apenas 10 de ~40+ tabelas)
- Views estão como placeholder (sem definição real)
- Functions não foram exportadas
- Triggers não foram exportadas
- Policies RLS limitadas

## Solução: Túnel SSH + Conexão Direta

Para exportar **TUDO** você precisa de conexão direta ao PostgreSQL via túnel SSH.

---

## 📋 Passo a Passo

### Método 1: Túnel SSH (Recomendado - Completo)

#### Passo 1: Criar Túnel SSH

Abra um **terminal separado** e execute:

```bash
# Windows PowerShell ou Linux
ssh -L 5432:localhost:5432 root@vps.supabase.siges-app.com.br

# Ou use o usuário correto do seu VPS
ssh -L 5432:localhost:5432 usuario@vps.supabase.siges-app.com.br
```

**O que isso faz:**
- Cria um túnel seguro da sua máquina local para o VPS
- Porta 5432 local → Porta 5432 do PostgreSQL no VPS
- Mantenha este terminal aberto durante a exportação

---

#### Passo 2: Configurar .env.local Temporariamente

No arquivo `.env.local`, adicione ou modifique:

```bash
# Para usar o túnel SSH
SUPABASE_DB_HOST=localhost
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=5894a7d4c078ba0d1bf086bc9f5995a8
```

---

#### Passo 3: Executar Exportação Completa

Com o túnel SSH ativo no outro terminal:

```bash
npm run db:export
```

**Isso vai exportar:**
- ✅ TODAS as tabelas (40+)
- ✅ TODAS as views (definições completas)
- ✅ TODAS as functions
- ✅ TODAS os triggers
- ✅ TODAS as policies RLS
- ✅ TODAS os indexes
- ✅ TODAS os constraints
- ✅ Dados seed completos

---

### Método 2: Script pg_dump (Alternativa)

Se tiver acesso SSH ao VPS, pode usar `pg_dump` diretamente:

```bash
# No VPS (via SSH)
ssh root@vps.supabase.siges-app.com.br

# Rodar pg_dump
docker exec -i supabase-db pg_dump -U postgres -d postgres > backup_completo.sql

# Ou copiar para sua máquina
scp root@vps.supabase.siges-app.com.br:/backup_completo.sql ./backup_completo.sql
```

---

### Método 3: Melhorar Exportação REST API

Se NÃO conseguir usar SSH, posso criar scripts melhores que:

1. **Lista TODAS as tabelas** via query específica
2. **Extrai estrutura completa** de cada tabela
3. **Recupera definições de views** via SQL
4. **Exporta TODOS os dados** (não só seed)

Quer que eu crie esta versão aprimorada?

---

## 🔍 Como Verificar o que Falta

### Contar Tabelas no Banco

```bash
# Via REST API (limitado)
curl "https://vps.supabase.siges-app.com.br/rest/v1/information_schema.tables?select=table_name&table_schema=eq.public" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Ver Tabelas Exportadas

```bash
# Ver arquivos criados
ls -la supabase/database-structure/01-core-schema/
ls -la supabase/database-structure/02-business-schema/

# Contar
ls supabase/database-structure/01-core-schema/*.sql | wc -l
ls supabase/database-structure/02-business-schema/*.sql | wc -l
```

---

## ⚡ Solução Rápida

### Opção A: Usar Túnel SSH (10 minutos)

```bash
# Terminal 1: Manter túnel aberto
ssh -L 5432:localhost:5432 root@vps.supabase.siges-app.com.br

# Terminal 2: Editar .env.local
# SUPABASE_DB_HOST=localhost

# Terminal 2: Exportar tudo
npm run db:export
```

**Resultado:** Exportação 100% completa em ~5 minutos

---

### Opção B: Melhorar Script REST API (30 minutos)

Posso criar script melhorado que:
- Usa múltiplas queries REST
- Extrai mais metadados
- Cria estruturas mais completas

**Resultado:** Exportação ~80% completa (ainda sem functions/triggers exatos)

---

### Opção C: Backup Híbrido

1. **Estrutura:** Usar `schema.sql` que já existe
2. **Dados:** Usar exportação REST API
3. **Juntar:** Script automático combina os dois

**Resultado:** Quase completo, requer merge manual

---

## 🎯 Qual Método Prefere?

**Recomendo Opção A (Túnel SSH)** porque:
- ✅ 100% completo
- ✅ Automático
- ✅ Rápido
- ✅ Confiável

Se não tiver acesso SSH, me avise e crio a **Opção B** (script REST API aprimorado).

---

## 📊 Comparação

| Método | Tabelas | Views | Functions | Triggers | Tempo |
|--------|---------|-------|-----------|----------|-------|
| **REST API Atual** | ⚠️ Parcial | ⚠️ Placeholder | ❌ | ❌ | 2 min |
| **REST API Melhorado** | ✅ Todas | ⚠️ Parcial | ❌ | ❌ | 10 min |
| **Túnel SSH** | ✅ Todas | ✅ Todas | ✅ Todas | ✅ Todas | 5 min |
| **pg_dump** | ✅ Todas | ✅ Todas | ✅ Todas | ✅ Todas | 3 min |

---

## 🆘 Preciso de Informação

Para te ajudar melhor, me diga:

1. **Tem acesso SSH ao VPS?**
   - Sim → Uso túnel SSH (completo)
   - Não → Melhoro script REST API

2. **Quantas tabelas estima ter?**
   - 10-20 → REST API resolve
   - 40+ → Precisa túnel SSH

3. **Precisa de functions/triggers?**
   - Sim → Túnel SSH obrigatório
   - Não → REST API melhorado basta

---

**Me avise e crio a solução ideal para você!** 🚀
