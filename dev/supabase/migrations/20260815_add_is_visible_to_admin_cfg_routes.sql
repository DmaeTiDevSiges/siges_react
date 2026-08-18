-- =====================================================
-- Migration: Add is_visible_to_admin to cfg_routes
-- Date: 2026-08-15
-- Description: Controle de visibilidade das rotas para
--              empresa admins na tela de permissoes
-- =====================================================

ALTER TABLE cfg_routes ADD COLUMN is_visible_to_admin boolean DEFAULT true;
