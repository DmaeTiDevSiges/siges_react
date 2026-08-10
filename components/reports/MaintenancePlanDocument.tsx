import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity } from '../../types';

// ---------------------------------------------------------------------------
// Styles (Based on VisitReportDocument)
// ---------------------------------------------------------------------------
const C = {
    black: '#000000',
    gray: '#333333',
    lightGray: '#999991',
    white: '#FFFFFF',
    border: '#000000',
    divider: '#000000',
    primary: '#003B71',
    footerText: '#A0B4CC',
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 30,
        paddingBottom: 70,
        paddingHorizontal: 40,
        fontSize: 9,
        fontFamily: 'Helvetica',
        color: C.black,
        backgroundColor: C.white,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    headerContainer: {
        marginBottom: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: C.primary,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 9,
        color: '#666666',
        marginTop: 2,
    },
    headerLine: {
        borderBottomWidth: 2,
        borderBottomColor: C.primary,
        width: '100%',
        marginTop: 5,
    },
    logo: { width: 45, height: 45 },

    // ── Content ─────────────────────────────────────────────────────────────
    planInfo: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: C.primary,
    },
    planLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: C.primary,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    planDescription: {
        fontSize: 12,
        fontWeight: 'bold',
        color: C.black,
    },
    planCode: {
        fontSize: 9,
        color: '#64748B',
        marginTop: 1,
    },

    // ── Section ──────────────────────────────────────────────────────────────
    section: { 
        marginTop: 15,
        break: 'auto'
    },
    sectionHeader: {
        backgroundColor: C.primary,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 2,
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: C.white,
        textTransform: 'uppercase',
    },

    // ── Activities ──────────────────────────────────────────────────────────
    activityRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 6,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    activityNumber: {
        width: 25,
        fontSize: 8,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    activityText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: C.gray,
    },
    activitySubText: {
        fontSize: 8,
        color: '#475569',
        marginTop: 2,
    },
    activityComments: {
        fontSize: 7,
        color: '#64748B',
        fontStyle: 'italic',
        marginTop: 3,
        paddingLeft: 5,
        borderLeftWidth: 1,
        borderLeftColor: '#CBD5E1',
    },
    activityCode: {
        fontSize: 8,
        color: '#94A3B8',
        marginLeft: 10,
    },

    // ── Footer ──────────────────────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 2,
        borderTopColor: C.primary,
        paddingTop: 8,
    },
    footerText: {
        fontSize: 7,
        color: C.footerText,
    },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (val: any) => val || '—';

interface MaintenancePlanDocumentProps {
    plan: MaintenancePlan;
    sections: Array<MaintenancePlanSection & { activities: MaintenancePlanSectionActivity[] }>;
    logoBase64?: string;
}

export const MaintenancePlanDocument: React.FC<MaintenancePlanDocumentProps> = ({ plan, sections, logoBase64 }) => {
    const now = new Date();
    const generatedAt = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return (
        <Document title={`Plano de Manutenção - ${plan.description}`}>
            <Page size="A4" style={styles.page}>
                
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Plano de Manutenção</Text>
                            <Text style={styles.subtitle}>Detalhamento de Atividades e Ciclos</Text>
                        </View>
                        {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    </View>
                    <View style={styles.headerLine} />
                </View>

                {/* Plan Info */}
                <View style={styles.planInfo}>
                    <Text style={styles.planLabel}>Identificação do Plano</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                    <Text style={styles.planCode}>Código: {plan.code || 'N/A'}</Text>
                </View>

                {/* Sections and Activities */}
                {sections.map((section, sIdx) => (
                    <View key={section.id} style={styles.section} wrap={false}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{sIdx + 1}. {section.description}</Text>
                        </View>
                        
                        {section.activities.filter(a => !a.isDeleted).map((activity, aIdx) => (
                            <View key={activity.id} style={styles.activityRow}>
                                <Text style={styles.activityNumber}>{(aIdx + 1).toString().padStart(2, '0')}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activityText}>{activity.activityDescription}</Text>
                                    
                                    {activity.description && activity.description !== activity.activityDescription && (
                                        <Text style={styles.activitySubText}>{activity.description}</Text>
                                    )}

                                    {activity.commentsDefault && (
                                        <Text style={styles.activityComments}>Obs: {activity.commentsDefault}</Text>
                                    )}
                                </View>
                                {activity.activityCode && (
                                    <Text style={styles.activityCode}>{activity.activityCode}</Text>
                                )}
                            </View>
                        ))}

                        {section.activities.filter(a => !a.isDeleted).length === 0 && (
                            <View style={[styles.activityRow, { borderBottomWidth: 0 }]}>
                                <Text style={[styles.activityText, { color: '#94A3B8', fontStyle: 'italic' }]}>
                                    Nenhuma atividade vinculada nesta seção.
                                </Text>
                            </View>
                        )}
                    </View>
                ))}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Gerado pelo Sistema SIGES em {generatedAt}</Text>
                    <Text
                        style={styles.footerText}
                        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                    />
                </View>

            </Page>
        </Document>
    );
};
