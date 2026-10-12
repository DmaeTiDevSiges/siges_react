-- Define o fuso padrão do banco para novas sessões.
-- Sessões já abertas devem ser reconectadas para receber esta configuração.
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- Após reconectar ao banco, este comando deve retornar America/Sao_Paulo.
SHOW timezone;
