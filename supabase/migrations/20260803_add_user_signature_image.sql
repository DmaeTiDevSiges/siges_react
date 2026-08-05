-- Adiciona colunas de assinatura padrão ao perfil do usuário (apenas líderes)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS signature_image_path text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signature_image_name varchar DEFAULT NULL;
