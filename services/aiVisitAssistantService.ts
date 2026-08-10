import { supabase } from './supabase';
import { apiN8nService } from './apiN8nService';
import type { OrderVisit, OrderVisitAssetView, OrderVisitTeam, OrderVisitVehicle, OrderVisitService } from '../types';

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
}

function buildVisitContext(
  visit: OrderVisit,
  assets: OrderVisitAssetView[],
  team: OrderVisitTeam[],
  vehicles: OrderVisitVehicle[],
  services: OrderVisitService[]
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
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const aiVisitAssistantService = {
  async sendMessage(
    visitId: string,
    message: string,
    userId: string,
    context: VisitContext,
    history: ChatMessage[]
  ): Promise<string> {
    try {
      const response = await apiN8nService.triggerWebhook(VISIT_ASSISTANT_ENDPOINT, {
        visitId,
        userId,
        message,
        context,
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
