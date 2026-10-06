import { supabase } from '../core/supabase';
import { apiN8nService } from '../core/apiN8nService';
import { dataService } from '../dataService';
import { manualRagService, ManualExcerpt } from './manualRagService';
import type { OrderVisit, OrderVisitAssetView, OrderVisitTeam, OrderVisitVehicle, OrderVisitService, TechnicalManual, TechnicalManualFile } from '../../types';

const VISIT_ASSISTANT_ENDPOINT = import.meta.env.VITE_API_N8N_WEBHOOK_VISIT_ASSISTANT || 'webhook/siges-visit-assistant';

export interface VisitContext {
  visit: {
    id: string;
    mask: string;
    status: string;
    processing: string;
    startedAt?: string;
    unit?: string;
    client?: string;
    system?: string;
    contract?: string;
    priority?: string;
    progress?: number;
    comments?: string;
  };
  assets: {
    total: number;
    draft: number;
    reported: number;
    revised: number;
    approved: number;
    disapproved: number;
    pendingList: string[];
  };
  team: { name: string; isLeader: boolean }[];
  vehicles: { plate: string; hasOdometer: boolean }[];
  services: { description: string; value?: number }[];
  financial: {
    servicesValue: number;
    materialsValue: number;
    vehiclesValue: number;
    total: number;
  };
  signatures: {
    hasLeader: boolean;
    hasRequester: boolean;
  };
  /** Manuais técnicos dos ativos da visita (metadados, para consulta/troubleshooting) */
  technicalManuals: {
    total: number;
    manuals: {
      id?: string;
      code?: string;
      description: string;
      assetType?: string;
      files: { name: string; category?: string; type: string }[];
    }[];
  };
}

function buildVisitContext(
  visit: OrderVisit,
  assets: OrderVisitAssetView[],
  team: OrderVisitTeam[],
  vehicles: OrderVisitVehicle[],
  services: OrderVisitService[],
  manuals: (TechnicalManual & { files: TechnicalManualFile[] })[] = []
): VisitContext {
  const statusMap: Record<number, string> = { 0: 'Aberta', 1: 'Encerrada' };

  const pendingAssets = assets.filter(a => a.processingId === 1);
  const reportedAssets = assets.filter(a => a.processingId === 2);

  return {
    visit: {
      id: visit.id,
      mask: visit.ovMask || '',
      status: statusMap[visit.ovStatusId] || 'Desconhecido',
      processing: visit.processingDescription || 'Rascunho',
      startedAt: visit.ovStartedAt,
      unit: visit.unitDescription,
      client: visit.clientName,
      system: visit.systemDescription,
      contract: visit.contractDescription,
      priority: visit.priorityDescription,
      progress: visit.progress,
      comments: visit.observation,
    },
    assets: {
      total: visit.ovAssetsAmount || assets.length,
      draft: visit.ovAssetsDraftAmount || pendingAssets.length,
      reported: visit.ovAssetsReportedAmount || reportedAssets.length,
      revised: visit.ovAssetsRevisedAmount || 0,
      approved: visit.ovAssetsApprovedAmount || 0,
      disapproved: visit.ovAssetsDisapprovedAmount || 0,
      pendingList: pendingAssets.map(a => `${a.code || ''} - ${a.description || ''}`.trim()),
    },
    team: team.map(m => ({
      name: m.userName || '',
      isLeader: m.isLeader || false,
    })),
    vehicles: vehicles.map(v => ({
      plate: v.licensePlate || '',
      hasOdometer: !!(v.recorderStart || v.recorderEnd),
    })),
    services: services.map(s => ({
      description: s.serviceDescription || s.description || '',
      value: s.totalValue,
    })),
    financial: {
      servicesValue: visit.servicesValue || 0,
      materialsValue: visit.materialsValue || 0,
      vehiclesValue: visit.vehiclesValue || 0,
      total: visit.totalValue || 0,
    },
    signatures: {
      hasLeader: !!visit.ovSignatureLeaderPath,
      hasRequester: !!visit.ovSignatureRequesterPath,
    },
    technicalManuals: {
      total: manuals.length,
      manuals: manuals.map(m => ({
        id: m.id,
        code: m.code || undefined,
        description: m.description,
        assetType: m.assetTypeDescription || undefined,
        files: (m.files || []).map(f => ({
          name: f.docFileName,
          category: f.tmCategoryDescription || undefined,
          type: f.fileType,
        })),
      })),
    },
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const aiVisitAssistantService = {
  /**
   * Constrói o contexto completo incluindo os manuais técnicos
   * vinculados aos ativos da visita (consulta em campo / troubleshooting).
   */
  async buildContextWithManuals(
    visit: OrderVisit,
    assets: OrderVisitAssetView[],
    team: OrderVisitTeam[],
    vehicles: OrderVisitVehicle[],
    services: OrderVisitService[]
  ): Promise<VisitContext> {
    let manuals: (TechnicalManual & { files: TechnicalManualFile[] })[] = [];
    try {
      const assetIds = assets.map(a => a.assetId).filter(Boolean);
      if (assetIds.length > 0) {
        manuals = await dataService.getManualsWithFilesForAssets(assetIds);
      }
    } catch (err) {
      // Manuais são um extra — falha não deve bloquear o assistente
      console.warn('[AIVisitAssistant] Could not load technical manuals for context:', err);
    }
    return buildVisitContext(visit, assets, team, vehicles, services, manuals);
  },

  async sendMessage(
    visitId: string,
    message: string,
    userId: string,
    context: VisitContext,
    history: ChatMessage[]
  ): Promise<string> {
    try {
      // RAG dos manuais: recupera trechos relevantes do acervo dos ativos da visita
      // (silencioso — falha apenas segue sem trechos)
      let manualExcerpts: ManualExcerpt[] | undefined;
      try {
        const tmIds = (context.technicalManuals?.manuals || [])
          .map(m => m.id)
          .filter((id): id is string => !!id);
        if (tmIds.length > 0) {
          const excerpts = await manualRagService.searchManualExcerpts(message, tmIds, 6);
          if (excerpts.length > 0) manualExcerpts = excerpts;
        }
      } catch (ragErr) {
        console.warn('[AIVisitAssistant] RAG lookup failed:', ragErr);
      }

      const response = await apiN8nService.triggerWebhook(VISIT_ASSISTANT_ENDPOINT, {
        visitId,
        userId,
        message,
        context,
        manualExcerpts,
        history: history.slice(-10),
      });

      return response?.output || response?.text || response?.message ||
        'Não foi possível processar sua pergunta. Tente novamente.';
    } catch (error: any) {
      console.error('[AIVisitAssistant] Error:', error);
      throw error;
    }
  },

  buildContext(
    visit: OrderVisit,
    assets: OrderVisitAssetView[],
    team: OrderVisitTeam[],
    vehicles: OrderVisitVehicle[],
    services: OrderVisitService[]
  ): VisitContext {
    return buildVisitContext(visit, assets, team, vehicles, services);
  },

  getSuggestions(): { id: string; label: string; prompt: string; icon: string }[] {
    return [
      { id: 'status', label: 'Status da visita', prompt: 'Qual o status atual da visita e o que falta para encerrar?', icon: 'info' },
      { id: 'pending', label: 'Ativos pendentes', prompt: 'Quais ativos ainda estão pendentes e precisam ser reportados?', icon: 'pending_actions' },
      { id: 'next', label: 'Próximos passos', prompt: 'Quais são os próximos passos que devo seguir nesta visita?', icon: 'route' },
      { id: 'checklist', label: 'Checklist', prompt: 'O checklist de manutenção foi preenchido para todos os ativos?', icon: 'checklist' },
      { id: 'signatures', label: 'Assinaturas', prompt: 'As assinaturas obrigatórias já foram coletadas?', icon: 'draw' },
      { id: 'costs', label: 'Custos', prompt: 'Qual é o resumo financeiro desta visita?', icon: 'payments' },
    ];
  },
};
