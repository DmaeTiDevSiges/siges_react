-- Populate AI Knowledge Base with SIGES Business Rules
-- Execute after ai_assistant_setup.sql

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
('Regras de negócio do SIGES: Ordens de serviço são criadas por equipes e atribuídas a líderes. Cada ordem tem um status que indica seu progresso: CRIADA, ALOCADA, EM ANDAMENTO, CONCLUIDA, CANCELADA, SUSPENSA.', '{"category": "business_rules", "topic": "orders"}', 'business_rule'),
('Ativos no SIGES representam equipamentos de manutenção. Cada ativo pertence a uma unidade e tem tipos categorizados (ex: bomba, motor). Manutenções preventivas são agendadas por contrato.', '{"category": "business_rules", "topic": "assets"}', 'business_rule'),
('Contratos no SIGES definem acordos de manutenção entre empresas e provedores. Incluem status como ATIVO, EXPIRADO, CANCELADO. Gerenciamento é feito por managers designados.', '{"category": "business_rules", "topic": "contracts"}', 'business_rule'),
('Usuários têm disponibilidade controlada por flags isAvailable e ovIdInProgress. Equipes são organizadas hierarquicamente com líderes responsáveis por alocações.', '{"category": "business_rules", "topic": "users_teams"}', 'business_rule'),
('Unidades são locais físicos gerenciados, com coordenadas GPS. Cada unidade pode ter múltiplos ativos e ordens associadas.', '{"category": "business_rules", "topic": "units"}', 'business_rule'),
('Materiais e veículos são consumidos em ordens de serviço. Custos são calculados automaticamente baseado em uso.', '{"category": "business_rules", "topic": "materials_vehicles"}', 'business_rule'),
('Relatórios de visitas documentam trabalho de campo. Incluem assinaturas digitais e fotos armazenadas no Cloudflare R2.', '{"category": "business_rules", "topic": "visits_reports"}', 'business_rule'),
('Permissões são baseadas em roles: super admin, admin, user comum. Dados são isolados por empresa (company_id) para multi-tenancy.', '{"category": "business_rules", "topic": "permissions"}', 'business_rule');