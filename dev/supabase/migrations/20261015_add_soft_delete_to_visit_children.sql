-- =============================================================================
-- Migration: soft delete — colunas em tabelas filhas de orders_visits
-- Descrição: Adiciona is_deleted / deleted_at / deleted_user_id às tabelas
--            filhas da visita que ainda não possuem essas colunas, permitindo
--            a exclusão completa (soft delete) de uma visita técnica.
-- Plano:     docs/plano-exclusao-visita-is-deleted.md
-- Nota:      Puramente aditivo — nenhuma view/RPC dependente precisa ser
--            recriada. Idempotente (IF NOT EXISTS). Aplicar no SQL Editor.
-- =============================================================================

-- orders_visits já tem is_deleted + ov_deleted_user_id; falta apenas deleted_at
ALTER TABLE public.orders_visits
    ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone;

COMMENT ON COLUMN public.orders_visits.deleted_at IS
    'Timestamp da exclusão lógica (soft delete). Horário de São Paulo.';

ALTER TABLE public.orders_visits_teams
    ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS deleted_user_id bigint;

COMMENT ON COLUMN public.orders_visits_teams.is_deleted IS
    'Exclusão lógica da participação da equipe na visita.';
COMMENT ON COLUMN public.orders_visits_teams.deleted_at IS
    'Timestamp da exclusão lógica (soft delete). Horário de São Paulo.';
COMMENT ON COLUMN public.orders_visits_teams.deleted_user_id IS
    'Usuário responsável pela exclusão lógica.';

ALTER TABLE public.orders_visits_chat
    ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS deleted_user_id bigint;

COMMENT ON COLUMN public.orders_visits_chat.is_deleted IS
    'Exclusão lógica da mensagem de chat da visita.';
COMMENT ON COLUMN public.orders_visits_chat.deleted_at IS
    'Timestamp da exclusão lógica (soft delete). Horário de São Paulo.';
COMMENT ON COLUMN public.orders_visits_chat.deleted_user_id IS
    'Usuário responsável pela exclusão lógica.';

ALTER TABLE public.orders_visits_chat_participants
    ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS deleted_user_id bigint;

COMMENT ON COLUMN public.orders_visits_chat_participants.is_deleted IS
    'Exclusão lógica do participante do chat da visita.';
COMMENT ON COLUMN public.orders_visits_chat_participants.deleted_at IS
    'Timestamp da exclusão lógica (soft delete). Horário de São Paulo.';
COMMENT ON COLUMN public.orders_visits_chat_participants.deleted_user_id IS
    'Usuário responsável pela exclusão lógica.';

ALTER TABLE public.orders_visits_chat_reads
    ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS deleted_user_id bigint;

COMMENT ON COLUMN public.orders_visits_chat_reads.is_deleted IS
    'Exclusão lógica da marcação de leitura do chat da visita.';
COMMENT ON COLUMN public.orders_visits_chat_reads.deleted_at IS
    'Timestamp da exclusão lógica (soft delete). Horário de São Paulo.';
COMMENT ON COLUMN public.orders_visits_chat_reads.deleted_user_id IS
    'Usuário responsável pela exclusão lógica.';

ALTER TABLE public.orders_visits_evaluations
    ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS deleted_user_id bigint;

COMMENT ON COLUMN public.orders_visits_evaluations.is_deleted IS
    'Exclusão lógica da avaliação de contrato aplicada na visita.';
COMMENT ON COLUMN public.orders_visits_evaluations.deleted_at IS
    'Timestamp da exclusão lógica (soft delete). Horário de São Paulo.';
COMMENT ON COLUMN public.orders_visits_evaluations.deleted_user_id IS
    'Usuário responsável pela exclusão lógica.';
