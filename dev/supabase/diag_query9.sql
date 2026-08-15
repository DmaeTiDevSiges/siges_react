-- Query 9: Verificar se as colunas select_options existem na tabela
-- Se esta query falhar, a migration NÃO foi aplicada e o PostgREST vai quebrar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cfg_assets_attributes' 
ORDER BY ordinal_position;
