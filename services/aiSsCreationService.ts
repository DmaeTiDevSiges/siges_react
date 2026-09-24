import { apiN8nService } from './apiN8nService';
import { dataService } from './dataService';

const SS_CREATION_ENDPOINT = import.meta.env.VITE_API_N8N_WEBHOOK_SS_CREATION || 'webhook/siges-ss-creation-assistant';

/**
 * Extrai JSON de uma string que pode conter markdown, texto extra, etc.
 * LLMs frequentemente envolvem JSON em blocos ```json ... ```
 */
function extractJson(input: unknown): Record<string, any> | null {
  if (!input) return null;
  if (typeof input === 'object' && input !== null) return input as Record<string, any>;

  if (typeof input !== 'string') return null;

  let str = input.trim();

  // Remove blocos markdown: ```json ... ``` ou ``` ... ```
  const codeBlockMatch = str.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    str = codeBlockMatch[1].trim();
  }

  // Tenta parsear direto
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {}

  // Tenta encontrar o primeiro { ... } na string
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {}
  }

  return null;
}

export interface SSSuggestion {
  clientId: string | null;
  clientName: string;
  unitId: string | null;
  unitDescription: string;
  sectorId: string | null;
  sectorDescription: string;
  orderTypeId: string | null;
  orderTypeDescription: string;
  priorityId: string | null;
  priorityDescription: string;
  requestedServices: string;
  confidence: number;
}

interface SSSuggestionRaw {
  clientId?: string;
  client_name?: string;
  clientName?: string;
  unitId?: string;
  unit_description?: string;
  unitDescription?: string;
  sectorId?: string;
  sector_description?: string;
  sectorDescription?: string;
  orderTypeId?: string;
  order_type_description?: string;
  orderTypeDescription?: string;
  priorityId?: string;
  priority_description?: string;
  priorityDescription?: string;
  requested_services?: string;
  requestedServices?: string;
  confidence?: number;
}

/**
 * Envia uma mensagem em linguagem natural para o assistente de criação de SS
 * e retorna uma sugestão estruturada de preenchimento dos campos.
 */
async function suggestFromNaturalLanguage(
  message: string,
  sessionUser?: { id?: string; nameShort?: string }
): Promise<SSSuggestion> {
  const response = await apiN8nService.triggerWebhook(SS_CREATION_ENDPOINT, {
    message,
    userId: sessionUser?.id,
    userName: sessionUser?.nameShort,
  });

  // O n8n retorna { suggestion: {...} } ou o output direto
  const rawResponse = response?.suggestion || response?.output || response;

  // Tenta extrair JSON da resposta (pode vir envolto em markdown ```json ... ```)
  const raw = extractJson(rawResponse);

  if (!raw || typeof raw !== 'object') {
    throw new Error('Resposta inválida do assistente. Verifique se o workflow está ativo no n8n.');
  }

  const suggestion = normalizeSuggestion(raw);

  // Valida IDs existindo no backend (fallback local)
  await validateAndEnrich(suggestion);

  return suggestion;
}

function normalizeSuggestion(raw: SSSuggestionRaw): SSSuggestion {
  return {
    clientId: raw.clientId || raw.client_id || null,
    clientName: raw.clientName || raw.client_name || '',
    unitId: raw.unitId || raw.unit_id || null,
    unitDescription: raw.unitDescription || raw.unit_description || '',
    sectorId: raw.sectorId || raw.sector_id || null,
    sectorDescription: raw.sectorDescription || raw.sector_description || '',
    orderTypeId: raw.orderTypeId || raw.order_type_id || null,
    orderTypeDescription: raw.orderTypeDescription || raw.order_type_description || '',
    priorityId: raw.priorityId || raw.priority_id || null,
    priorityDescription: raw.priorityDescription || raw.priority_description || '',
    requestedServices: raw.requestedServices || raw.requested_services || '',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
  };
}

/**
 * Valida se os IDs retornados pela IA existem no backend.
 * Se o ID for null mas o nome foi fornecido, busca pelo nome.
 */
async function validateAndEnrich(suggestion: SSSuggestion): Promise<void> {
  try {
    // Validar cliente
    if (suggestion.clientId && !suggestion.clientName) {
      const clients = await dataService.getClients();
      const client = clients.find(c => c.id === suggestion.clientId);
      if (client) suggestion.clientName = client.name;
    } else if (!suggestion.clientId && suggestion.clientName) {
      const clients = await dataService.getClients();
      const match = findBestMatch(suggestion.clientName, clients.map(c => ({ id: c.id, label: c.name })));
      if (match) {
        suggestion.clientId = match.id;
        suggestion.clientName = match.label;
      }
    }

    // Validar unidade
    if (suggestion.clientId && suggestion.unitDescription) {
      const units = await dataService.getUnitsByClient(suggestion.clientId);
      if (suggestion.unitId) {
        const exists = units.some(u => u.id === suggestion.unitId);
        if (!exists) suggestion.unitId = null;
      }
      if (!suggestion.unitId) {
        const match = findBestMatch(suggestion.unitDescription, units.map(u => ({ id: u.id, label: u.descriptionFull || u.description })));
        if (match) {
          suggestion.unitId = match.id;
          suggestion.unitDescription = match.label;
        }
      }
    }

    // Validar tipo de OS
    const types = await dataService.getOrderTypes('active');
    if (suggestion.orderTypeId) {
      const exists = types.some(t => t.id === suggestion.orderTypeId);
      if (!exists) suggestion.orderTypeId = null;
    }
    if (!suggestion.orderTypeId && suggestion.orderTypeDescription) {
      const match = findBestMatch(suggestion.orderTypeDescription, types.map(t => ({ id: t.id, label: t.description })));
      if (match) {
        suggestion.orderTypeId = match.id;
        suggestion.orderTypeDescription = match.label;
      }
    }

    // Validar prioridade
    const priorities = await dataService.getPriorities('active');
    if (suggestion.priorityId) {
      const exists = priorities.some(p => p.id === suggestion.priorityId);
      if (!exists) suggestion.priorityId = null;
    }
    if (!suggestion.priorityId && suggestion.priorityDescription) {
      const match = findBestMatch(suggestion.priorityDescription, priorities.map(p => ({ id: p.id, label: p.description })));
      if (match) {
        suggestion.priorityId = match.id;
        suggestion.priorityDescription = match.label;
      }
    }
  } catch (error) {
    console.warn('[AISsCreationService] Erro ao validar sugestão:', error);
  }
}

/**
 * Busca fuzzy simples: encontra o melhor match por substring ou similaridade básica.
 */
function findBestMatch(
  target: string,
  options: { id: string; label: string }[]
): { id: string; label: string } | null {
  if (!target || options.length === 0) return null;

  const normalized = target.toLowerCase().trim();

  // Match exato
  const exact = options.find(o => o.label.toLowerCase().trim() === normalized);
  if (exact) return exact;

  // Match por substring
  const substring = options.find(o => o.label.toLowerCase().includes(normalized));
  if (substring) return substring;

  // Match por palavras-chave
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  let bestScore = 0;
  let bestMatch: { id: string; label: string } | null = null;

  for (const option of options) {
    const optionLower = option.label.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (optionLower.includes(word)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = option;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

export const aiSsCreationService = {
  suggestFromNaturalLanguage,
};
