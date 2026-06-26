-- Migração para criação do módulo de Ferramentas (Inventário e Rastreamento)

-- 1. Tabela Cadastro Físico (tools)
CREATE TABLE IF NOT EXISTS public.tools (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DISPONIVEL' CHECK (status IN ('DISPONIVEL', 'EM_USO', 'MANUTENCAO', 'BAIXADA')),
    material_id BIGINT REFERENCES public.materials(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    created_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL
);

-- Se a tabela já existe (banco já criado), adicionar colunas que podem estar faltando:
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS code VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS material_id BIGINT REFERENCES public.materials(id) ON DELETE SET NULL;

-- Índices para buscas na tabela tools
CREATE INDEX IF NOT EXISTS idx_tools_status ON public.tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_serial ON public.tools(serial_number);

-- 2. Tabela de Associação / Estado Atual (users_tools)
CREATE TABLE IF NOT EXISTS public.users_tools (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tool_id INTEGER NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    amount INTEGER DEFAULT 1,
    date_start TIMESTAMP DEFAULT NOW(),
    date_end TIMESTAMP NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'USO' CHECK (status IN ('USO', 'BAIXADO', 'TRANSFERIDO')),
    created_at TIMESTAMP DEFAULT NOW(),
    created_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL
);

-- Índices para otimizar queries de quem está com o quê
CREATE INDEX IF NOT EXISTS idx_users_tools_user_id ON public.users_tools(user_id);
CREATE INDEX IF NOT EXISTS idx_users_tools_tool_id ON public.users_tools(tool_id);
CREATE INDEX IF NOT EXISTS idx_users_tools_status ON public.users_tools(status);

-- 3. Tabela de Histórico de Movimentações (users_tools_movements)
CREATE TABLE IF NOT EXISTS public.users_tools_movements (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    to_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('INCLUSAO', 'TRANSFERENCIA', 'BAIXA')),
    amount INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    created_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL
);

-- Índice para recuperar toda a timeline de uma ferramenta rapidamente
CREATE INDEX IF NOT EXISTS idx_users_tools_mov_tool_id ON public.users_tools_movements(tool_id);

-- Ativar RLS (Row Level Security) se necessário
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_tools_movements ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS padrão (Permitir acesso autenticado para ler e escrever - Ajuste conforme necessidade do projeto)
CREATE POLICY "Allow all authenticated users full access to tools" ON public.tools FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users full access to users_tools" ON public.users_tools FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users full access to users_tools_movements" ON public.users_tools_movements FOR ALL TO authenticated USING (true);
