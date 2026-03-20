import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const C = {
    black: '#000000',
    gray: '#333333',
    lightGray: '#999991',
    white: '#FFFFFF',
    border: '#000000',
    divider: '#000000',
    primary: '#003B71', // Blue from Image 1
    footerText: '#A0B4CC', // Light blue-gray from footer image
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 110,
        paddingHorizontal: 40,
        fontSize: 8,
        fontType: 'Helvetica',
        color: C.black,
        backgroundColor: C.white,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    headerContainer: {
        marginBottom: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: C.primary,
    },
    subtitle: {
        fontSize: 8,
        color: '#666666',
        marginTop: 2,
    },
    headerLine: {
        borderBottomWidth: 2,
        borderBottomColor: C.primary,
        width: '100%',
        marginTop: 2,
    },
    logo: { width: 35, height: 35 },

    // ── Metadata Section ────────────────────────────────────────────────────
    metaSection: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: C.primary,
        paddingVertical: 6,
        marginBottom: 8,
        gap: 20
    },
    metaCol: {
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    metaLabel: {
        width: 75,
        fontWeight: 'bold',
        fontSize: 7.5,
        color: C.primary,
    },
    metaValue: {
        flex: 1,
        fontSize: 8,
        color: '#444444',
    },

    // ── Section ──────────────────────────────────────────────────────────────
    section: { marginTop: 5 },
    sectionHeader: {
        borderBottomWidth: 1.5,
        borderBottomColor: C.primary,
        marginBottom: 5,
        paddingBottom: 2,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: C.primary,
        backgroundColor: '#F7FAFC',
        paddingVertical: 3,
        paddingHorizontal: 6,
        borderRadius: 2,
        marginBottom: 2,
        borderLeftWidth: 3,
        borderLeftColor: C.primary,
    },

    // ── Tables ───────────────────────────────────────────────────────────────
    table: {
        marginBottom: 10
    },
    tableRowHead: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: C.primary,
        paddingVertical: 3
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#AAAAAA',
        borderStyle: 'dashed' as any,
        paddingVertical: 4
    },
    tableRowLast: {
        flexDirection: 'row',
        paddingVertical: 4
    },
    thCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: C.primary
    },
    tdCell: {
        fontSize: 8
    },
    tdCellRight: {
        fontSize: 8,
        textAlign: 'right'
    },

    // ── Asset Section (Atividades Realizadas) ───────────────────────────────
    assetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: C.black,
        paddingVertical: 2,
        marginBottom: 2,
    },
    assetTitle: { fontSize: 9, fontWeight: 'bold' },
    assetId: { fontSize: 9, fontWeight: 'bold' },

    assetCompareRow: {
        flexDirection: 'row',
        gap: 0,
    },
    compareCol: {
        flex: 1,
    },
    compareTitle: {
        fontSize: 8.5,
        fontWeight: 'bold',
        borderBottomWidth: 1,
        borderBottomColor: C.primary,
        marginBottom: 4,
        marginRight: 10
    },

    // ── Photos In-Cell ───────────────────────────────────────────────────────
    photoGrid: {
        flexDirection: 'row',
        gap: 5,
        marginTop: 5,
    },
    photoWrapper: {
        alignItems: 'center',
        width: 80,
    },
    photo: {
        width: 75,
        height: 75,
        borderRadius: 4,
        objectFit: 'cover' as any,
    },
    compareComments: {
        fontSize: 8.5,
        marginTop: 6,
        color: '#333333',
        fontStyle: 'italic',
        lineHeight: 1.3,
        paddingRight: 10
    },
    photoCaption: {
        fontSize: 6,
        marginTop: 2,
        color: '#666666',
        fontWeight: 'bold',
        textAlign: 'center',
    },

    // ── Approval Section (Fixed at bottom) ──────────────────────────────────
    approvalSection: {
        position: 'absolute',
        bottom: 55,
        left: 40,
        right: 40,
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    approvalCol: {
        flex: 1,
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    approvalLabel: {
        fontSize: 7.5,
        fontWeight: 'bold',
    },
    approvalValue: {
        fontSize: 7,
        color: C.gray,
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 2.5,
        borderTopColor: C.primary,
        paddingTop: 8,
    },
    footerText: {
        fontSize: 7,
        color: C.footerText,
        fontFamily: 'Helvetica',
    },

    // ── Checklist Section ──────────────────────────────────────────────────
    checklistContainer: {
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: 4,
        overflow: 'hidden',
    },
    checklistRowHead: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    checklistSectionRow: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 3,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    checklistSectionText: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#475569',
        textTransform: 'uppercase',
    },
    checklistRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingVertical: 4,
        paddingHorizontal: 6,
        alignItems: 'center',
    },
    checklistCellDesc: { flex: 1, fontSize: 7, color: '#334155' },
    checklistCellStatus: { width: 40, textAlign: 'center' },
    checklistCellComment: { width: 100, fontSize: 6, color: '#64748b', fontStyle: 'italic', marginLeft: 10 },
    
    // ── Checklist Layout (Cards) ──────────────────────────────────────────
    checklistHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 10,
        marginBottom: 4,
        paddingHorizontal: 4,
    },
    planTitle: { fontSize: 9, fontWeight: 'bold', color: C.primary },
    planCode: { fontSize: 7, color: '#64748B', marginTop: 1 },
    planProgress: { fontSize: 8, fontWeight: 'bold', color: C.primary },

    activityCard: {
        marginBottom: 6,
        padding: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    activityDesc: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#1E293B' },
    activityStatus: { fontSize: 7, fontWeight: 'bold', marginLeft: 10 },
    
    activityComment: {
        fontSize: 7,
        color: '#475569',
        backgroundColor: '#F8FAFC',
        padding: 4,
        borderRadius: 2,
        marginTop: 4,
        borderLeftWidth: 2,
        borderLeftColor: '#E2E8F0',
    },
    activityImages: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
        gap: 4,
    },
    activityImage: {
        width: 80,
        height: 60,
        borderRadius: 2,
        objectFit: 'cover',
    },
    
    badgeOk: {
        fontSize: 6,
        fontWeight: 'black',
        color: '#059669',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
        textAlign: 'center',
    },
    badgeNotOk: {
        fontSize: 6,
        fontWeight: 'black',
        color: '#DC2626',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
        textAlign: 'center',
    },
    badgeNull: {
        fontSize: 6,
        fontWeight: 'black',
        color: '#94A3B8',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
        textAlign: 'center',
    },
});


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface VisitReportData {
    // Visit details
    visit: {
        id: string;
        ovMask?: string;
        orderMask?: string;
        ovStatusId?: number;
        statusDescription?: string;
        processingDescription?: string;
        ovStartedAt?: string;
        ovEndedAt?: string;
        ovDurationHours?: number;
        ovComments?: string;
        teamLeaderName?: string;
        priority?: string;
        requesterName?: string;
        contactPhone?: string;
        sectorDescription?: string;
        // Order fields
        unitDescription?: string;
        systemDescription?: string;
        clientName?: string;
        assetTagDescription?: string;
        assetTagSubDescription?: string;
        requestedServices?: string;
        contractDescription?: string;
        planDescription?: string;
        teamCode?: string;
        reason?: string;
        cause?: string;
        observation?: string;
        // Values
        servicesValue?: number;
        materialsValue?: number;
        vehiclesValue?: number;
        totalValue?: number;
        // Counts
        ovAssetsAmount?: number;
        // Approval audit trail
        reportedAt?: string;
        reportedUserNameShort?: string;
        revisedAt?: string;
        revisedUserNameShort?: string;
        disapprovedAt?: string;
        disapprovedUserNameShort?: string;
        approvedAt?: string;
        approvedUserNameShort?: string;
        approvedFiledAt?: string;
        approvedFiledUserNameShort?: string;
    };
    // Team members
    team: Array<{
        id: string;
        userName?: string;
        isLeader?: boolean;
        userAvatarUrl?: string;
    }>;
    // Services
    services: Array<{
        id: string;
        serviceDescription?: string;
        serviceCode?: string;
        amount?: number;
        serviceUnit?: string;
        valueUnit?: number;
        discount?: number;
        valueTotal?: number;
    }>;
    // Vehicles
    vehicles: Array<{
        id: string;
        description?: string;
        plates?: string;
        recorderStart?: number;
        recorderEnd?: number;
        amount?: number;
        unit?: string;
        valueTotal?: number;
    }>;
    // Assets with their interventions, activities and photos
    assets: Array<{
        id: string;
        assetId?: string;
        code?: string;
        description?: string;
        brand?: string;
        model?: string;
        serial?: string;
        location?: string;
        beforeUnitDescription?: string;
        afterUnitDescription?: string;
        beforeStatusDescription?: string;
        afterStatusDescription?: string;
        beforeTagDescription?: string;
        afterTagDescription?: string;
        beforeTagSubDescription?: string;
        afterTagSubDescription?: string;
        beforeComments?: string;
        afterComments?: string;
        isMoved?: boolean;
        movedComments?: string;
        processingId?: number;
        maintenancePlanId?: string;
        maintenancePlanName?: string;
        maintenancePlanCode?: string;
        maintenancePlanProgress?: number;
        activitiesDescription?: string;
        initialPhotoUrls?: (string | undefined)[];
        finalPhotoUrls?: (string | undefined)[];
        activities?: Array<{ 
            activityDescription?: string; 
            activityCode?: string;
            isOk?: boolean | null;
            comments?: string;
            imgFilesNames?: string[];
            photosBase64?: string[];
            sectionDescription?: string;
            sectionOrder?: number;
            activityOrder?: number;
        }>;
        materials?: Array<{ description?: string; code?: string; amount?: number; unit?: string; valueUnit?: number; discount?: number; valueTotal?: number }>;
    }>;
    // Additional visit-level photos (optional, from order)
    orderPhotoUrls?: (string | undefined)[];
    // Logo pré-convertido para base64 (necessário no APK/Capacitor)
    logoBase64?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (val: any, fallback = '—') => {
    if (val === undefined || val === null || val === '') return fallback;
    const s = String(val).trim();
    return s || fallback;
};

const fmtFullDate = (val: string | undefined | null) => {
    if (!val) return '—';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return val;
    }
};

const fmtDate = (val: string | undefined | null) => {
    if (!val) return '—';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleDateString('pt-BR');
    } catch {
        return val;
    }
};

const fmtTime = (val: string | undefined | null) => {
    if (!val) return '—';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '—';
    }
};

const fmtDuration = (hours: any): string => {
    const n = parseFloat(hours);
    if (isNaN(n)) return '—';
    const h = Math.floor(n);
    const m = Math.round((n - h) * 60);
    if (h === 0 && m === 0) return '0min';
    let res = h > 0 ? `${h}h ` : '';
    if (m > 0 || h === 0) res += `${m}min`;
    return res.trim();
};

const fmtCurrency = (val: any) => {
    const n = parseFloat(val);
    if (isNaN(n)) return 'R$ 0,00';
    return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Reusable Meta Row
const MetaRow = ({ label, value }: { label: string; value: any }) => (
    <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>{label}:</Text>
        <Text style={styles.metaValue}>{fmt(value)}</Text>
    </View>
);

// ---------------------------------------------------------------------------
// Main Document
// ---------------------------------------------------------------------------
export const VisitReportDocument = ({ data }: { data: VisitReportData }) => {
    const { visit, team = [], vehicles = [], services = [], assets = [] } = data;

    // Safe date for footer
    const now = new Date();
    const generatedAt = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Format team string safely
    const teamString = (team || []).map(m => m.userName).filter(Boolean).join(', ');

    return (
        <Document title={`Relatório de Visita ${visit.ovMask || visit.id}`}>
            <Page size="A4" style={styles.page}>

                {/* ── HEADER ──────────────────────────────────────────────── */}
                <View style={styles.headerContainer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Relatório de Visita Técnica</Text>
                        </View>
                        {data.logoBase64 ? <Image src={data.logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* ── DADOS DA ORDEM DE SERVIÇO ───────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dados da Ordem de Serviço</Text>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        <View style={styles.metaCol}>
                            <MetaRow label="OS" value={visit.orderMask} />
                            <MetaRow label="CLIENTE" value={visit.clientName} />
                            <MetaRow label="SOLICITANTE" value={visit.requesterName} />
                            <MetaRow label="CONTATO" value={visit.contactPhone} />
                            <MetaRow label="PRIORIDADE" value={visit.priority || "NORMAL"} />
                        </View>
                        <View style={styles.metaCol}>
                            <MetaRow label="UNIDADE" value={visit.unitDescription} />
                            <MetaRow label="SETOR" value={visit.sectorDescription || visit.systemDescription} />
                            <MetaRow label="CONTRATO" value={visit.contractDescription} />
                            <MetaRow label="PLANO" value={visit.planDescription} />
                        </View>
                    </View>
                    <MetaRow label="OS SERVIÇOS" value={visit.requestedServices} />
                </View>

                {/* ── DADOS DA VISITA ─────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dados da Visita</Text>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        <View style={styles.metaCol}>
                            <MetaRow label="VISITA" value={visit.ovMask || visit.id} />
                            <MetaRow label="INÍCIO" value={`${fmtDate(visit.ovStartedAt)} ${fmtTime(visit.ovStartedAt)}h`} />
                            <MetaRow label="FIM" value={`${fmtDate(visit.ovEndedAt)} ${fmtTime(visit.ovEndedAt)}h`} />
                            <MetaRow label="DURAÇÃO" value={fmtDuration(visit.ovDurationHours)} />
                        </View>
                        <View style={styles.metaCol}>
                            <MetaRow label="SITUAÇÃO" value={visit.statusDescription} />
                            <MetaRow label="RESPONSÁVEL" value={teamString} />
                            <MetaRow label="MOTIVO" value={visit.reason} />
                            <MetaRow label="CAUSA" value={visit.cause} />
                        </View>
                    </View>
                    <View style={{ marginTop: 5 }}>
                        <MetaRow label="OBSERVAÇÕES" value={visit.observation || visit.ovComments} />
                    </View>
                </View>

                {/* ── CUSTOS SUMMARY ─────────────────────────────────────── */}
                <View style={[styles.section, { marginTop: 5 }]}>
                    <Text style={[styles.sectionTitle, { marginBottom: 2 }]}>Custos:</Text>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.primary, paddingBottom: 2 }}>
                        <Text style={[styles.thCell, { width: '25%', textAlign: 'center' }]}>R$ Materiais</Text>
                        <Text style={[styles.thCell, { width: '25%', textAlign: 'center' }]}>R$ Serviços</Text>
                        <Text style={[styles.thCell, { width: '25%', textAlign: 'center' }]}>R$ Transporte</Text>
                        <Text style={[styles.thCell, { width: '25%', textAlign: 'center' }]}>R$ Total</Text>
                    </View>
                    <View style={{ flexDirection: 'row', paddingTop: 2 }}>
                        <Text style={[styles.tdCell, { width: '25%', textAlign: 'center' }]}>{fmtCurrency(visit.materialsValue)}</Text>
                        <Text style={[styles.tdCell, { width: '25%', textAlign: 'center' }]}>{fmtCurrency(visit.servicesValue)}</Text>
                        <Text style={[styles.tdCell, { width: '25%', textAlign: 'center' }]}>{fmtCurrency(visit.vehiclesValue)}</Text>
                        <Text style={[styles.tdCell, { width: '25%', textAlign: 'center' }]}>{fmtCurrency(visit.totalValue)}</Text>
                    </View>
                </View>

                {/* ── SERVIÇOS EXECUTADOS TABLE ───────────────────────────── */}
                {services && services.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Serviços</Text>
                        <View style={styles.table}>
                            <View style={styles.tableRowHead}>
                                <Text style={[styles.thCell, { width: '40%' }]}>DESCRIÇÃO</Text>
                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>QTE</Text>
                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>R$ UNIT</Text>
                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>A/D</Text>
                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>R$ ITEM</Text>
                            </View>
                            {services.map((s, idx) => (
                                <View key={s.id} style={styles.tableRow}>
                                    <Text style={[styles.tdCell, { width: '40%' }]}>{fmt(s.serviceDescription)}</Text>
                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{s.amount?.toFixed(2)} {s.serviceUnit}</Text>
                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{fmtCurrency(s.valueUnit)}</Text>
                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{s.discount?.toFixed(4) || '1.0000'}</Text>
                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{fmtCurrency(s.valueTotal)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* ── TRANSPORTE TABLE ───────────────────────────────────── */}
                {vehicles && vehicles.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Transporte</Text>
                        <View style={styles.table}>
                            <View style={styles.tableRowHead}>
                                <Text style={[styles.thCell, { width: '40%' }]}>VEÍCULO / PLACA</Text>
                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>QTE</Text>
                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>R$ UNIT</Text>
                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>A/D</Text>
                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>R$ ITEM</Text>
                            </View>
                            {vehicles.map((v, idx) => (
                                <View key={v.id} style={styles.tableRow}>
                                    <Text style={[styles.tdCell, { width: '40%' }]}>{fmt(v.plates || v.description)}</Text>
                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{v.amount?.toFixed(2)} {v.unit || 'Km'}</Text>
                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{fmtCurrency(v.valueTotal ? (v.valueTotal / (v.amount || 1)) : 0)}</Text>
                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>1.0000</Text>
                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{fmtCurrency(v.valueTotal)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* ── ATIVIDADES REALIZADAS (ASSETS) ──────────────────────── */}
                {assets && assets.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Atividades Realizadas</Text>
                        {assets.map((asset, assetIdx) => {
                            const activities = asset.activitiesDescription || (asset.activities ?? []).map(act => act.activityDescription).join(', ');
                            const assetMaterialsValue = (asset.materials ?? []).reduce((acc, m) => acc + (m.valueTotal || 0), 0);
                            const assetsAmount = visit.ovAssetsAmount || 1;
                            const servicesRateio = (visit.servicesValue || 0) / assetsAmount;
                            const vehiclesRateio = (visit.vehiclesValue || 0) / assetsAmount;
                            const assetTotalValue = assetMaterialsValue + servicesRateio + vehiclesRateio;

                            return (
                                <View key={asset.id} style={{ marginTop: assetIdx === 0 ? 0 : 10 }} break={assetIdx > 0}>
                                    <View style={styles.assetHeader}>
                                        <Text style={styles.assetTitle}>{fmt(asset.description)}</Text>
                                        <Text style={styles.assetId}>{fmt(asset.code || asset.id)}</Text>
                                    </View>

                                    <View style={styles.assetCompareRow}>
                                        <View style={styles.compareCol}>
                                            <Text style={styles.compareTitle}>ANTES</Text>
                                            <Text style={styles.tdCell}>{fmt(asset.beforeUnitDescription)}</Text>
                                            <View style={{ flexDirection: 'row', gap: 2 }}>
                                                <Text style={styles.tdCell}>{fmt(asset.beforeTagDescription)}</Text>
                                                <Text style={styles.tdCell}>({fmt(asset.beforeTagSubDescription, 'SEM POSICAO')})</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 5 }}>
                                                <Text style={styles.tdCell}>{fmt(asset.beforeStatusDescription)}</Text>
                                            </View>

                                            <View style={styles.photoGrid}>
                                                {(asset.initialPhotoUrls ?? []).filter(Boolean).slice(0, 3).map((url, pi) => (
                                                    <View key={pi} style={styles.photoWrapper}>
                                                        <Image src={url as string} style={styles.photo} />
                                                    </View>
                                                ))}
                                                {!(asset.initialPhotoUrls?.filter(Boolean).length) ? (
                                                    <View style={styles.photoWrapper}>
                                                        {data.logoBase64 ? (
                                                            <Image src={data.logoBase64} style={[styles.photo, { opacity: 0.1 }]} />
                                                        ) : null}
                                                    </View>
                                                ) : null}
                                            </View>
                                            {asset.beforeComments ? (
                                                <Text style={styles.compareComments}>{asset.beforeComments}</Text>
                                            ) : null}
                                        </View>

                                        <View style={styles.compareCol}>
                                            <Text style={styles.compareTitle}>DEPOIS</Text>
                                            <Text style={styles.tdCell}>{fmt(asset.afterUnitDescription)}</Text>
                                            <View style={{ flexDirection: 'row', gap: 2 }}>
                                                <Text style={styles.tdCell}>{fmt(asset.afterTagDescription)}</Text>
                                                <Text style={styles.tdCell}>({fmt(asset.afterTagSubDescription, 'SEM POSICAO')})</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 5 }}>
                                                <Text style={styles.tdCell}>{fmt(asset.afterStatusDescription)}</Text>
                                            </View>

                                            <View style={styles.photoGrid}>
                                                {(asset.finalPhotoUrls ?? []).filter(Boolean).slice(0, 3).map((url, pi) => (
                                                    <View key={pi} style={styles.photoWrapper}>
                                                        <Image src={url as string} style={styles.photo} />
                                                    </View>
                                                ))}
                                                {!(asset.finalPhotoUrls?.filter(Boolean).length) ? (
                                                    <View style={styles.photoWrapper}>
                                                        {data.logoBase64 ? (
                                                            <Image src={data.logoBase64} style={[styles.photo, { opacity: 0.1 }]} />
                                                        ) : null}
                                                    </View>
                                                ) : null}
                                            </View>
                                            {asset.afterComments ? (
                                                <Text style={styles.compareComments}>{asset.afterComments}</Text>
                                            ) : null}
                                        </View>
                                    </View>

                                    <View style={{ marginTop: 5 }}>
                                        <Text style={styles.tdCell}>
                                            <Text style={{ fontWeight: 'bold' }}>Intervenções: </Text>
                                            {activities || 'LIGADO EQUIPAMENTO'}
                                        </Text>
                                    </View>

                                    {/* Maintenance Plan Checklist */}
                                    {!!asset.maintenancePlanId && 
                                     asset.maintenancePlanId.trim() !== '' && 
                                     asset.maintenancePlanId.trim() !== '0' && 
                                     asset.maintenancePlanId.trim() !== 'null' && 
                                     asset.activities && asset.activities.length > 0 && (
                                        <View style={{ marginTop: 10 }}>
                                            {/* Plan Header */}
                                            <View style={styles.checklistHeader}>
                                                <View>
                                                    <Text style={styles.planTitle}>{asset.maintenancePlanName || 'PLANO DE MANUTENÇÃO'}</Text>
                                                    {asset.maintenancePlanCode && (
                                                        <Text style={styles.planCode}>Código: {asset.maintenancePlanCode}</Text>
                                                    )}
                                                </View>
                                                <Text style={styles.planProgress}>Progresso: {asset.maintenancePlanProgress || 0}%</Text>
                                            </View>

                                            {asset.activities.map((act, actIdx) => {
                                                const showSection = actIdx === 0 || act.sectionDescription !== asset.activities[actIdx - 1]?.sectionDescription;
                                                return (
                                                    <React.Fragment key={actIdx}>
                                                        {showSection && (
                                                            <View style={styles.checklistSectionRow}>
                                                                <Text style={styles.checklistSectionText}>{act.sectionDescription || 'ATIVIDADES'}</Text>
                                                            </View>
                                                        )}
                                                        
                                                        <View style={styles.activityCard}>
                                                            <View style={styles.activityHeader}>
                                                                <Text style={styles.activityDesc}>{actIdx + 1}. {act.activityDescription}</Text>
                                                                <Text style={[
                                                                    styles.activityStatus, 
                                                                    { color: act.isOk === true ? '#10B981' : (act.isOk === false ? '#EF4444' : '#64748B') }
                                                                ]}>
                                                                    {act.isOk === true ? '● OK' : (act.isOk === false ? '● NÃO OK' : '● —')}
                                                                </Text>
                                                            </View>

                                                            {act.comments && (
                                                                <Text style={styles.activityComment}>{act.comments}</Text>
                                                            )}

                                                            {act.photosBase64 && act.photosBase64.length > 0 && (
                                                                <View style={styles.activityImages}>
                                                                    {act.photosBase64.map((img, imgIdx) => (
                                                                        <Image key={imgIdx} src={img} style={styles.activityImage} />
                                                                    ))}
                                                                </View>
                                                            )}
                                                        </View>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </View>
                                    )}

                                    {asset.materials && asset.materials.length > 0 ? (
                                        <View style={{ marginTop: 8 }}>
                                            <View style={styles.tableRowHead}>
                                                <Text style={[styles.thCell, { width: '40%' }]}>MATERIAIS</Text>
                                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>QTE</Text>
                                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>R$ UNIT</Text>
                                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>A/D</Text>
                                                <Text style={[styles.thCell, { width: '15%', textAlign: 'right' }]}>R$ ITEM</Text>
                                            </View>
                                            {asset.materials.map((m, mIdx) => (
                                                <View key={mIdx} style={styles.tableRow}>
                                                    <Text style={[styles.tdCell, { width: '40%' }]}>{m.description}</Text>
                                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{m.amount?.toFixed(2)} {m.unit}</Text>
                                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{fmtCurrency(m.valueUnit)}</Text>
                                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{m.discount?.toFixed(4) || '1.0000'}</Text>
                                                    <Text style={[styles.tdCellRight, { width: '15%' }]}>{fmtCurrency(m.valueTotal)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    ) : null}

                                    <View style={{ marginTop: 15 }}>
                                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.black, borderStyle: 'dashed' as any, paddingBottom: 2 }}>
                                            <Text style={[styles.thCell, { width: '25%', fontSize: 7 }]}>Custo por Ativo:</Text>
                                            <Text style={[styles.thCell, { width: '20%', textAlign: 'right', fontSize: 7 }]}>R$ Materiais</Text>
                                            <Text style={[styles.thCell, { width: '20%', textAlign: 'right', fontSize: 7 }]}>R$ Serviços (Rateio)</Text>
                                            <Text style={[styles.thCell, { width: '20%', textAlign: 'right', fontSize: 7 }]}>R$ Transporte (Rateio)</Text>
                                            <Text style={[styles.thCell, { width: '15%', textAlign: 'right', fontSize: 7 }]}>R$ Total</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', paddingTop: 2 }}>
                                            <Text style={[styles.tdCell, { width: '25%' }]}></Text>
                                            <Text style={[styles.tdCellRight, { width: '20%', fontSize: 7 }]}>{fmtCurrency(assetMaterialsValue)}</Text>
                                            <Text style={[styles.tdCellRight, { width: '20%', fontSize: 7 }]}>{fmtCurrency(servicesRateio)}</Text>
                                            <Text style={[styles.tdCellRight, { width: '20%', fontSize: 7 }]}>{fmtCurrency(vehiclesRateio)}</Text>
                                            <Text style={[styles.tdCellRight, { width: '15%', fontSize: 7 }]}>{fmtCurrency(assetTotalValue)}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : null}

                {/* ── QUADRO DE APROVAÇÕES ──────────────────────────────────── */}
                <View style={styles.approvalSection} fixed>
                    <View style={styles.approvalCol}>
                        <Text style={styles.approvalLabel}>Reportado</Text>
                        <Text style={styles.approvalValue}>{fmtFullDate(visit.reportedAt)}</Text>
                        <Text style={styles.approvalValue}>{fmt(visit.reportedUserNameShort, '')}</Text>
                    </View>
                    <View style={styles.approvalCol}>
                        <Text style={styles.approvalLabel}>Revisado</Text>
                        <Text style={styles.approvalValue}>{fmtFullDate(visit.revisedAt)}</Text>
                        <Text style={styles.approvalValue}>{fmt(visit.revisedUserNameShort, '')}</Text>
                    </View>
                    <View style={styles.approvalCol}>
                        <Text style={styles.approvalLabel}>Rejeitado</Text>
                        <Text style={styles.approvalValue}>{fmtFullDate(visit.disapprovedAt)}</Text>
                        <Text style={styles.approvalValue}>{fmt(visit.disapprovedUserNameShort, '')}</Text>
                    </View>
                    <View style={styles.approvalCol}>
                        <Text style={styles.approvalLabel}>Aprovado</Text>
                        <Text style={styles.approvalValue}>{fmtFullDate(visit.approvedAt)}</Text>
                        <Text style={styles.approvalValue}>{fmt(visit.approvedUserNameShort, '')}</Text>
                    </View>
                    <View style={styles.approvalCol}>
                        <Text style={styles.approvalLabel}>Arquivado</Text>
                        <Text style={styles.approvalValue}>{fmtFullDate(visit.approvedFiledAt)}</Text>
                        <Text style={styles.approvalValue}>{fmt(visit.approvedFiledUserNameShort, '')}</Text>
                    </View>
                </View>

                {/* ── FOOTER ──────────────────────────────────────────────── */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Gerado em {generatedAt}</Text>
                    <Text
                        style={styles.footerText}
                        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
};
