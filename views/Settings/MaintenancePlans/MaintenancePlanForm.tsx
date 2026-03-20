import React, { useState, useEffect } from 'react';
import { MaintenancePlan, MaintenancePlanSection, MaintenancePlanSectionActivity, AssetType, Activity } from '../../../types';
import { dataService } from '../../../services/dataService';
import { IconButton } from '../../../components/ui/IconButton';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { toast } from 'sonner';
import { MaintenancePlanPDFButton } from '../../../components/reports/MaintenancePlanPDFButton';
import { usePermissions } from '../../../contexts/PermissionsContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface MaintenancePlanFormProps {
    planId: string | null;
    onSave: () => void;
    onCancel: () => void;
    userId: string;
}

const SortableSectionItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 40 : 1,
        position: 'relative' as any,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {React.isValidElement(children) 
                ? React.cloneElement(children as React.ReactElement<any>, { dragHandleProps: listeners })
                : children}
        </div>
    );
};

const SortableActivityItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: 'relative' as any,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

interface SectionContentProps {
    section: any;
    sIndex: number;
    realIndex: number;
    handleSectionChange: (index: number, val: string) => void;
    handleRemoveSection: (index: number) => void;
    handleDragEndActivities: (secIndex: number, event: DragEndEvent) => void;
    openActivityModal: (secIndex: number) => void;
    handleRemoveActivity: (secIndex: number, actIndex: number) => void;
    openEditActivityModal: (secIndex: number, actIndex: number) => void;
    sensors: any;
    dragHandleProps?: any;
}

const SectionContent: React.FC<SectionContentProps> = ({ 
    section, 
    sIndex, 
    realIndex, 
    handleSectionChange, 
    handleRemoveSection, 
    handleDragEndActivities,
    openActivityModal,
    handleRemoveActivity,
    openEditActivityModal,
    sensors,
    dragHandleProps
}) => {
    return (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all duration-300 group/section">
            <div className="flex gap-4 items-start mb-6">
                <div {...dragHandleProps} className="mt-8 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400">
                    <span className="material-symbols-outlined">drag_indicator</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-6 md:mt-7 shrink-0">
                    {sIndex + 1}
                </div>
                <div className="flex-1">
                    <Input 
                        label="Nome da Seção"
                        placeholder="Ex: Filtragem, Parte Elétrica..."
                        value={section.description}
                        onChange={e => handleSectionChange(realIndex, e.target.value)}
                        required
                    />
                </div>
                <div className="mt-6 md:mt-7">
                        <IconButton
                        icon="delete"
                        variant="danger"
                        onClick={() => handleRemoveSection(realIndex)}
                        title="Remover Seção"
                    />
                </div>
            </div>

            <div className="space-y-3 pl-0 md:pl-12">
                    <div className="grid grid-cols-1 gap-2.5">
                    <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={(e) => handleDragEndActivities(realIndex, e)}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext 
                            items={section.activities.filter((a: any) => !a.isDeleted).map((a: any) => a.tempId || a.id)} 
                            strategy={verticalListSortingStrategy}
                        >
                            {section.activities.filter((a: any) => !a.isDeleted).map((act: any, aIndex: number) => {
                                const realAIndex = section.activities.findIndex((ac: any) => ac === act);
                                return (
                                    <SortableActivityItem key={act.tempId || act.id} id={act.tempId || act.id}>
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 group hover:border-blue-500/30 transition-all cursor-grab active:cursor-grabbing">
                                            <span className="material-symbols-outlined text-blue-500/60 text-[20px]">check_circle</span>
                                            <div className="flex-1 min-w-0">
                                                <span className="block text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate mb-0.5">
                                                    {act.activityCode ? <span className="text-blue-500 mr-1.5 opacity-80 font-black tracking-wider text-[11px] uppercase">[{act.activityCode}]</span> : null}
                                                    {act.activityDescription}
                                                </span>
                                                {act.description && act.description !== act.activityDescription && (
                                                    <span className="block text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                                                        {act.description}
                                                    </span>
                                                )}
                                                {act.commentsDefault && (
                                                    <span className="block text-xs font-medium text-slate-400 dark:text-slate-500 truncate mt-1">
                                                        <span className="font-bold opacity-70">Obs:</span> {act.commentsDefault}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-1 opacity-40 sm:opacity-100 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditActivityModal(realIndex, realAIndex);
                                                    }}
                                                    title="Editar Detalhes"
                                                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveActivity(realIndex, realAIndex);
                                                    }}
                                                    title="Remover Atividade"
                                                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </SortableActivityItem>
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                    
                    {section.activities.filter((a: any) => !a.isDeleted).length === 0 && (
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-2xl text-slate-400 bg-slate-50/30 dark:bg-transparent">
                            <span className="material-symbols-outlined text-3xl mb-1 opacity-20">search_off</span>
                            <span className="text-xs font-medium italic">Nenhuma atividade vinculada</span>
                        </div>
                    )}
                    </div>
                    <button 
                    onClick={() => openActivityModal(realIndex)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 py-3 rounded-2xl font-bold text-sm hover:border-blue-500/50 hover:text-blue-500 transition-all bg-white/50 dark:bg-transparent"
                    >
                    <span className="material-symbols-outlined text-[20px]">add_task</span>
                    Vincular Atividade
                    </button>
            </div>
        </div>
    );
};

export const MaintenancePlanForm: React.FC<MaintenancePlanFormProps> = ({ planId, onSave, onCancel, userId }) => {
    const isEditing = !!planId;
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    
    // Core Plan Data
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [assetTypeId, setAssetTypeId] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);

    // Types
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);

    // Sections and Activities
    const [sections, setSections] = useState<(MaintenancePlanSection & { tempId?: string; isNew?: boolean; activities: (MaintenancePlanSectionActivity & { tempId?: string; isNew?: boolean })[] })[]>([]);
    
    // Modal state for selecting activity
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(null);
    const [allActivities, setAllActivities] = useState<Activity[]>([]);
    const [activitiesSearch, setActivitiesSearch] = useState('');
    const [selectedActivityForLink, setSelectedActivityForLink] = useState<Activity | null>(null);
    const [activityDescription, setActivityDescription] = useState('');
    const [activityCommentsDefault, setActivityCommentsDefault] = useState('');
    const [editingActivityIndex, setEditingActivityIndex] = useState<{sectionIndex: number, activityIndex: number} | null>(null);

    // Modal state for adding a section
    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [newSectionDescription, setNewSectionDescription] = useState('');
    const bottomRef = React.useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch asset types for dropdown
                const types = await dataService.getAssetTypes('active', '');
                setAssetTypes(types);

                if (isEditing) {
                    const plan = await dataService.getMaintenancePlanById(planId);
                    if (plan) {
                        setCode(plan.code || '');
                        setDescription(plan.description);
                        setAssetTypeId(plan.assetTypeId || '');
                        setIsAvailable(plan.isAvailable);

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
                    }
                }
            } catch (error) {
                console.error('Error fetching plan data:', error);
                alert('Erro ao carregar dados do plano.');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [planId, isEditing]);

    const handleAddSection = () => {
        setNewSectionDescription('');
        setSectionModalOpen(true);
    };

    const confirmAddSection = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newSectionDescription.trim()) {
            toast.error("Informe um nome para a seção");
            return;
        }

        setSections([...sections, {
            id: '',
            tempId: `temp-${Date.now()}`,
            maintenancePlanId: planId || '',
            description: newSectionDescription,
            isAvailable: true,
            isDeleted: false,
            isNew: true,
            activities: []
        }]);

        setSectionModalOpen(false);
        setNewSectionDescription('');

        // Scroll to the bottom exactly after React re-renders with the new section
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    };

    const handleRemoveSection = (index: number) => {
        const sec = sections[index];
        if (sec.isNew) {
            setSections(sections.filter((_, i) => i !== index));
        } else {
            // Mark as deleted to save it later
            const newSections = [...sections];
            newSections[index].isDeleted = true;
            setSections(newSections);
        }
    };

    const handleSectionChange = (index: number, newDesc: string) => {
        const newSections = [...sections];
        newSections[index].description = newDesc;
        setSections(newSections);
    };

    const openActivityModal = async (sectionIndex: number) => {
        setCurrentSectionIndex(sectionIndex);
        setSelectedActivityForLink(null);
        setEditingActivityIndex(null);
        setActivityDescription('');
        setActivityCommentsDefault('');
        setActivityModalOpen(true);
        if (allActivities.length === 0) {
            try {
                const acts = await dataService.getActivities('active', '');
                setAllActivities(acts);
            } catch(e) {
                console.error(e);
            }
        }
    };

    const openEditActivityModal = (sectionIndex: number, activityIndex: number) => {
        const act = sections[sectionIndex].activities[activityIndex];
        setCurrentSectionIndex(sectionIndex);
        setEditingActivityIndex({ sectionIndex, activityIndex });
        
        setSelectedActivityForLink({
            id: act.activityId,
            code: act.activityCode || '',
            description: act.activityDescription || '',
            isAvailable: true
        });
        setActivityDescription(act.description || act.activityDescription || '');
        setActivityCommentsDefault(act.commentsDefault || '');
        setActivityModalOpen(true);
    };

    const handleSelectActivity = (activity: Activity) => {
        if (currentSectionIndex === null) return;
        
        const newSections = [...sections];
        const section = newSections[currentSectionIndex];

        // Check if already in section
        if (section.activities.some(a => a.activityId === activity.id && !a.isDeleted)) {
            toast.error('Esta atividade já foi adicionada a esta seção.');
            return;
        }

        setSelectedActivityForLink(activity);
        setActivityDescription(activity.description);
        setActivityCommentsDefault('');
    };

    const confirmLinkActivity = () => {
        if (currentSectionIndex === null || !selectedActivityForLink) return;

        const newSections = [...sections];
        const section = newSections[currentSectionIndex];

        if (editingActivityIndex) {
            const act = section.activities[editingActivityIndex.activityIndex];
            act.description = activityDescription;
            act.commentsDefault = activityCommentsDefault;
        } else {
            section.activities.push({
                id: '',
                tempId: `temp-act-${Date.now()}`,
                maintenancePlanSectionId: section.id,
                activityId: selectedActivityForLink.id,
                isAvailable: true,
                isDeleted: false,
                isNew: true,
                description: activityDescription,
                commentsDefault: activityCommentsDefault,
                activityDescription: selectedActivityForLink.description,
                activityCode: selectedActivityForLink.code
            });
        }

        setSections(newSections);
        setActivityModalOpen(false);
        setActivitiesSearch('');
        setSelectedActivityForLink(null);
        setEditingActivityIndex(null);
    };

    const handleRemoveActivity = (sectionIndex: number, activityIndex: number) => {
        const newSections = [...sections];
        const act = newSections[sectionIndex].activities[activityIndex];
        if (act.isNew) {
            newSections[sectionIndex].activities = newSections[sectionIndex].activities.filter((_, i) => i !== activityIndex);
        } else {
            newSections[sectionIndex].activities[activityIndex].isDeleted = true;
        }
        setSections(newSections);
    };

    const handleDragEndSections = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((i) => (i.tempId || i.id) === active.id);
                const newIndex = items.findIndex((i) => (i.tempId || i.id) === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleDragEndActivities = (sectionIndex: number, event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSections((prevSections) => {
                const newSections = [...prevSections];
                const section = newSections[sectionIndex];
                const oldIndex = section.activities.findIndex((i) => (i.tempId || i.id) === active.id);
                const newIndex = section.activities.findIndex((i) => (i.tempId || i.id) === over.id);
                section.activities = arrayMove(section.activities, oldIndex, newIndex);
                return newSections;
            });
        }
    };

    const handleSave = async () => {
        if (!description.trim()) {
            alert('A descrição do plano é obrigatória.');
            return;
        }

        const activeSectionsCount = sections.filter(s => !s.isDeleted && s.description.trim()).length;
        if (activeSectionsCount === 0) {
            alert('O plano deve ter pelo menos uma seção com descrição.');
            return;
        }

        try {
            setSaving(true);
            
            // 1. Save Plan
            const planPayload = {
                code,
                description,
                assetTypeId: assetTypeId || null,
                isAvailable
            };

            let savedPlanId = planId;
            if (isEditing && planId) {
                await dataService.updateMaintenancePlan(planId, planPayload, userId);
            } else {
                const newPlan = await dataService.createMaintenancePlan(planPayload, userId);
                savedPlanId = newPlan.id;
            }

            // 2. Save Sections
            let sectionOrder = 0;
            for (const section of sections) {
                if (section.isDeleted && !section.isNew && section.id) {
                    await dataService.updateMaintenancePlanSection(section.id, { isDeleted: true }, userId);
                    continue; // Skip activities if section deleted
                }

                if (!section.isDeleted && section.description.trim()) {
                    let savedSectionId = section.id;
                    
                    if (section.isNew) {
                        const newSec = await dataService.createMaintenancePlanSection({
                            maintenancePlanId: savedPlanId!,
                            description: section.description,
                            isAvailable: true,
                            orderIndex: sectionOrder
                        }, userId);
                        savedSectionId = newSec.id;
                    } else {
                        await dataService.updateMaintenancePlanSection(section.id, {
                            description: section.description,
                            orderIndex: sectionOrder
                        }, userId);
                    }
                    
                    sectionOrder++;

                    // 3. Save Activities for this section
                    let activityOrder = 0;
                    for (const act of section.activities) {
                        if (act.isDeleted && !act.isNew && act.id) {
                            await dataService.removeMaintenancePlanSectionActivity(act.id, userId);
                        } else if (!act.isDeleted) {
                            if (act.isNew) {
                                await dataService.createMaintenancePlanSectionActivity(savedSectionId, act.activityId, userId, activityOrder, act.description, act.commentsDefault);
                            } else if (act.id) {
                                await dataService.updateMaintenancePlanSectionActivity(act.id, { 
                                    orderIndex: activityOrder,
                                    description: act.description,
                                    commentsDefault: act.commentsDefault
                                }, userId);
                            }
                            activityOrder++;
                        }
                    }
                }
            }

            onSave();
        } catch (error) {
            console.error('Error saving maintenance plan:', error);
            alert('Erro ao salvar o plano. Verifique o console para mais detalhes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary">progress_activity</span>
                <p className="font-medium">Carregando plano...</p>
            </div>
        );
    }

    const filteredActivitiesForModal = allActivities.filter(a => 
         a.description.toLowerCase().includes(activitiesSearch.toLowerCase()) || 
         a.code?.toLowerCase().includes(activitiesSearch.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f172a] relative overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {/* Hero Section */}
                <div className="relative h-48 w-full shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
                    <img
                        src="/hero-bg.png"
                        alt="Background"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out scale-105"
                    />
                    <div className="absolute bottom-5 left-5 right-5 z-20">
                        <div className="mb-2 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                             <span className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">
                                {isEditing ? 'Editando Plano' : 'Novo Plano de Manutenção'}
                             </span>
                             {isEditing && (
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    {code && (
                                        <span className="text-sm font-bold text-blue-300 tracking-wider uppercase">
                                            {code}
                                        </span>
                                    )}
                                    <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight truncate">
                                        {description}
                                    </h2>
                                </div>
                             )}
                             {!isEditing && (
                                 <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
                                    Criar Novo Plano
                                </h2>
                             )}
                        </div>
                    </div>
                    {isEditing && (
                        <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
                            <MaintenancePlanPDFButton 
                                planId={planId!} 
                                variant="action"
                            />
                            <div onClick={() => setIsAvailable(!isAvailable)} className="cursor-pointer hover:scale-105 transition-transform active:scale-95">
                                <StatusBadge status={isAvailable ? 'active' : 'inactive'} size="md" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="max-w-4xl mx-auto w-full px-5 py-6 space-y-10">
                    {/* Seção: Dados Gerais */}
                    <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                                <span className="material-symbols-outlined">analytics</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Identificação do Plano</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina o código e o tipo de ativo</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white dark:bg-slate-900/40 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800/60 shadow-sm">
                             <div className="md:col-span-2">
                                <Input 
                                    label="Descrição Principal"
                                    placeholder="Ex: Manutenção Preventiva - Ar Condicionado"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                    leftIcon={<span className="material-symbols-outlined text-blue-500/60">description</span>}
                                />
                             </div>
                             <Input 
                                label="Código Interno"
                                placeholder="Ex: PMP-GER-001"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                leftIcon={<span className="material-symbols-outlined text-blue-500/60">tag</span>}
                             />
                             <Select 
                                label="Tipo de Ativo"
                                value={assetTypeId}
                                onChange={(e) => setAssetTypeId(e.target.value)}
                                placeholder="Genérico / Todos"
                                leftIcon={<span className="material-symbols-outlined text-blue-500/60">category</span>}
                                options={assetTypes.map(t => ({ value: t.id, label: t.description }))}
                             />
                        </div>
                    </section>

                    {/* Seção: Checklist */}
                    <section className="animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                                    <span className="material-symbols-outlined">format_list_bulleted</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Checklist de Atividades</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organize as tarefas por grupos/seções</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleAddSection}
                                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 uppercase tracking-widest shrink-0"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Adicionar Seção
                            </button>
                        </div>

                        <div className="space-y-6">
                            <DndContext 
                                sensors={sensors} 
                                collisionDetection={closestCenter} 
                                onDragEnd={handleDragEndSections}
                                modifiers={[restrictToVerticalAxis]}
                            >
                                <SortableContext 
                                    items={sections.filter(s => !s.isDeleted).map(s => s.tempId || s.id)} 
                                    strategy={verticalListSortingStrategy}
                                >
                                    {sections.filter(s => !s.isDeleted).map((section, sIndex) => {
                                        const realIndex = sections.findIndex(sec => sec === section);
                                        return (
                                            <SortableSectionItem key={section.tempId || section.id} id={section.tempId || section.id}>
                                                <SectionContent 
                                                    section={section}
                                                    sIndex={sIndex}
                                                    realIndex={realIndex}
                                                    handleSectionChange={handleSectionChange}
                                                    handleRemoveSection={handleRemoveSection}
                                                    handleDragEndActivities={handleDragEndActivities}
                                                    openActivityModal={openActivityModal}
                                                    openEditActivityModal={openEditActivityModal}
                                                    handleRemoveActivity={handleRemoveActivity}
                                                    sensors={sensors}
                                                />
                                            </SortableSectionItem>
                                        );
                                    })}
                                </SortableContext>
                            </DndContext>

                            {sections.filter(s => !s.isDeleted).length === 0 && (
                                <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/20 rounded-[40px] p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-500">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                                    </div>
                                    <h3 className="text-slate-800 dark:text-white font-black text-lg uppercase tracking-tight">O Checklist está vazio</h3>
                                    <p className="text-slate-400 text-sm mt-1 max-w-[280px] text-center">Adicione seções para começar a organizar as atividades de manutenção.</p>
                                    <button 
                                        onClick={handleAddSection}
                                        className="mt-6 flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Criar Primeira Seção
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Ações Finais */}
                    <div ref={bottomRef} className="flex gap-4 mt-8">
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={onCancel}
                            disabled={saving}
                        >
                            CANCELAR
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleSave}
                            loading={saving}
                        >
                            <span className="material-symbols-outlined mr-2">save</span>
                            SALVAR
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal de Atividades */}
            {activityModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Vincular Atividade</h3>
                                <p className="text-xs text-slate-500 font-medium tracking-tight">
                                    {selectedActivityForLink ? 'Detalhes da atividade selecionada' : 'Selecione uma atividade para a seção'}
                                </p>
                            </div>
                            <button 
                                onClick={() => {
                                    setActivityModalOpen(false);
                                    setSelectedActivityForLink(null);
                                    setEditingActivityIndex(null);
                                }} 
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm transition-all border border-slate-100 dark:border-slate-700"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        {!selectedActivityForLink ? (
                            <>
                                <div className="p-6">
                                    <SearchInput 
                                        value={activitiesSearch} 
                                        onChange={e => setActivitiesSearch(e.target.value)} 
                                        placeholder="Buscar por nome ou código..." 
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0 space-y-3">
                                    {filteredActivitiesForModal.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 opacity-50">
                                                <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                            </div>
                                            <p className="text-sm font-bold uppercase tracking-widest opacity-40">Sem resultados</p>
                                        </div>
                                    ) : (
                                        filteredActivitiesForModal.slice(0, 50).map(act => (
                                            <div 
                                                key={act.id} 
                                                onClick={() => handleSelectActivity(act)}
                                                className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-blue-500/30 border border-transparent transition-all group flex items-center gap-4"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate uppercase tracking-tight">{act.description}</div>
                                                    {act.code && <div className="text-[10px] font-black text-blue-500/60 mt-0.5 tracking-wider uppercase">Cód: {act.code}</div>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {filteredActivitiesForModal.length > 50 && (
                                        <div className="p-4 bg-blue-500/5 rounded-xl text-center border border-blue-500/10">
                                            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">+50 resultados encontrados. Refine a busca.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-6 space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl mb-4">
                                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase tracking-tight truncate">
                                            {selectedActivityForLink.code ? <span className="opacity-60 mr-1">[{selectedActivityForLink.code}]</span> : null}
                                            {selectedActivityForLink.description}
                                        </h4>
                                    </div>
                                    <div className="space-y-4">
                                        <Input
                                            label="Descrição da Tarefa"
                                            value={activityDescription}
                                            onChange={(e) => setActivityDescription(e.target.value)}
                                            placeholder="Detalhes de como executar a tarefa..."
                                            autoFocus
                                        />
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider pl-1">
                                                Observações Padrão
                                            </label>
                                            <textarea
                                                className="w-full h-32 px-5 py-4 rounded-[20px] rounded-br-[8px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner resize-none transition-all custom-scrollbar"
                                                placeholder="Observações que virão preenchidas por padrão no checklist..."
                                                value={activityCommentsDefault}
                                                onChange={(e) => setActivityCommentsDefault(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 pt-0 flex gap-3">
                                     <Button
                                        type="button"
                                        variant="secondary"
                                        fullWidth
                                        onClick={() => {
                                            if (editingActivityIndex) {
                                                setActivityModalOpen(false);
                                                setSelectedActivityForLink(null);
                                                setEditingActivityIndex(null);
                                            } else {
                                                // If just browsing inside "novo vinculo", go back to list
                                                setSelectedActivityForLink(null);
                                            }
                                        }}
                                    >
                                        VOLTAR
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        fullWidth
                                        onClick={confirmLinkActivity}
                                    >
                                        CONFIRMAR
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {sectionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <form 
                        onSubmit={confirmAddSection}
                        className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800"
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Nova Seção</h3>
                                <p className="text-xs text-slate-500 font-medium tracking-tight">Informe o nome da seção do checklist</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setSectionModalOpen(false)} 
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm transition-all border border-slate-100 dark:border-slate-700"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <Input 
                                label="Nome da Seção"
                                placeholder="Ex: Parte Elétrica, Limpeza..."
                                value={newSectionDescription}
                                onChange={e => setNewSectionDescription(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                             <Button
                                type="button"
                                variant="secondary"
                                fullWidth
                                onClick={() => setSectionModalOpen(false)}
                            >
                                CANCELAR
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                disabled={!newSectionDescription.trim()}
                            >
                                CONFIRMAR
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
