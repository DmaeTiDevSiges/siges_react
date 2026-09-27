/**
 * AI Page Help Map
 *
 * Mapeia cada tela do SIGES para:
 * - Nome amigável (exibido no header do chat)
 * - Ícone Material Symbol
 * - Sugestões de boas-vindas contextuais
 * - Filtro de busca RAG (prioriza conhecimento da tela)
 */

export interface PageHelpEntry {
  /** Nome amigável da página */
  label: string;
  /** Ícone Material Symbol */
  icon: string;
  /** Sugestões de boas-vindas (3-4 perguntas) */
  suggestions: Array<{
    label: string;
    prompt: string;
    icon?: string;
  }>;
  /** Palavras-chave para filtrar a busca RAG */
  knowledgeKeywords: string[];
}

/**
 * Mapa de telas do SIGES → contexto de ajuda
 *
 * As chaves devem bater com os valores de `currentScreen`
 * que já são passados pelo Layout.
 */
export const PAGE_HELP_MAP: Record<string, PageHelpEntry> = {
  // ─── Dashboard ───────────────────────────────────────────────
  'dashboard-orders-user': {
    label: 'Meu Painel',
    icon: 'dashboard',
    suggestions: [
      { label: 'Minhas pendências', prompt: 'Quais são minhas atividades pendentes hoje?', icon: 'pending_actions' },
      { label: 'Filtrar OS', prompt: 'Como filtro minhas Ordens de Serviço por status?', icon: 'filter_list' },
      { label: 'Retomar visita', prompt: 'Como retomo uma visita em andamento?', icon: 'play_arrow' },
      { label: 'Estatísticas', prompt: 'Onde vejo minhas estatísticas de trabalho?', icon: 'bar_chart' },
    ],
    knowledgeKeywords: ['dashboard', 'painel', 'serviços', 'visitas', 'filtro', 'status'],
  },

  'dashboard-orders-admin': {
    label: 'Painel Administrativo',
    icon: 'admin_panel_settings',
    suggestions: [
      { label: 'Visão geral', prompt: 'Qual é o resumo das atividades da empresa hoje?', icon: 'today' },
      { label: 'OS pendentes', prompt: 'Quais OS estão pendentes de aprovação?', icon: 'pending_actions' },
      { label: 'Filtros admin', prompt: 'Como filtro OS por equipe, contrato ou período?', icon: 'filter_list' },
    ],
    knowledgeKeywords: ['dashboard', 'admin', 'aprovação', 'equipe', 'contrato'],
  },

  'dashboard-orders-visits-admin': {
    label: 'Painel de Visitas',
    icon: 'rate_review',
    suggestions: [
      { label: 'Visitas pendentes', prompt: 'Quais visitas estão aguardando aprovação?', icon: 'pending_actions' },
      { label: 'Aprovar visita', prompt: 'Como aprovo uma visita técnica?', icon: 'check_circle' },
      { label: 'Relatórios', prompt: 'Como gero o relatório de visitas do mês?', icon: 'description' },
    ],
    knowledgeKeywords: ['dashboard', 'visitas', 'aprovação', 'relatório'],
  },

  // ─── Ordens de Serviço ──────────────────────────────────────
  'order-requests': {
    label: 'Ordens de Serviço',
    icon: 'assignment',
    suggestions: [
      { label: 'Criar OS', prompt: 'Como criar uma nova Ordem de Serviço?', icon: 'add_circle' },
      { label: 'Autorizar OS', prompt: 'Como autorizo uma OS que está pendente?', icon: 'check_circle' },
      { label: 'Status da OS', prompt: 'Quais são os status possíveis de uma OS e o que significam?', icon: 'info' },
      { label: 'Vincular alertas', prompt: 'Como vinculo alertas de ativos a uma OS?', icon: 'link' },
    ],
    knowledgeKeywords: ['ordem', 'serviço', 'OS', 'criar', 'autorizar', 'status', 'alerta'],
  },

  'order-request-detail': {
    label: 'Detalhes da OS',
    icon: 'assignment',
    suggestions: [
      { label: 'Iniciar visita', prompt: 'Como inicio uma visita a partir desta OS?', icon: 'play_arrow' },
      { label: 'Histórico', prompt: 'Onde vejo o histórico de visitas desta OS?', icon: 'history' },
      { label: 'Cancelar OS', prompt: 'Como cancelo esta Ordem de Serviço?', icon: 'cancel' },
    ],
    knowledgeKeywords: ['ordem', 'detalhe', 'visita', 'histórico', 'cancelar'],
  },

  // ─── Visitas Técnicas ───────────────────────────────────────
  'order-visit': {
    label: 'Visita Técnica',
    icon: 'hail',
    suggestions: [
      { label: 'Registrar ativo', prompt: 'Como registro um ativo nesta visita?', icon: 'add_circle' },
      { label: 'Adicionar fotos', prompt: 'Como tiro e adiciono fotos de evidência?', icon: 'photo_camera' },
      { label: 'Fechar visita', prompt: 'Como fecho e reporto esta visita?', icon: 'check_circle' },
      { label: 'Assinaturas', prompt: 'Como coletro as assinaturas do líder e solicitante?', icon: 'draw' },
    ],
    knowledgeKeywords: ['visita', 'ativo', 'foto', 'fechar', 'reportar', 'assinatura'],
  },

  'order-visit-chat': {
    label: 'Chat da Visita',
    icon: 'forum',
    suggestions: [
      { label: 'Enviar mensagem', prompt: 'Como envio uma mensagem para a equipe?', icon: 'chat' },
      { label: 'Notificar equipe', prompt: 'Como notifico os membros da equipe sobre uma mudança?', icon: 'notifications' },
    ],
    knowledgeKeywords: ['chat', 'visita', 'mensagem', 'equipe'],
  },

  // ─── Ativos ─────────────────────────────────────────────────
  'assets-search': {
    label: 'Buscar Ativos',
    icon: 'search',
    suggestions: [
      { label: 'Buscar ativo', prompt: 'Como busco um ativo específico?', icon: 'search' },
      { label: 'Filtros avançados', prompt: 'Como uso os filtros avançados de busca?', icon: 'filter_list' },
      { label: 'Cadastrar ativo', prompt: 'Como cadastro um novo ativo?', icon: 'add_circle' },
      { label: 'Escanear código', prompt: 'Como escaneio o código de barras de um ativo?', icon: 'qr_code_scanner' },
    ],
    knowledgeKeywords: ['ativo', 'buscar', 'filtro', 'cadastrar', 'código', 'barras'],
  },

  'asset-detail': {
    label: 'Detalhes do Ativo',
    icon: 'precision_manufacturing',
    suggestions: [
      { label: 'Editar ativo', prompt: 'Como edito os dados deste ativo?', icon: 'edit' },
      { label: 'Criar alerta', prompt: 'Como crio um alerta para este ativo?', icon: 'warning' },
      { label: 'Movimentar', prompt: 'Como movimento este ativo para outra unidade?', icon: 'swap_horiz' },
      { label: 'Histórico', prompt: 'Onde vejo o histórico de manutenções deste ativo?', icon: 'history' },
    ],
    knowledgeKeywords: ['ativo', 'editar', 'alerta', 'movimentar', 'histórico', 'manutenção'],
  },

  // ─── Materiais ──────────────────────────────────────────────
  'materials': {
    label: 'Materiais',
    icon: 'inventory_2',
    suggestions: [
      { label: 'Cadastrar material', prompt: 'Como cadastro um novo material?', icon: 'add_circle' },
      { label: 'Consultar estoque', prompt: 'Como consulto o estoque de um material?', icon: 'inventory' },
      { label: 'Solicitar compra', prompt: 'Como solicito a compra de um material?', icon: 'shopping_cart' },
    ],
    knowledgeKeywords: ['material', 'cadastrar', 'estoque', 'compra', 'almoxarifado'],
  },

  // ─── Contratos ──────────────────────────────────────────────
  'contracts': {
    label: 'Contratos',
    icon: 'description',
    suggestions: [
      { label: 'Criar contrato', prompt: 'Como crio um novo contrato?', icon: 'add_circle' },
      { label: 'Avaliar contrato', prompt: 'Como configuro os requisitos de avaliação?', icon: 'rate_review' },
      { label: 'Status do contrato', prompt: 'Quais são os status possíveis de um contrato?', icon: 'info' },
    ],
    knowledgeKeywords: ['contrato', 'criar', 'avaliação', 'status', 'serviço'],
  },

  'contract-detail': {
    label: 'Detalhes do Contrato',
    icon: 'description',
    suggestions: [
      { label: 'Serviços do contrato', prompt: 'Quais serviços estão incluídos neste contrato?', icon: 'build' },
      { label: 'Avaliações', prompt: 'Como funcionam as avaliações deste contrato?', icon: 'rate_review' },
      { label: 'Editar contrato', prompt: 'Como edito este contrato?', icon: 'edit' },
    ],
    knowledgeKeywords: ['contrato', 'serviço', 'avaliação', 'editar'],
  },

  // ─── Ferramentas ────────────────────────────────────────────
  'tools': {
    label: 'Ferramentas',
    icon: 'construction',
    suggestions: [
      { label: 'Cadastrar ferramenta', prompt: 'Como cadastro uma nova ferramenta?', icon: 'add_circle' },
      { label: 'Atribuir ferramenta', prompt: 'Como atribuo uma ferramenta a um usuário?', icon: 'person_add' },
      { label: 'Devolver ferramenta', prompt: 'Como devolvo uma ferramenta que estava em uso?', icon: 'assignment_return' },
      { label: 'Transferir', prompt: 'Como transfiro uma ferramenta para outro usuário?', icon: 'swap_horiz' },
    ],
    knowledgeKeywords: ['ferramenta', 'cadastrar', 'atribuir', 'devolver', 'transferir'],
  },

  // ─── Configurações ──────────────────────────────────────────
  'app-settings': {
    label: 'Configurações',
    icon: 'settings',
    suggestions: [
      { label: 'Tipos de ativo', prompt: 'Como cadastro um novo tipo de ativo?', icon: 'category' },
      { label: 'Permissões', prompt: 'Como configuro as permissões de acesso?', icon: 'verified_user' },
      { label: 'Usuários', prompt: 'Como crio um novo usuário no sistema?', icon: 'group_add' },
    ],
    knowledgeKeywords: ['configuração', 'tipo', 'permissão', 'usuário', 'cadastro'],
  },

  // ─── Solicitações de Serviço ────────────────────────────────
  'service-requests': {
    label: 'Solicitações de Serviço',
    icon: 'contact_mail',
    suggestions: [
      { label: 'Criar SS', prompt: 'Como crio uma nova Solicitação de Serviço?', icon: 'add_circle' },
      { label: 'Aprovar SS', prompt: 'Como aprovo uma solicitação de serviço?', icon: 'check_circle' },
      { label: 'Converter em OS', prompt: 'Como converto uma SS em Ordem de Serviço?', icon: 'swap_horiz' },
    ],
    knowledgeKeywords: ['solicitação', 'serviço', 'SS', 'criar', 'aprovar', 'converter'],
  },

  // ─── Perfil ─────────────────────────────────────────────────
  'profile': {
    label: 'Meu Perfil',
    icon: 'person',
    suggestions: [
      { label: 'Editar perfil', prompt: 'Como edito meus dados pessoais?', icon: 'edit' },
      { label: 'Minhas estatísticas', prompt: 'Onde vejo minhas estatísticas de trabalho?', icon: 'bar_chart' },
      { label: 'Alterar senha', prompt: 'Como altero minha senha?', icon: 'lock' },
    ],
    knowledgeKeywords: ['perfil', 'editar', 'senha', 'estatística', 'dados'],
  },
};

// ─── Helper Functions ──────────────────────────────────────────

/**
 * Retorna a configuração de ajuda para uma tela.
 * Se a tela não existe no mapa, retorna um fallback genérico.
 */
export function getPageHelp(screen: string): PageHelpEntry {
  // Tenta match exato
  if (PAGE_HELP_MAP[screen]) {
    return PAGE_HELP_MAP[screen];
  }

  // Tenta match por prefixo (ex: 'order-visit-123' → 'order-visit')
  const keys = Object.keys(PAGE_HELP_MAP);
  for (const key of keys) {
    if (screen.startsWith(key)) {
      return PAGE_HELP_MAP[key];
    }
  }

  // Fallback genérico
  return {
    label: 'SIGES',
    icon: 'smart_toy',
    suggestions: [
      { label: 'Como usar', prompt: 'Quais funcionalidades estão disponíveis nesta tela?', icon: 'help' },
      { label: 'Dúvidas gerais', prompt: 'Tenho uma dúvida geral sobre o SIGES', icon: 'info' },
    ],
    knowledgeKeywords: [],
  };
}

/**
 * Retorna as keywords de conhecimento para uma tela.
 * Útil para filtrar a busca RAG.
 */
export function getPageKnowledgeKeywords(screen: string): string[] {
  const help = getPageHelp(screen);
  return help.knowledgeKeywords;
}
