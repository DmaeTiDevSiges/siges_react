-- Migração para adicionar coluna de endereço na tabela de almoxarifados
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS address VARCHAR(255);
