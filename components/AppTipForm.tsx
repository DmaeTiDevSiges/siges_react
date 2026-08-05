import React, { useState, useEffect, useCallback } from 'react';
import { AppTip, CreateAppTipInput, APP_TIP_SCREEN_TARGETS, APP_TIP_TARGET_MODES, AppTipTargetMode, Company, Department, Profile } from '../types';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Loading } from './ui/Loading';
import { dataService } from '../services/dataService';

interface AppTipFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (input: CreateAppTipInput) => Promise<void>;
    initialTip?: AppTip | null;
}

const ICON_OPTIONS = [
    'lightbulb', 'tips_and_updates', 'info', 'school', 'star',
    'auto_awesome', 'psychology', 'eco', 'rocket_launch', 'new_releases',
    'handyman', 'construction', 'engineering', 'science', 'menu_book',
];

export const AppTipForm: React.FC<AppTipFormProps> = ({ isOpen, onClose, onSave, initialTip }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [icon, setIcon] = useState('lightbulb');
    const [screenTarget, setScreenTarget] = useState('*');
    const [targetMode, setTargetMode] = useState<AppTipTargetMode>('all');
    const [priority, setPriority] = useState('0');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
    const [selectedProfileIds, setSelectedProfileIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);

    const [companies, setCompanies] = useState<Company[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoadingData(true);
        Promise.all([
            dataService.getCompanies(),
            dataService.getDepartments(),
            dataService.getAllProfiles(),
        ]).then(([comps, depts, profs]) => {
            setCompanies(comps);
            setDepartments(depts);
            setProfiles(profs);
        }).finally(() => setLoadingData(false));
    }, [isOpen]);

    useEffect(() => {
        if (initialTip) {
            setTitle(initialTip.title);
            setBody(initialTip.body);
            setIcon(initialTip.icon);
            setScreenTarget(initialTip.screenTarget);
            setTargetMode(initialTip.targetMode || 'all');
            setPriority(String(initialTip.priority));
            setStartDate(initialTip.startDate ? initialTip.startDate.substring(0, 16) : '');
            setEndDate(initialTip.endDate ? initialTip.endDate.substring(0, 16) : '');
            setSelectedCompanyIds(initialTip.companyIds || []);
            setSelectedDepartmentIds(initialTip.departmentIds || []);
            setSelectedProfileIds(initialTip.profileIds || []);
        } else {
            setTitle('');
            setBody('');
            setIcon('lightbulb');
            setScreenTarget('*');
            setTargetMode('all');
            setPriority('0');
            setStartDate('');
            setEndDate('');
            setSelectedCompanyIds([]);
            setSelectedDepartmentIds([]);
            setSelectedProfileIds([]);
        }
    }, [initialTip, isOpen]);

    const handleSave = async () => {
        if (!title.trim() || !body.trim()) return;
        if (targetMode === 'filtered' && selectedCompanyIds.length === 0 && selectedDepartmentIds.length === 0 && selectedProfileIds.length === 0) return;
        setSaving(true);
        try {
            await onSave({
                title: title.trim(),
                body: body.trim(),
                icon,
                screenTarget,
                targetMode,
                priority: parseInt(priority) || 0,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                companyIds: targetMode === 'filtered' ? selectedCompanyIds : undefined,
                departmentIds: targetMode === 'filtered' ? selectedDepartmentIds : undefined,
                profileIds: targetMode === 'filtered' ? selectedProfileIds : undefined,
            });
        } finally {
            setSaving(false);
        }
    };

    const companyOptions = companies.map(c => ({ value: String(c.id), label: c.name }));

    const filteredDepartments = departments
        .filter(d => selectedCompanyIds.length === 0 || selectedCompanyIds.includes(Number(d.companyId)));

    const departmentOptions = filteredDepartments.map(d => ({
        value: String(d.id),
        label: selectedCompanyIds.length > 1 ? `${d.name} (${companies.find(c => c.id === d.companyId)?.name || '?'})` : d.name,
    }));

    const filteredProfiles = profiles
        .filter(p => {
            if (selectedDepartmentIds.length > 0) {
                return p.departmentId && selectedDepartmentIds.includes(Number(p.departmentId));
            }
            if (selectedCompanyIds.length > 0) {
                return p.companyId && selectedCompanyIds.includes(Number(p.companyId));
            }
            return true;
        });

    const profileOptions = filteredProfiles.map(p => ({ value: String(p.id), label: p.description }));

    const handleCompanyChange = (vals: number[]) => {
        setSelectedCompanyIds(vals);
        setSelectedDepartmentIds(prev => {
            const validDeptIds = departments
                .filter(d => vals.length === 0 || vals.includes(Number(d.companyId)))
                .map(d => Number(d.id));
            return prev.filter(id => validDeptIds.includes(id));
        });
        setSelectedProfileIds([]);
    };

    const handleDepartmentChange = (vals: number[]) => {
        setSelectedDepartmentIds(vals);
        setSelectedProfileIds(prev => {
            const validProfileIds = profiles
                .filter(p => {
                    if (vals.length === 0) return true;
                    return p.departmentId && vals.includes(Number(p.departmentId));
                })
                .map(p => Number(p.id));
            return prev.filter(id => validProfileIds.includes(id));
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialTip ? 'Editar Dica' : 'Nova Dica'}
            maxWidth="md"
            onConfirm={handleSave}
            confirmLabel={initialTip ? 'Salvar' : 'Criar'}
            confirmLoading={saving}
            confirmLoadingLabel="Salvando..."
        >
            <div className="space-y-4">
                <Input
                    label="Título"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Nova funcionalidade de assinatura"
                />

                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                        Mensagem
                    </label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={3}
                        placeholder="Texto explicativo da dica..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        Ícone
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {ICON_OPTIONS.map((ic) => (
                            <button
                                key={ic}
                                onClick={() => setIcon(ic)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                    icon === ic
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl">{ic}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            Tela Alvo
                        </label>
                        <select
                            value={screenTarget}
                            onChange={(e) => setScreenTarget(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        >
                            {APP_TIP_SCREEN_TARGETS.map((t) => (
                                <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Prioridade"
                        type="number"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        placeholder="0"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Data Início"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        label="Data Fim"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                {/* --- Targeting Section --- */}
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        Público-Alvo
                    </label>
                    <div className="flex gap-2">
                        {APP_TIP_TARGET_MODES.map((mode) => (
                            <button
                                key={mode.key}
                                type="button"
                                onClick={() => setTargetMode(mode.key)}
                                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                    targetMode === mode.key
                                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg">{mode.icon}</span>
                                <span className="text-left leading-tight">
                                    <span className="block font-semibold">{mode.label}</span>
                                    <span className="block text-[10px] font-normal opacity-70">{mode.description}</span>
                                </span>
                            </button>
                        ))}
                    </div>

                    {targetMode === 'filtered' && (
                        <div className="mt-3 space-y-3">
                            {loadingData ? (
                                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                    <Loading size="sm" /> Carregando dados...
                                </div>
                            ) : (
                                <>
                                    {selectedCompanyIds.length === 0 && selectedDepartmentIds.length === 0 && selectedProfileIds.length === 0 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                                            Selecione pelo menos uma empresa, departamento ou perfil para que a dica seja exibida apenas para o público-alvo.
                                        </p>
                                    )}
                                    <Select
                                        label="Empresas"
                                        multiple
                                        options={companyOptions}
                                        value={selectedCompanyIds.map(String)}
                                        onChange={(e: any) => {
                                            const vals = Array.isArray(e.target.value)
                                                ? e.target.value.map(Number)
                                                : [Number(e.target.value)];
                                            handleCompanyChange(vals);
                                        }}
                                        placeholder="Todas as empresas"
                                    />
                                    <Select
                                        label="Departamentos"
                                        multiple
                                        options={departmentOptions}
                                        value={selectedDepartmentIds.map(String)}
                                        onChange={(e: any) => {
                                            const vals = Array.isArray(e.target.value)
                                                ? e.target.value.map(Number)
                                                : [Number(e.target.value)];
                                            handleDepartmentChange(vals);
                                        }}
                                        placeholder="Todos os departamentos"
                                    />
                                    <Select
                                        label="Perfis"
                                        multiple
                                        options={profileOptions}
                                        value={selectedProfileIds.map(String)}
                                        onChange={(e: any) => {
                                            const vals = Array.isArray(e.target.value)
                                                ? e.target.value.map(Number)
                                                : [Number(e.target.value)];
                                            setSelectedProfileIds(vals);
                                        }}
                                        placeholder="Todos os perfis"
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
