# Guia de Configuração - Novo VPS Supabase

## Pré-requisitos
- VPS com Supabase instalado
- Acesso ao painel SQL do Supabase
- PostgreSQL 14+ rodando

## Passo 1: Executar o Schema Principal

Execute o arquivo `schema.sql` completo no SQL Editor do Supabase.

```bash
# Caminho do arquivo
d:\AG\Siges\supabase\schema.sql
```

## Passo 2: Configurar Permissões e Policies

Execute o script abaixo para configurar todas as permissões necessárias:

```sql
-- ============================================================================
-- CONFIGURAÇÃO DE PERMISSÕES - NOVO VPS
-- ============================================================================

-- 1. Desabilitar RLS em todas as tabelas (modo permissivo)
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 2. Garantir permissões totais em todas as tabelas
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Configurar Storage (bucket siges)
INSERT INTO storage.buckets (id, name, public)
VALUES ('siges', 'siges', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Policy de Storage
DROP POLICY IF EXISTS "Siges Public Access" ON storage.objects;
CREATE POLICY "Siges Public Access" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'siges');

-- 5. Habilitar Realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.users_notifications;

-- 6. Recarregar schema
NOTIFY pgrst, 'reload schema';

SELECT 'Configuração concluída com sucesso!' AS status;
```

## Passo 3: Inserir Dados Iniciais

Execute este script para popular as tabelas de configuração:

```sql
-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Status de Usuários
INSERT INTO public.cfg_users_statuses (id, code, description)
VALUES 
    (1, 'ANA', 'Analise'), 
    (2, 'ATI', 'Ativo'), 
    (3, 'INA', 'Inativo')
ON CONFLICT (id) DO NOTHING;

-- Status de Contratos
INSERT INTO public.cfg_contracts_statuses (id, code, description, color)
VALUES 
    (1, 'ATI', 'Ativo', '#22c55e'), 
    (2, 'VNC', 'Vencido', '#ef4444'), 
    (3, 'SUS', 'Suspenso', '#f59e0b'),
    (4, 'RASC', 'Rascunho', '#94a3b8')
ON CONFLICT (id) DO NOTHING;

-- Status de Unidades
INSERT INTO public.cfg_units_statuses (id, code, description, color)
VALUES 
    (1, 'ATI', 'Ativo', '#22c55e'), 
    (2, 'INA', 'Inativo', '#ef4444'), 
    (3, 'MAN', 'Manutenção', '#f59e0b')
ON CONFLICT (id) DO NOTHING;

SELECT 'Dados iniciais inseridos com sucesso!' AS status;
```

## Passo 4: Importar Dados dos CSVs

A pasta `supabase/data/` contém arquivos CSV com dados para importação. Importe na seguinte ordem:

### Ordem de Importação (respeitar dependências):

1. **Tabelas de Configuração Base** (sem dependências):
```
- cfg_users_statuses_rows.csv → cfg_users_statuses
- cfg_contracts_statuses_rows.csv → cfg_contracts_statuses
- cfg_units_statuses_rows.csv → cfg_units_statuses
- cfg_orders_priorities_rows.csv → cfg_orders_priorities
- cfg_orders_plans_rows.csv → cfg_orders_plans
- cfg_orders_objects_rows.csv → cfg_orders_objects
- cfg_activities_rows.csv → cfg_activities
```

2. **Empresas e Estrutura Organizacional**:
```
- cfg_companies_rows.csv → cfg_companies
- cfg_departments_rows.csv → cfg_departments
- cfg_profiles_rows.csv → cfg_profiles
- cfg_teams_rows.csv → cfg_teams
```

3. **Hierarquias e Tipos**:
```
- cfg_systems_rows.csv → cfg_systems
- cfg_units_types_rows.csv → cfg_units_types
- cfg_units_tags_rows.csv → cfg_assets_tags (se existir)
- cfg_units_tags_subs_rows.csv → cfg_assets_tags_subs (se existir)
- cfg_orders_types_rows.csv → cfg_orders_types
- cfg_orders_types_subs_rows.csv → cfg_orders_types_subs
```

4. **Relacionamentos**:
```
- cfg_orders_types_activities_rows.csv → cfg_orders_types_activities
```

5. **Dados de Negócio**:
```
- clients_rows.csv → clients
- users_rows.csv → users
- contracts_rows.csv → contracts
- units_rows.csv → units
```

### Como Importar via Interface do Supabase:

1. Acesse o Table Editor no painel do Supabase
2. Selecione a tabela de destino
3. Clique em "Insert" → "Import data from CSV"
4. Selecione o arquivo CSV correspondente
5. Mapeie as colunas corretamente
6. Clique em "Import"

### Como Importar via SQL (alternativa):

```sql
-- Exemplo para importar users
COPY public.users(id, email, name_full, name_short, mobile, phone, created_at, team_id, company_id, department_id, status_id, profile_id, is_admin, is_admin_super)
FROM 'd:\AG\Siges\supabase\data\users_rows.csv'
DELIMITER ','
CSV HEADER;
```

### ⚠️ Importante:

- **Backup antes de importar**: Sempre faça backup antes de importar dados
- **Verificar IDs**: Certifique-se de que os IDs nos CSVs não conflitam com dados existentes
- **Foreign Keys**: Respeite a ordem de importação para evitar erros de chave estrangeira
- **Encoding**: Os CSVs devem estar em UTF-8

## Passo 5: Criar Primeiro Usuário Admin

```sql
-- Criar empresa padrão
INSERT INTO public.cfg_companies (id, code, description, email_sufix, is_available)
VALUES (1, 'ADMIN', 'Empresa Administradora', '@admin.com', true)
ON CONFLICT (id) DO NOTHING;

-- Criar departamento padrão
INSERT INTO public.cfg_departments (id, company_id, code, description, is_available)
VALUES (1, 1, 'TI', 'Tecnologia da Informação', true)
ON CONFLICT (id) DO NOTHING;

-- Criar perfil admin
INSERT INTO public.cfg_profiles (id, description, department_id)
VALUES (1, 'Administrador Master', 1)
ON CONFLICT (id) DO NOTHING;

-- IMPORTANTE: Após criar o usuário no Auth do Supabase (via interface ou código),
-- execute este comando substituindo o UUID e email:
-- 
-- INSERT INTO public.users (uuid, email, name_full, status_id, is_admin_super, profile_id, company_id)
-- VALUES (
--     'SEU-UUID-AQUI',  -- UUID do auth.users
--     'seu-email@admin.com',
--     'Administrador',
--     2,  -- Ativo
--     true,
--     1,
--     1
-- );
```

## Passo 6: Atualizar .env.local

Atualize o arquivo `.env.local` com as credenciais do novo VPS:

```env
GEMINI_API_KEY=sua-chave-aqui

VITE_SUPABASE_URL=https://seu-novo-vps.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
VITE_SUPABASE_STORAGE_BUCKET=siges
```

## Passo 7: Testar Conexão

1. Reinicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse a tela de login
3. Verifique se as empresas aparecem no dropdown
4. Faça login com o usuário admin criado

## Troubleshooting

### Erro 406 (Not Acceptable)
- Verifique se o PostgREST está rodando corretamente
- Execute: `NOTIFY pgrst, 'reload schema';`
- Reinicie o serviço do Supabase

### Erro PGRST116 (User not found)
- Certifique-se de que o usuário existe em `public.users`
- Verifique se o UUID em `public.users` corresponde ao UUID em `auth.users`

### Empresas não aparecem no login
- Verifique se há dados em `cfg_companies`: `SELECT * FROM cfg_companies;`
- Confirme as permissões: `GRANT SELECT ON cfg_companies TO anon;`

## Backup e Migração de Dados

Se você precisa migrar dados do Hostinger para o novo VPS:

```bash
# No servidor antigo (Hostinger)
pg_dump -h 31.97.17.100 -U postgres -d postgres -t public.users -t public.cfg_companies > backup.sql

# No servidor novo
psql -h novo-vps -U postgres -d postgres < backup.sql
```

## Próximos Passos

1. ✅ Executar schema.sql
2. ✅ Configurar permissões
3. ✅ Inserir dados iniciais
4. ✅ Criar usuário admin
5. ✅ Atualizar .env.local
6. ✅ Testar aplicação
7. 🔄 Migrar dados do VPS antigo (se necessário)
8. 🔄 Configurar backup automático

## Suporte

Se encontrar problemas, verifique:
- Logs do PostgreSQL: `/var/log/postgresql/`
- Logs do PostgREST: `journalctl -u postgrest`
- Status dos serviços: `systemctl status postgresql postgrest`
