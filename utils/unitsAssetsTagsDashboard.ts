/**
 * Cálculos puros do painel "Unidades × Ativos" (DashboardUnitsAssetsTags), extraídos do
 * componente na etapa 4 do PLANO_MELHORIAS_FRONTEND.md — corpo copiado sem alteração.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function computeMoExtraByUnit(noticeWorkersAll: any[], activeNotices: any[] | undefined) {
    const map = new Map<number, {
        total: number;
        notices: Array<{
            noticeId: number;
            title?: string;
            color?: string;
            categoryLabel?: string;
            total: number;
            companies: Array<{ name?: string; logoUrl?: string; amount: number }>;
        }>;
        companies: Array<{ name?: string; logoUrl?: string; amount: number }>;
    }>();

    noticeWorkersAll.forEach(w => {
        const uid = Number(w.unitId);
        const amount = Number(w.workersExtraAmount) || 0;
        if (!uid || amount <= 0) return;

        const entry = map.get(uid) ?? { total: 0, notices: [], companies: [] };
        entry.total += amount;

        // Agrupa por aviso dentro da unidade
        let noticeEntry = entry.notices.find(n => n.noticeId === w.noticeId);
        if (!noticeEntry) {
            noticeEntry = {
                noticeId: w.noticeId,
                title: w.noticeTitle,
                color: w.noticeColor,
                categoryLabel: w.noticeCategoryLabel,
                total: 0,
                companies: []
            };
            entry.notices.push(noticeEntry);
        }
        noticeEntry.total += amount;
        noticeEntry.companies.push({
            name: w.companyName,
            logoUrl: w.companyLogoUrl,
            amount
        });

        // Mantém rateio geral por empresa (compatível com UI atual)
        entry.companies.push({
            name: w.companyName,
            logoUrl: w.companyLogoUrl,
            amount
        });

        map.set(uid, entry);
    });

    // Ordena avisos conforme ordem de activeNotices para manter consistência
    const noticeOrder = new Map<number, number>();
    activeNotices?.forEach((n: any, idx: number) => {
        if (n?.id) noticeOrder.set(Number(n.id), idx);
    });

    for (const entry of map.values()) {
        entry.notices.sort((a, b) => {
            const oa = noticeOrder.get(a.noticeId) ?? 999;
            const ob = noticeOrder.get(b.noticeId) ?? 999;
            if (oa !== ob) return oa - ob;
            return a.noticeId - b.noticeId;
        });
        // Opcional: normaliza empresas para evitar duplicados pesados no tooltip
    }

    return map;

}

export function computeMoExtraSummary(noticeWorkersAll: any[], dashboardUnitIds: ReadonlySet<number>) {
    const companiesMap = new Map<string, { name?: string; logoUrl?: string; amount: number }>();
    let total = 0;
    noticeWorkersAll.forEach(w => {
        const amount = Number(w.workersExtraAmount) || 0;
        if (amount <= 0) return;
        if (!dashboardUnitIds.has(Number(w.unitId))) return;
        total += amount;
        const key = String(w.companyId ?? w.companyName ?? 'unknown');
        const prev = companiesMap.get(key);
        if (prev) {
            prev.amount += amount;
        } else {
            companiesMap.set(key, { name: w.companyName, logoUrl: w.companyLogoUrl, amount });
        }
    });
    return { total, companies: Array.from(companiesMap.values()).sort((a, b) => b.amount - a.amount) };

}

export function computeSectorsStats(allData: any[], sectorsData: any[], selectedUnitTypeIds: string[]) {
    // Collect manual stats regardless of view data (for activity and fallback)
    const manualStats: Record<string, any> = {};
    allData.forEach(row => {
        const sName = row.tag_description || 'Geral';
        if (!manualStats[sName]) {
            manualStats[sName] = {
                count: 0,
                availableCount: 0,
                lastReportedAt: null,
                latestRow: null,
                rateSum: 0,
                unitIds: new Set<string>()
            };
        }
        manualStats[sName].count++;
        manualStats[sName].rateSum += Number(row.last_asset_available_rate) || 0;
        manualStats[sName].unitIds.add(String(row.unit_id));
        if (row.last_is_available) manualStats[sName].availableCount++;

        if (row.last_reported_at && (!manualStats[sName].lastReportedAt || new Date(row.last_reported_at) > new Date(manualStats[sName].lastReportedAt))) {
            manualStats[sName].lastReportedAt = row.last_reported_at;
            manualStats[sName].latestRow = row;
        }
    });

    // Com tipo de unidade filtrado, a view agregada (nível sistema pai) não
    // reflete o recorte: o % do setor vira a média do % das unidades visíveis.
    const subRatePct = (man: any) => {
        const units = man.unitIds?.size || 0;
        return units > 0 ? Math.max(0, Math.min(100, Math.round((man.rateSum / units) * 100))) : 0;
    };

    // Use precisely aggregated data from view if available
    if (sectorsData.length > 0) {
        return sectorsData
            .filter(row => selectedUnitTypeIds.length === 0 || manualStats[row.asset_tag_description || 'Geral'])
            .map(row => {
            const sName = row.asset_tag_description || 'Geral';
            const man = manualStats[sName] || { count: 0, availableCount: 0, latestRow: null };
            const pct = (fraction: number) => selectedUnitTypeIds.length > 0
                ? subRatePct(man)
                : Math.round((fraction || 0) * 100);

            // If the sector doesn't have any specific visibility set, we fallback to general count availability
            const hasSpecificVisible = row.flow_rate_is_visible || row.power_is_visible || row.pressure_is_visible;

            return {
                id: sName,
                name: sName,
                flow: {
                    visible: row.flow_rate_is_visible,
                    percentage: pct(row.pct_flow_rate_available_fraction),
                    unit: row.flow_rate_unit || ''
                },
                power: {
                    visible: row.power_is_visible,
                    percentage: pct(row.pct_power_available_fraction),
                    unit: row.power_unit || ''
                },
                pressure: {
                    visible: row.pressure_is_visible,
                    percentage: pct(row.pct_pressure_available_fraction),
                    unit: row.pressure_unit || ''
                },
                general: {
                    visible: !hasSpecificVisible,
                    percentage: selectedUnitTypeIds.length > 0
                        ? subRatePct(man)
                        : (man.count > 0 ? Math.round((man.availableCount / man.count) * 100) : 0),
                    unit: ''
                },
                lastReportedAt: man.latestRow?.last_reported_at,
                latestUnit: man.latestRow?.unit_description,
                latestSubTag: man.latestRow?.tag_sub_description,
                latestUser: man.latestRow?.last_reported_user_name_short || man.latestRow?.last_created_user_name_short,
                latestAvatar: man.latestRow?.last_user_avatar_url
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }

    // Fallback to manual aggregation if view data is not loaded yet
    return Object.entries(manualStats).map(([sName, man]: [string, any]) => ({
        id: sName,
        name: sName,
        flow: { visible: true, percentage: Math.round((man.availableCount / man.count) * 100), unit: '' },
        power: { visible: false, percentage: 0, unit: '' },
        pressure: { visible: false, percentage: 0, unit: '' },
        general: { visible: false, percentage: 0, unit: '' },
        ...man,
        latestUnit: man.latestRow?.unit_description,
        latestSubTag: man.latestRow?.tag_sub_description,
        latestUser: man.latestRow?.last_reported_user_name_short || man.latestRow?.last_created_user_name_short,
        latestAvatar: man.latestRow?.last_user_avatar_url
    })).sort((a, b) => a.name.localeCompare(b.name));

}

export function computeUnitsRows(allData: any[], selectedSectorName: string, sortMode: 'disponibilidade' | 'alfabetica', debouncedSearchQuery: string) {
    const rows: Record<string, any> = {};

    allData.forEach(row => {
        const uid = row.unit_id.toString();
        if (!rows[uid]) {
            rows[uid] = {
                id: uid,
                description: row.unit_description,
                lastReportedAt: null,
                totalRate: 0,
                assets: [],
                latitude: row.unit_latitude ?? row.latitude ?? row.units?.latitude,
                longitude: row.unit_longitude ?? row.longitude ?? row.units?.longitude,
                percentage: 0 // Placeholder
            };
        }

        const unit = rows[uid];

        // Only add assets if they belong to the selected sector name
        if ((row.tag_description || 'Geral') === selectedSectorName) {
            if (row.last_reported_at && (!unit.lastReportedAt || new Date(row.last_reported_at) > new Date(unit.lastReportedAt))) {
                unit.lastReportedAt = row.last_reported_at;
                unit.lastUser = row.last_reported_user_name_short || row.last_created_user_name_short;
                unit.lastAvatar = row.last_user_avatar_url;
                unit.lastReportedImage = row.last_reported_image;
            }

            // Sum the custom available rate for the selected sector
            unit.totalRate += (Number(row.last_asset_available_rate) || 0);

            // Determine which physical value and unit to display based on visibility flags
            let displayValue = row.last_flow_rate;
            let displayUnit = row.flow_rate_unit || '';

            if (row.flow_rate_is_visible) {
                displayValue = row.flow_rate_max || row.total_flow_rate_max || row.last_flow_rate || 0;
                displayUnit = row.flow_rate_unit || '';
            } else if (row.power_is_visible) {
                displayValue = row.power_max || row.total_power_max || row.last_power || 0;
                displayUnit = row.power_unit || '';
            } else if (row.pressure_is_visible) {
                displayValue = row.pressure_max || row.total_pressure_max || row.last_pressure || 0;
                displayUnit = row.pressure_unit || '';
            }

            unit.assets.push({
                id: row.id,
                unitId: row.unit_id,
                assetTagId: row.asset_tag_id,
                subId: row.asset_tag_sub_id,
                description: row.tag_sub_description || 'Equip.',
                isAvailable: row.last_is_available,
                isActive: row.is_active ?? true,
                value: displayValue,
                unit: displayUnit,
                reportedAt: row.last_reported_at,
                orderId: row.last_o_id,
                lastAssetAvailableId: row.last_asset_available_id,
                suspendedReason: row.last_asset_unavailable_reason_description,
                lastComments: row.last_comments,
                reportedByUser: row.last_user_full_name || row.last_user_name,
                reportedByAvatar: row.last_user_avatar_url,
                reportedImage: row.last_reported_image,
                unitDescription: row.unit_description,
                sectorName: row.tag_description,
                companyLogo: row.last_provider_company_logo,
                clientId: row.client_id,
                clientName: row.client_name,
                opCounter: row.op_counter || 0
            });
        }
    });

    const finalRows = Object.values(rows).map((r: any) => ({
        ...r,
        assets: r.assets.sort((a: any, b: any) => a.description.localeCompare(b.description)),
        percentage: Math.max(0, Math.min(100, Math.round(r.totalRate * 100)))
    }));

    // Filter by search
    let filtered = finalRows;
    if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.trim().toLocaleLowerCase('pt-BR');
        filtered = finalRows.filter(r => r.description.toLocaleLowerCase('pt-BR').includes(q));
    }

    // Sort
    if (sortMode === 'disponibilidade') {
        return filtered.sort((a, b) => a.percentage - b.percentage);
    } else {
        return filtered.sort((a, b) => a.description.localeCompare(b.description));
    }

}

export function computeSectorPercentage(systemSummary: any): number {
    if (!systemSummary) return 0;
    if (systemSummary.flow?.visible) return systemSummary.flow.percentage;
    if (systemSummary.power?.visible) return systemSummary.power.percentage;
    if (systemSummary.pressure?.visible) return systemSummary.pressure.percentage;
    return systemSummary.general?.percentage || 0;

}

export function filterByUnitTypes(rows: any[], selectedUnitTypeIds: string[]): any[] {
    return selectedUnitTypeIds.length > 0
        ? rows.filter(row => selectedUnitTypeIds.includes(String(row.units?.unit_type_parent_id ?? '')))
        : rows;
}
