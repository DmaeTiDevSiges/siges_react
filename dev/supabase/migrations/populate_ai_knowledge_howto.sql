-- Populate AI Knowledge Base — "Como Usar o SIGES"
-- Execute after ai_assistant_setup.sql and populate_ai_knowledge.sql
-- Fonte: analise do codigo-fonte das views e services do SIGES

-- ═══════════════════════════════════════════════════════════════════
-- GERAL / NAVEGAÇÃO
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'O SIGES é um sistema de gestão de serviços de campo. O menu principal fica no canto superior esquerdo (ícone de hambúrguer). No celular, a navegação inferior mostra as abas principais: Dashboard, Ordens de Serviço, Visitas e Configurações. No desktop, o menu lateral mostra todas as seções. Use o botão flutuante azul no canto inferior esquerdo para abrir o assistente de IA a qualquer momento.',
  '{"category": "howto", "topic": "navigation", "subtopic": "general"}',
  'manual'
),
(
  'Para buscar qualquer coisa no SIGES (ativos, OS, visitas, materiais), use a barra de busca no topo da tela de listagem. Digite código, descrição, marca, modelo ou número de série. Nos filtros avançados, use os seletores em cascata: primeiro selecione o filtro pai (ex: Sistema), depois o filho (ex: Sub-sistema). Limpar um filtro pai automaticamente limpa os filtros filhos.',
  '{"category": "howto", "topic": "navigation", "subtopic": "search"}',
  'manual'
),
(
  'O SIGES funciona offline em algumas funcionalidades. Quando a conexão cai, um indicador aparece no topo. Dados salvos offline são sincronizados quando a conexão volta. Se você estiver sem internet, evite gerar relatórios ou enviar fotos grandes.',
  '{"category": "howto", "topic": "navigation", "subtopic": "offline"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- DASHBOARD
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'O Dashboard do usuário mostra duas abas: Serviços (ordens de serviço atribuídas a você) e Visitas (visitas técnicas que você lidera). Na aba Serviços, filtre por: Autorizados, Agendados ou Suspensos. Na aba Visitas, filtre por: Rascunho, Reportadas, Revisadas, Reprovadas ou Chats Pendentes. Se você tem uma visita em andamento, um banner vermelho aparece no topo — toque para retomar.',
  '{"category": "howto", "topic": "dashboard", "subtopic": "user_dashboard"}',
  'manual'
),
(
  'O Dashboard administrativo tem visão consolidada de todas as OS e visitas da empresa. Filtre por período, equipe, contrato ou status. Os cards mostram quantidades por status e valores financeiros. Use os filtros no topo para refinar os dados exibidos.',
  '{"category": "howto", "topic": "dashboard", "subtopic": "admin_dashboard"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- ORDENS DE SERVIÇO (OS)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'Para criar uma nova Ordem de Serviço (OS), acesse a tela de OS e toque no botão "+". O formulário tem 3 passos: 1) Dados da OS: preencha os campos obrigatórios (Serviço solicitado, Cliente, Unidade, Tipo OS, Sub-tipo, Prioridade, Finalidade e Contrato). 2) Alertas em Aberto: selecione alertas relacionados (opcional). 3) Evidências: anexe até 4 fotos (opcional). Toque em "Enviar" para criar.',
  '{"category": "howto", "topic": "orders", "subtopic": "create_order"}',
  'manual'
),
(
  'Campos obrigatórios ao criar uma OS: Serviço solicitado (texto livre detalhando o que deve ser executado), Cliente (empresa contratante), Unidade (local físico), Tipo OS (tipo do serviço), Sub-tipo OS, Prioridade (urgência) e Contrato vigente. O campo Plano é opcional. O Cliente e a Unidade são selecionados em cascata: primeiro escolha o cliente, depois a unidade.',
  '{"category": "howto", "topic": "orders", "subtopic": "required_fields"}',
  'manual'
),
(
  'Ao criar uma OS, o sistema verifica alertas em aberto para o setor e tipo de OS selecionados. Se houver alertas, eles aparecem na etapa 2 do formulário. Você pode vincular alertas à OS marcando os checkboxes. Alertas já vinculados a outra OS ficam bloqueados e não podem ser selecionados.',
  '{"category": "howto", "topic": "orders", "subtopic": "alerts_linking"}',
  'manual'
),
(
  'Para editar uma OS existente, acesse os detalhes da OS e toque no menu (três pontos) → "Editar". Altere os campos desejados e salve. Nem todos os campos podem ser editados dependendo do status da OS.',
  '{"category": "howto", "topic": "orders", "subtopic": "edit_order"}',
  'manual'
),
(
  'Para cancelar uma OS, acesse os detalhes da OS → menu (três pontos) → "Cancelar OS". Confirme a ação. Esta ação não pode ser desfeita. A OS recebe o status CANCELADA.',
  '{"category": "howto", "topic": "orders", "subtopic": "cancel_order"}',
  'manual'
),
(
  'Os status de uma OS seguem este fluxo: CRIADA → ALOCADA → EM ANDAMENTO → CONCLUÍDA. Uma OS também pode ser SUSPENSA (com progresso parcial) ou CANCELADA. O status é atualizado automaticamente conforme a OS avança no fluxo. A equipe é alocada pelo gestor após a criação.',
  '{"category": "howto", "topic": "orders", "subtopic": "status_flow"}',
  'manual'
),
(
  'Na visualização detalhada de uma OS, há 6 abas: SS (solicitação de serviço original), Visitas (lista de visitas técnicas realizadas), Histórico (ativos atendidos por visita), Ativos, Alertas e Localização (mapa da unidade). Na aba Localização, veja o endereço e coordenadas GPS da unidade.',
  '{"category": "howto", "topic": "orders", "subtopic": "detail_tabs"}',
  'manual'
),
(
  'O botão "Iniciar Visita" aparece nos detalhes da OS apenas para o líder da equipe que está disponível. Ao tocar, confirme o início. A visita é criada automaticamente com status "Em andamento". Se você não é líder ou não está disponível, o botão não aparece.',
  '{"category": "howto", "topic": "orders", "subtopic": "start_visit"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- VISITAS TÉCNICAS
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'Uma visita técnica é criada quando o líder inicia uma visita a partir de uma OS. A visita tem 8 abas: Home (resumo e ações), Transporte (veículos), Ativos (ativos atendidos), Serviços (serviços executados), Custos (resumo financeiro), Avaliação (requisitos do contrato), Chat (comunicação da equipe) e Assistente (IA para dúvidas).',
  '{"category": "howto", "topic": "visits", "subtopic": "visit_tabs"}',
  'manual'
),
(
  'Para registrar veículos na visita, acesse a aba Transporte. Toque em "+" para adicionar um veículo. Informe a placa e o hodômetro inicial. Ao finalizar a visita, registre o hodômetro final para controle de quilometragem.',
  '{"category": "howto", "topic": "visits", "subtopic": "vehicles"}',
  'manual'
),
(
  'Para registrar ativos na visita, acesse a aba Ativos. Toque em "+" para adicionar um ativo. Preencha o status do ativo (draft, reportado, aprovado, reprovado), adicione fotos de evidência e registre a manutenção realizada. Cada ativo pode ter checklist de manutenção. O status "draft" é para rascunho; "reportado" para quando o ativo foi atendido; "aprovado" ou "reprovado" pela gestão.',
  '{"category": "howto", "topic": "visits", "subtopic": "assets"}',
  'manual'
),
(
  'Para adicionar serviços executados na visita, acesse a aba Serviços (requer permissão orders_visits_services). Toque em "+" e selecione o serviço da lista. Informe o valor. Os serviços são vinculados ao contrato e alimentam o resumo financeiro.',
  '{"category": "howto", "topic": "visits", "subtopic": "services"}',
  'manual'
),
(
  'O resumo financeiro da visita fica na aba Custos. Mostra o valor total de serviços, materiais, veículos e o total geral. Este dado é calculado automaticamente com base nos serviços, materiais e veículos registrados.',
  '{"category": "howto", "topic": "visits", "subtopic": "costs"}',
  'manual'
),
(
  'As assinaturas são obrigatórias para fechar e reportar uma visita. Existem duas assinaturas: Líder (obrigatória para reportar) e Solicitante (informativa). Para assinar, toque em "Assinar Agora" na aba Home e desenhe sua assinatura no tablet. Se o líder tem assinatura padrão salva no perfil, ela é aplicada automaticamente ao iniciar a visita.',
  '{"category": "howto", "topic": "visits", "subtopic": "signatures"}',
  'manual'
),
(
  'Para encerrar uma visita, toque no botão "Encerrar Visita" na aba Home (só aparece quando a visita está em andamento). Escolha entre "Concluída" (progresso 100%) ou "Suspensa" (progresso parcial de 1 a 99%). Seleciona a Causa da OS. Se suspensa, escolha o Motivo da Suspensão e ajuste o slider de progresso. Confirme para encerrar.',
  '{"category": "howto", "topic": "visits", "subtopic": "close_visit"}',
  'manual'
),
(
  'Para reportar uma visita (após encerrar), o líder deve estar na aba Home e tocar em "Reportar". Requisitos: 1) Assinatura do líder deve existir. 2) Todos os ativos devem estar reportados. 3) Somente o líder pode reportar. Se a assinatura estiver faltando, um aviso bloqueia a ação.',
  '{"category": "howto", "topic": "visits", "subtopic": "report_visit"}',
  'manual'
),
(
  'Para aprovar uma visita, o gestor do contrato ou admin deve acessar a visita e tocar em "Aprovar". Requisitos: todos os ativos devem estar aprovados. Se o contrato tiver requisitos de avaliação, o sistema pergunta se deseja avaliar primeiro ou aprovar direto. Para reprovar, pelo menos um ativo deve estar reprovado.',
  '{"category": "howto", "topic": "visits", "subtopic": "approve_visit"}',
  'manual'
),
(
  'O fluxo completo de processamento da visita é: 1) Rascunho (draft) → equipe trabalha nos ativos. 2) Encerrada → visitas é fechada. 3) Reportada → líder reporta (precisa de assinatura). 4) Em revisão → gestor revisa. 5) Aprovada → gestor aprova. 6) Arquivada → somente leitura. Cada etapa tem validações específicas.',
  '{"category": "howto", "topic": "visits", "subtopic": "processing_flow"}',
  'manual'
),
(
  'Na aba Chat da visita, a equipe pode se comunicar em tempo real. As mensagens são salvas automaticamente e ficam visíveis para todos os membros da equipe. O badge no ícone da aba mostra mensagens não lidas.',
  '{"category": "howto", "topic": "visits", "subtopic": "chat"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- ATIVOS
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'Para buscar ativos, acesse a tela de Ativos → Buscar. Use a barra de busca para pesquisar por código, descrição, marca, modelo ou número de série. Use filtros avançados: Sistema, Sub-sistema, Tipo de Unidade, Unidade, Setor, Posição, Tipo de Ativo e Situação. Por padrão, a situação "USO" é selecionada automaticamente.',
  '{"category": "howto", "topic": "assets", "subtopic": "search"}',
  'manual'
),
(
  'Para cadastrar um novo ativo, toque no botão "+" na tela de Buscar de Ativos. Preencha: 1) Identificação: Tipo do ativo, Código (único), Situação e Data da Situação. 2) Localização: Cliente, Unidade, Setor/Posição. 3) Dados Técnicos: campos dinâmicos carregados conforme o tipo (ex: potência, tensão, vazão). 4) Foto do equipamento (opcional). A descrição é gerada automaticamente pelo padrão de nomenclatura do tipo.',
  '{"category": "howto", "topic": "assets", "subtopic": "create"}',
  'manual'
),
(
  'O código do ativo deve ser único no sistema. Ao salvar, o SIGES verifica se já existe outro ativo com o mesmo código. Exceção: código "0" é permitido para ativos sem identificação fixa. O código pode conter letras, números e traços.',
  '{"category": "howto", "topic": "assets", "subtopic": "code_validation"}',
  'manual'
),
(
  'Os dados técnicos dos ativos são dinâmicos e dependem do tipo selecionado. Ao escolher o tipo, os campos técnicos aparecem automaticamente. Exemplos: para bombas aparecem vazão e pressão; para motores aparecem potência e rotação. Preencha os campos marcados como obrigatórios.',
  '{"category": "howto", "topic": "assets", "subtopic": "dynamic_attributes"}',
  'manual'
),
(
  'Para clonar um ativo, abra o ativo original e selecione a opção de duplicar. O sistema cria uma cópia com os mesmos dados, mas limpa o código, número de série e imagem. Você só precisa informar um novo código e ajustar os dados específicos.',
  '{"category": "howto", "topic": "assets", "subtopic": "clone"}',
  'manual'
),
(
  'Para cadastrar um alerta em um ativo, acesse os detalhes do ativo e toque em "Criar Alerta". Informe o tipo do alerta, a descrição e a prioridade. Alertas podem ser vinculados a OS para rastreamento. Os alertas abertos aparecem na tela de Alertas de Ativos.',
  '{"category": "howto", "topic": "assets", "subtopic": "alerts"}',
  'manual'
),
(
  'Para movimentar um ativo entre unidades, use a funcionalidade de movimentação nos detalhes do ativo. Informe a unidade de destino. O histórico de movimentações fica registrado e pode ser consultado a qualquer momento.',
  '{"category": "howto", "topic": "assets", "subtopic": "movements"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- MATERIAIS
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'Para cadastrar um novo material, acesse Configurações → Contratos → Materiais → "+". Preencha: Código do material, Descrição, Unidade (ex: un, kg, m, litro) e Status (ativo/inativo). O material fica disponível para vínculo com ativos e uso em visitas.',
  '{"category": "howto", "topic": "materials", "subtopic": "create"}',
  'manual'
),
(
  'O estoque de materiais é gerenciado por almoxarifado. Cada almoxarifado tem endereço e mantém estoque por material. Para consultar o estoque, acesse Configurações → Materiais → Dashboard. Veja quantidades disponíveis, entradas e saídas por período.',
  '{"category": "howto", "topic": "materials", "subtopic": "warehouse"}',
  'manual'
),
(
  'Para solicitar uma compra de material, acesse a aba de Compras no dashboard de materiais. Toque em "Nova Compra", selecione o material, informe a quantidade e o fornecedor. A compra fica pendente de aprovação até que um gestor aprove ou reprove.',
  '{"category": "howto", "topic": "materials", "subtopic": "purchase_request"}',
  'manual'
),
(
  'Para aprovar uma compra de material, acesse a lista de compras pendentes. Toque na compra desejada e selecione "Aprovar" ou "Reprovar". Ao aprovar, o estoque é atualizado automaticamente. Reprovadas ficam registradas no histórico.',
  '{"category": "howto", "topic": "materials", "subtopic": "purchase_approval"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- CONTRATOS
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'Para criar um contrato, acesse Configurações → Contratos. Toque em "+". Informe: Nome do contrato, Cliente, Empresa provedora, Período (vigência), Valor total, Status (ativo/expirado/cancelado) e Gestores designados. O contrato vincula serviços e materiais disponíveis para as OS.',
  '{"category": "howto", "topic": "contracts", "subtopic": "create"}',
  'manual'
),
(
  'Nos detalhes de um contrato, veja as abas: Serviços (lista de serviços incluídos), Avaliações (requisitos de avaliação de visitas) e Requisitos (requisitos específicos). As avaliações definem critérios que as visitas devem atender para serem aprovadas.',
  '{"category": "howto", "topic": "contracts", "subtopic": "details"}',
  'manual'
),
(
  'As avaliações de contrato definem requisitos que as visitas devem cumprir. Ao aprovar uma visita, o sistema verifica se todos os requisitos do contrato foram atendidos. Se houver pendências, o gestor pode reprovar ou solicitar correções.',
  '{"category": "howto", "topic": "contracts", "subtopic": "evaluations"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- FERRAMENTAS
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'O gerenciamento de ferramentas fica em Ferramentas (menu lateral). Tem 3 abas: Inventário (catálogo de ferramentas), Movimentações (atribuições e devoluções) e Responsáveis (quem tem ferramentas). No Inventário, cadastre ferramentas com código, material vinculado, marca, modelo, número de série.',
  '{"category": "howto", "topic": "tools", "subtopic": "overview"}',
  'manual'
),
(
  'Para atribuir uma ferramenta a um usuário, acesse a aba Movimentações → "Vincular". Selecione a ferramenta (deve estar com status DISPONÍVEL) e o usuário responsável. A ferramenta muda para status EM_USO. Para devolver, toque no ícone de retorno ao lado da ferramenta.',
  '{"category": "howto", "topic": "tools", "subtopic": "assign_return"}',
  'manual'
),
(
  'Para transferir uma ferramenta de um usuário para outro, acesse a aba Movimentações, encontre a ferramenta no usuário atual e toque no ícone de transferência. Selecione o novo responsável. A transferência fica registrada no histórico.',
  '{"category": "howto", "topic": "tools", "subtopic": "transfer"}',
  'manual'
),
(
  'Os status de uma ferramenta são: DISPONÍVEL (em estoque, pode ser atribuída), EM_USO (atribuída a um usuário), MANUTENÇÃO (em reparo) e BAIXADA (dada baixa, fora de uso). O histórico de movimentações fica registrado com data, tipo e responsável.',
  '{"category": "howto", "topic": "tools", "subtopic": "statuses"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- SOLICITAÇÕES DE SERVIÇO (SS)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'Uma Solicitação de Serviço (SS) é o ponto de entrada para novos trabalhos. Para criar uma SS, acesse a tela de Solicitações de Serviço e toque em "+". Preencha: Descrição do serviço, Cliente, Unidade, Tipo e Prioridade. A SS é avaliada e convertida em OS pelo gestor.',
  '{"category": "howto", "topic": "service_requests", "subtopic": "create"}',
  'manual'
),
(
  'Uma SS pode ser duplicada se já existir uma solicitação similar. O sistema avisa quando detecta uma SS duplicada e permite vincular à existente em vez de criar outra. Isso evita retrabalho e mantém o histórico consolidado.',
  '{"category": "howto", "topic": "service_requests", "subtopic": "duplicate_warning"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- CONFIGURAÇÕES (ADMIN)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'As Configurações ficam no menu lateral (apenas para administradores). As seções são: Unidades (Sistemas, Tipos, Setores, Posições), Ordens de Serviço (Atividades, Prioridades, Tipos, Sub-tipos, Planos, Objetos), Clientes, Empresas, Ativos (Tipos, Situações, Prioridades, Dados Técnicos, Marcas), Contratos (Serviços, Materiais, Requisitos de Avaliação), Acesso e Segurança (Usuários, Permissões, Rotas) e Inteligência Artificial.',
  '{"category": "howto", "topic": "settings", "subtopic": "overview"}',
  'manual'
),
(
  'Para cadastrar um novo tipo de ativo, acesse Configurações → Ativos → Tipos. Toque em "+" e informe o nome do tipo e o padrão de nomenclatura. O padrão usa placeholders como {type}, {brand}, {model}, {code} para gerar a descrição automaticamente do ativo.',
  '{"category": "howto", "topic": "settings", "subtopic": "asset_types"}',
  'manual'
),
(
  'Para gerenciar permissões de acesso, acesse Configurações → Acesso e Segurança → Permissões de Acesso. Selecione o perfil que deseja configurar e marque as permissões desejadas. As permissões controlam o que cada tipo de usuário pode ver e fazer no sistema.',
  '{"category": "howto", "topic": "settings", "subtopic": "permissions"}',
  'manual'
),
(
  'Para cadastrar um novo cliente, acesse Configurações → Clientes → "+". Informe os dados da empresa cliente. Clientes são vinculados a contratos e unidades. Apenas clientes ativos aparecem nas listagens de seleção.',
  '{"category": "howto", "topic": "settings", "subtopic": "clients"}',
  'manual'
),
(
  'Para cadastrar uma nova empresa provedora, acesse Configurações → Empresas → "+". Empresas são as组织 que executam os serviços. Cada empresa tem equipe própria e é vinculada a contratos específicos.',
  '{"category": "howto", "topic": "settings", "subtopic": "companies"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- RELATÓRIOS
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'Para gerar relatórios em PDF, acesse a listagem da entidade desejada (ativos, OS, visitas, etc.) e toque no ícone de PDF. Os relatórios incluem: Relatório de Ativos, Lista de OS, Relatório de Visita, Relatório em Lote de Visitas e Lista de Solicitações. Selecione os itens ou filtre antes de gerar.',
  '{"category": "howto", "topic": "reports", "subtopic": "pdf"}',
  'manual'
),
(
  'Para exportar dados em Excel, acesse a listagem de ativos ou materiais e toque no ícone de Excel. Os dados são exportados com os filtros aplicados. Útil para análises externas e planilhas de acompanhamento.',
  '{"category": "howto", "topic": "reports", "subtopic": "excel"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- USUÁRIOS E PERMISSÕES
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'Os perfis de usuário no SIGES são: Super Admin (acesso total), Admin da Empresa (gerencia sua empresa) e Usuário Comum (acesso limitado). Cada perfil tem permissões específicas que controlam o que pode ser visualizado e editado. As permissões são configuradas em Configurações → Permissões de Acesso.',
  '{"category": "howto", "topic": "users", "subtopic": "profiles"}',
  'manual'
),
(
  'Para cadastrar um novo usuário, acesse Configurações → Acesso e Segurança → Usuários → "+". Informe: Nome, E-mail, Perfil, Empresa, Departamento e Equipe. O usuário recebe um e-mail de boas-vindas com instruções de acesso. Senhas são geradas automaticamente.',
  '{"category": "howto", "topic": "users", "subtopic": "create_user"}',
  'manual'
),
(
  'A disponibilidade do usuário é controlada por dois flags: isAvailable (disponível para novos trabalhos) e ovIdInProgress (ID da visita em andamento). Quando o usuário tem uma visita em andamento, ele fica automaticamente indisponível para outras alocações.',
  '{"category": "howto", "topic": "users", "subtopic": "availability"}',
  'manual'
);

-- ═══════════════════════════════════════════════════════════════════
-- UNIDADES
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO ai_knowledge (content, metadata, source_type) VALUES
(
  'Unidades são locais físicos onde os ativos estão instalados. Cada unidade tem: nome, endereço, coordenadas GPS, cliente proprietário e tipo. As coordenadas são usadas no mapa de localização das OS. Para cadastrar uma unidade, acesse Configurações → Unidades.',
  '{"category": "howto", "topic": "units", "subtopic": "overview"}',
  'manual'
),
(
  'Setores e Posições são subdivisions de uma unidade. Setor é a área principal (ex: "Administrativo", "Produção") e Posição é o local específico dentro do setor (ex: "Sala 101", "Linha 3"). Cada ativo é vinculado a um setor e posição para localização precisa.',
  '{"category": "howto", "topic": "units", "subtopic": "sectors_positions"}',
  'manual'
);
