-- Reverte 20261108_create_users_account_deletion_requests.sql
-- ATENÇÃO: apaga os pedidos de exclusão registrados.
BEGIN;
DROP FUNCTION IF EXISTS public.fn_users_cancel_account_deletion();
DROP FUNCTION IF EXISTS public.fn_users_request_account_deletion(TEXT);
DROP TABLE IF EXISTS public.users_account_deletion_requests;
COMMIT;
