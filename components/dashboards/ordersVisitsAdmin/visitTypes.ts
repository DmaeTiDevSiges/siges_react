import { OrderVisit } from '../../../types';

export interface VisitStats {
    avaliacao: number;
    autorizadas: number;
    agendadas: number;
    execucao: number;
    suspensas: number;
}

// Extend OrderVisit type locally to include filter fields if they are missing in the main type
export interface OrderVisitExtended extends OrderVisit {
    systemId?: string;
    systemParentId?: string;
    unitTypeId?: string;
    unitTypeParentId?: string;
    orderObjectId?: string;
    orderTypeId?: string;
    orderTypeSubId?: string;
    contractId?: string;
    planId?: string;
    teamId?: string;
    parentId?: number | null;
    o_plan_description?: string;
    // Extra fields for visits list PDF
    typeCode?: string;
    typeSubCode?: string;
    sectorDescription?: string;
}
