/**
 * AI Suggestion Engine
 * 
 * Gera sugestões contextuais de perguntas para o assistente IA
 * baseadas na tela/entidade que o usuário está visualizando.
 * 
 * ✨ Exemplo prático de IA no SIGES
 */

import { aiService } from './aiService';

// ─── Tipos ──────────────────────────────────────────────────────────

export interface ScreenContext {
  /** Rota atual (ex: 'asset-detail', 'unit-detail', 'dashboard') */
  route: string;
  /** Tipo de entidade sendo visualizada */
  entityType?: 'asset' | 'unit' | 'contract' | 'order' | 'visit' | 'material' | 'user' | 'dashboard';
  /** ID da entidade (se aplicável) */
  entityId?: string | number;
  /** Nome/descrição da entidade (para personalizar sugestões) */
  entityName?: string;
  /** Código da entidade (ex: código do ativo) */
  entityCode?: string;
  /** Permissões do usuário atual */
  userPermissions?: string[];
}

export interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: 'quick_info' | 'analysis' | 'report' | 'action';
}

export interface SuggestionResult {
  suggestions: Suggestion[];
  context: ScreenContext;
}

// ─── Engine ─────────────────────────────────────────────────────────

/**
 * Mapa de sugestões por rota
 * Cada rota pode ter sugestões fixas + hooks para sugestões dinâmicas
 */
const ROUTE_SUGGESTIONS: Record<string, Suggestion[]> = {
  'asset-detail': [
    {
      id: 'asset_last_visit',
      label: 'Última visita',
      prompt: 'Quando foi a última visita técnica deste ativo e o que foi feito?',
      icon: 'history',
      category: 'quick_info',
    },
    {
      id: 'asset_movements',
      label: 'Movimentações',
      prompt: 'Este ativo já foi movido entre unidades? Quais foram as movimentações?',
      icon: 'swap_horiz',
      category: 'quick_info',
    },
    {
      id: 'asset_costs',
      label: 'Custos acumulados',
      prompt: 'Quanto já foi gasto em manutenção neste ativo?',
      icon: 'payments',
      category: 'analysis',
    },
    {
      id: 'asset_maintenance',
      label: 'Manutenções recentes',
      prompt: 'Quais manutenções foram feitas neste ativo nos últimos 30 dias?',
      icon: 'build',
      category: 'quick_info',
    },
  ],
  'unit-detail': [
    {
      id: 'unit_assets',
      label: 'Ativos da unidade',
      prompt: 'Quais ativos estão cadastrados nesta unidade?',
      icon: 'precision_manufacturing',
      category: 'quick_info',
    },
    {
      id: 'unit_orders',
      label: 'OS em aberto',
      prompt: 'Quantas ordens de serviço estão em aberto para esta unidade?',
      icon: 'pending_actions',
      category: 'quick_info',
    },
    {
      id: 'unit_contracts',
      label: 'Contratos vigentes',
      prompt: 'Quais contratos estão ativos para esta unidade?',
      icon: 'description',
      category: 'quick_info',
    },
  ],
  'contract-detail': [
    {
      id: 'contract_risk',
      label: 'Analisar riscos',
      prompt: 'Analise os riscos deste contrato com base nos dados disponíveis',
      icon: 'warning',
      category: 'analysis',
    },
    {
      id: 'contract_services',
      label: 'Serviços mais usados',
      prompt: 'Quais serviços deste contrato são mais acionados?',
      icon: 'build',
      category: 'analysis',
    },
    {
      id: 'contract_status',
      label: 'Status do contrato',
      prompt: 'Me dê um resumo do status atual deste contrato',
      icon: 'info',
      category: 'quick_info',
    },
  ],
  'order-visit': [
    {
      id: 'visit_summary',
      label: 'Resumo da visita',
      prompt: 'Faça um resumo detalhado desta visita técnica',
      icon: 'summarize',
      category: 'report',
    },
    {
      id: 'visit_materials',
      label: 'Materiais utilizados',
      prompt: 'Quais materiais foram utilizados nesta visita?',
      icon: 'inventory_2',
      category: 'quick_info',
    },
    {
      id: 'visit_photos',
      label: 'Fotos da visita',
      prompt: 'Quantas fotos foram registradas nesta visita?',
      icon: 'photo_library',
      category: 'quick_info',
    },
  ],
  'profile': [
    {
      id: 'profile_orders',
      label: 'Minhas OS',
      prompt: 'Quantas ordens de serviço estão atribuídas a mim?',
      icon: 'assignment_ind',
      category: 'quick_info',
    },
    {
      id: 'profile_stats',
      label: 'Minhas estatísticas',
      prompt: 'Me mostre estatísticas do meu trabalho este mês',
      icon: 'bar_chart',
      category: 'analysis',
    },
  ],
  'dashboard': [
    {
      id: 'dash_summary',
      label: 'Resumo do dia',
      prompt: 'Faça um resumo das atividades de hoje',
      icon: 'today',
      category: 'report',
    },
    {
      id: 'dash_pending',
      label: 'Principais pendências',
      prompt: 'Quais são as principais pendências do sistema?',
      icon: 'notification_important',
      category: 'quick_info',
    },
    {
      id: 'dash_alerts',
      label: 'Alertes críticos',
      prompt: 'Existem alertas críticos de ativos que preciso saber?',
      icon: 'warning',
      category: 'analysis',
    },
  ],
};

// ─── Serviço Principal ──────────────────────────────────────────────

export const aiSuggestionEngine = {
  /**
   * Retorna sugestões contextuais baseadas na tela atual.
   * 
   * @param context - Contexto da tela atual
   * @param maxSuggestions - Máximo de sugestões (default: 4)
   */
  async getSuggestions(
    context: ScreenContext,
    maxSuggestions: number = 4
  ): Promise<Suggestion[]> {
    const baseSuggestions = this.getBaseSuggestions(context.route);
    const personalized = this.personalizeSuggestions(baseSuggestions, context);
    return personalized.slice(0, maxSuggestions);
  },

  /**
   * Retorna sugestões fixas do mapa de rotas
   */
  getBaseSuggestions(route: string): Suggestion[] {
    // Normaliza a rota: extrai o prefixo principal
    const normalizedRoute = this.normalizeRoute(route);
    return ROUTE_SUGGESTIONS[normalizedRoute] || [];
  },

  /**
   * Personaliza sugestões com base no contexto da entidade
   */
  personalizeSuggestions(
    suggestions: Suggestion[],
    context: ScreenContext
  ): Suggestion[] {
    if (!context.entityName && !context.entityCode) return suggestions;

    const identifier = context.entityName || context.entityCode || '';
    // Usa entityCode quando disponível (ex: código do ativo), senão usa entityId
    const idSuffix = context.entityCode 
      ? ` (código: ${context.entityCode})` 
      : context.entityId ? ` (ID: ${context.entityId})` : '';

    return suggestions.map((s) => ({
      ...s,
      // Adiciona o nome/código + ID numérico da entidade no prompt para contexto
      prompt: s.prompt.includes('deste') || s.prompt.includes('desta')
        ? `${s.prompt} (${identifier})${idSuffix}`
        : s.prompt,
      // Gera ID único por entidade
      id: `${s.id}_${context.entityId || 'generic'}`,
    }));
  },

  /**
   * Normaliza rotas complexas para o formato do mapa
   * Ex: '/assets/123' → 'asset-detail'
   */
  normalizeRoute(route: string): string {
    const routeMap: Record<string, string> = {
      'assets': 'asset-detail',
      'units': 'unit-detail',
      'contracts': 'contract-detail',
      'visits': 'order-visit',
      'orders': 'order-visit',
      'profile': 'profile',
      'dashboard': 'dashboard',
      'dashboard-orders': 'dashboard',
      'dashboard-orders-admin': 'dashboard',
    };

    // Extrai o primeiro segmento da rota
    const segments = route.split('/').filter(Boolean);
    const baseRoute = segments[0] || '';

    // Tenta match exato, depois fallback para o prefixo
    return routeMap[baseRoute] || routeMap[route] || route;
  },

  /**
   * Extrai o contexto da URL e parâmetros
   * Útil para componentes que precisam criar o ScreenContext
   */
  extractContextFromPath(path: string): Partial<ScreenContext> {
    const segments = path.split('/').filter(Boolean);
    const route = segments[0] || 'dashboard';

    let entityType: ScreenContext['entityType'];
    let entityId: string | undefined;

    // Mapeamento de rotas para tipos de entidade
    if (route === 'assets' || path.includes('/assets/')) entityType = 'asset';
    else if (route === 'units' || path.includes('/units/')) entityType = 'unit';
    else if (route === 'contracts' || path.includes('/contracts/')) entityType = 'contract';
    else if (route === 'visits' || path.includes('/visits/')) entityType = 'visit';
    else if (route === 'orders' || path.includes('/orders/')) entityType = 'order';
    else if (route === 'profile') entityType = 'user';
    else if (route === 'dashboard') entityType = 'dashboard';

    // Último segmento numérico é o ID da entidade
    for (const seg of segments) {
      if (/^\d+$/.test(seg)) {
        entityId = seg;
        break;
      }
    }

    return { route, entityType, entityId };
  },
};

// ─── Hook para React ────────────────────────────────────────────────

/**
 * Hook que observa a localização atual e retorna sugestões contextuais.
 * 
 * Uso:
 * ```tsx
 * const { suggestions, context } = useAISuggestions();
 * ```
 */
import { useState, useEffect, useCallback } from 'react';

// Event emitter simples para comunicação entre componentes
type SuggestionCallback = (prompt: string, label: string) => void;
let _suggestionListener: SuggestionCallback | null = null;

export function setSuggestionListener(cb: SuggestionCallback | null) {
  _suggestionListener = cb;
}

export function fireSuggestionSelected(prompt: string, label: string) {
  if (_suggestionListener) {
    _suggestionListener(prompt, label);
  }
}

export function useAISuggestions(context: ScreenContext, maxSuggestions: number = 4) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await aiSuggestionEngine.getSuggestions(context, maxSuggestions);
      setSuggestions(result);
    } catch (error) {
      console.error('[aiSuggestionEngine] Error getting suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [context.route, context.entityType, context.entityId, context.entityName, maxSuggestions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { suggestions, isLoading, refresh };
}

export default aiSuggestionEngine;
