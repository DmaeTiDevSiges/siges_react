/**
 * Pasta e nome das fotos do checklist de manutenção no R2.
 * Usado por maintenancePlansService.uploadChecklistImage e pelo modo offline
 * (que precisa saber o nome final antes de enviar). Sem dependências.
 */
const clean = (v: unknown) => String(v ?? '').trim().replace(/[^a-zA-Z0-9]/g, '_');

export const checklistFolderPath = (ovAssetId: unknown, activityId: unknown, companyId?: unknown, assetId?: unknown): string => {
    const c = clean(companyId);
    const a = clean(assetId);
    return c && a && c !== 'undefined' && a !== 'undefined'
        ? `companies/${c}/assets/${a}`
        : `checklist/${clean(ovAssetId)}/${clean(activityId)}`;
};

export const checklistFileName = (ovAssetId: unknown, activityId: unknown, ext = 'webp'): string =>
    `checklist_${clean(ovAssetId)}_${clean(activityId)}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
