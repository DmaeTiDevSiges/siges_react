import React, { useState, useEffect } from 'react';
import { MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity, AssetType } from '../../../types';
import { dataService } from '../../../services/dataService';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { IconButton } from '../../../components/ui/IconButton';
import { MaintenancePlanPDFButton } from '../../../components/reports/MaintenancePlanPDFButton';
import { Button } from '../../../components/ui/Button';

interface MaintenancePlanDetailsProps {
    planId: string;
    onEdit: () => void;
    onBack: () => void;
}

export const MaintenancePlanDetails: React.FC<MaintenancePlanDetailsProps> = ({ planId, onEdit, onBack }) => {
    const [plan, setPlan] = useState<MaintenancePlan | null>(null);
    const [sections, setSections] = useState<Array<MaintenancePlanSection & { activities: MaintenancePlanSectionActivity[] }>>([]);
    const [assetType, setAssetType] = useState<AssetType | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showMenu && !target.closest('.menu-container')) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const fetchedPlan = await dataService.getMaintenancePlanById(planId);
                if (fetchedPlan) {
                    setPlan(fetchedPlan);

                    // Fetch sections
                    const fetchedSections = await dataService.getMaintenancePlanSections(planId);
                    
                    // Fetch activities for each section
                    const sectionsWithActivities = await Promise.all(fetchedSections.map(async (sec) => {
                        const acts = await dataService.getMaintenancePlanSectionActivities(sec.id);
                        return {
                            ...sec,
                            activities: acts
                        };
                    }));

                    setSections(sectionsWithActivities);

                    // Fetch Asset Type if exists
                    if (fetchedPlan.assetTypeId) {
                        const allAssetTypes = await dataService.getAssetTypes();
                        const foundType = allAssetTypes.find(t => t.id === fetchedPlan.assetTypeId);
                        if (foundType) setAssetType(foundType);
                    }
                }
            } catch (error) {
                console.error('Error fetching plan details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [planId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando detalhes...</p>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="p-8 text-center text-red-500">
                Plano não encontrado.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500 overflow-y-auto pb-32">
            {/* Hero Section */}
            <div className="relative h-48 w-full shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
                <img
                    src="/hero-bg.png"
                    alt="Background"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out scale-105"
                />
                
                {/* Top Actions: PDF and Status */}
                <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
                    <MaintenancePlanPDFButton 
                        planId={plan.id} 
                        variant="action"
                    />
                    <StatusBadge status={plan.isAvailable ? 'active' : 'inactive'} size="md" />
                    
                    {/* Menu Button */}
                    <div className="relative menu-container">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>

                        {showMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                <button 
                                    onClick={() => {
                                        setShowMenu(false);
                                        onEdit();
                                    }}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-white/10 transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-blue-400">edit</span>
                                    <span className="text-sm font-bold uppercase tracking-tight">Editar</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Title and Badge */}
                <div className="absolute bottom-5 left-5 right-5 z-20">
                    <div className="mb-2 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <span className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">
                            Detalhes do Plano
                        </span>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            {plan.code && (
                                <span className="text-sm font-bold text-blue-300 tracking-wider uppercase">
                                    {plan.code}
                                </span>
                            )}
                            <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight truncate">
                                {plan.description}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-20 max-w-4xl mx-auto w-full px-5 py-8 space-y-8 pb-32">
                {/* General Info Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Ativo</p>
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                    <span className="material-symbols-outlined">category</span>
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                    {assetType ? assetType.description : 'Genérico / Todos'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Código do Plano</p>
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500">
                                    <span className="material-symbols-outlined">qr_code</span>
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                    {plan.code || 'NÃO DEFINIDO'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checklist Sections */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                            <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                        </div>
                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Estrutura de Manutenção</h2>
                    </div>

                    {sections.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <span className="material-symbols-outlined text-4xl">inventory_2</span>
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Este plano não possui seções cadastradas.</p>
                        </div>
                    ) : (
                        sections.map((section, sIdx) => (
                            <div key={section.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-primary/20">
                                        {sIdx + 1}
                                    </div>
                                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{section.description}</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                    {section.activities.filter(a => !a.isDeleted).map((activity, aIdx) => (
                                        <div 
                                            key={activity.id}
                                            className="group flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 hover:border-primary/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                                        >
                                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 mt-0.5 w-6 shrink-0 tracking-tighter">
                                                {(aIdx + 1).toString().padStart(2, '0')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {activity.activityCode && (
                                                        <span className="text-[10px] font-black text-blue-500 opacity-80 uppercase tracking-wider">[{activity.activityCode}]</span>
                                                    )}
                                                    <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-snug">
                                                        {activity.activityDescription}
                                                    </p>
                                                </div>
                                                {activity.description && activity.description !== activity.activityDescription && (
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                                                        {activity.description}
                                                    </p>
                                                )}
                                                {activity.commentsDefault && (
                                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1.5">
                                                        <span className="font-bold opacity-70">Obs:</span> {activity.commentsDefault}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {section.activities.filter(a => !a.isDeleted).length === 0 && (
                                        <div className="p-4 text-center text-slate-400 italic text-xs border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                            Nenhuma atividade nesta seção.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
