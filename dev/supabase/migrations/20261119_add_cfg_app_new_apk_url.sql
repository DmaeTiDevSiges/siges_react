-- ==============================================================================
-- Migration: 20261119_add_cfg_app_new_apk_url.sql
-- Troca do identificador do app Android: com.ag.siges → br.com.sigesapp (nov/2026).
--
-- O Android trata pacotes diferentes como apps diferentes: o novo é instalado AO
-- LADO do antigo, sem levar sessão, cache nem a fila offline. A versão de transição
-- do app antigo (gerada com SIGES_APPLICATION_ID=com.ag.siges) mostra a tela de
-- migração (components/shell/LegacyAppMigrationScreen.tsx) quando esta coluna está
-- preenchida: sincronizar pendências → instalar o novo → desinstalar o antigo.
--
-- Enquanto NULL, nada acontece. Preencher só DEPOIS de publicar o APK novo:
--   UPDATE public.cfg_app SET new_apk_url = 'https://.../siges-app-1.2.0.apk';
--
-- Coluna chamava-se new_app_apk_url numa versão anterior desta migration: se ela
-- existir, é RENOMEADA (mantém o valor); senão, new_apk_url é criada.
--
-- Idempotente. Reverter:
--   ALTER TABLE public.cfg_app DROP COLUMN IF EXISTS new_apk_url;
-- ==============================================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'cfg_app' AND column_name = 'new_app_apk_url')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'cfg_app' AND column_name = 'new_apk_url') THEN
        ALTER TABLE public.cfg_app RENAME COLUMN new_app_apk_url TO new_apk_url;
    END IF;
END $$;

ALTER TABLE public.cfg_app
    ADD COLUMN IF NOT EXISTS new_apk_url text;

COMMENT ON COLUMN public.cfg_app.new_apk_url IS
    'APK do app novo (br.com.sigesapp). Preenchido → o app antigo (com.ag.siges) mostra a tela de migração.';

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Conferência:
--   SELECT version_app, apk_url, new_apk_url FROM public.cfg_app;
