-- ============================================================
-- MIGRATION: is_ok (boolean) -> status (VARCHAR) 
-- Tabela: orders_visits_assets_activities
-- Data: 2026-04-01
-- ============================================================

-- 1. Adicionar nova coluna status
ALTER TABLE orders_visits_assets_activities
ADD COLUMN IF NOT EXISTS status VARCHAR(10);

-- 2. Migrar dados existentes
--    true  -> 'OK'
--    false -> 'NOK'
--    null  -> null (mantém nulo)
UPDATE orders_visits_assets_activities
SET status = CASE
    WHEN is_ok = true  THEN 'OK'
    WHEN is_ok = false THEN 'NOK'
    ELSE NULL
END
WHERE status IS NULL;

-- 3. (Opcional) Adicionar constraint CHECK para restringir valores aceitos
ALTER TABLE orders_visits_assets_activities
ADD CONSTRAINT chk_status_values
CHECK (status IN ('OK', 'NOK', 'NA') OR status IS NULL);

-- 4. Verificar resultado
SELECT 
    status,
    is_ok,
    COUNT(*) as total
FROM orders_visits_assets_activities
GROUP BY status, is_ok
ORDER BY status;

-- ============================================================
-- DEPOIS DE VALIDAR: remover coluna antiga is_ok (OPCIONAL)
-- Execute apenas após confirmar que tudo funciona corretamente
-- ============================================================
-- ALTER TABLE orders_visits_assets_activities DROP COLUMN is_ok;
