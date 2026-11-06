-- DOWN: 20261106_create_users_tracker_tokens
-- Atenção: APKs com a versão nova do LocationForegroundService param de
-- enviar posição se estas funções forem removidas.
BEGIN;
DROP FUNCTION IF EXISTS public.fn_tracker_report_location(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS public.fn_tracker_revoke_token(TEXT);
DROP FUNCTION IF EXISTS public.fn_tracker_issue_token(TEXT, TEXT);
DROP TABLE IF EXISTS public.users_tracker_tokens;
NOTIFY pgrst, 'reload schema';
COMMIT;
