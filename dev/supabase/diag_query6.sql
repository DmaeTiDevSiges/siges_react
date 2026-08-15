-- Query 6: Verificar estrutura da tabela assets_attributes_values
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assets_attributes_values' 
ORDER BY ordinal_position;
