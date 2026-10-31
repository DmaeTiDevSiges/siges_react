-- =====================================================
-- DOWN da Migration: 20261050_manage_audited_tables.sql
-- Remove a interface de configuração sem alterar triggers
-- nem apagar o histórico de auditoria já gravado.
-- =====================================================

DROP FUNCTION IF EXISTS public.set_audit_table_config(jsonb);
DROP FUNCTION IF EXISTS public.get_audit_table_config();
DROP TABLE IF EXISTS public.cfg_audits_tables;
