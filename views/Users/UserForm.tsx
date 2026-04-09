import React, { useState, useEffect } from 'react';
import { Team, Profile } from '../../types';
import { dataService } from '../../services/dataService';
import { Select } from '../../components/ui/Select';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { Modal } from '../../components/ui/Modal';
import { KeyboardAwareScrollView } from '../../components/ui/KeyboardAwareScrollView';

interface UserFormProps {
    companyId: string;
    onSave: () => void;
    onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ companyId, onSave, onCancel }) => {
    const [nameFull, setNameFull] = useState('');
    const [nameShort, setNameShort] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mobile, setMobile] = useState('');
    const [teamId, setTeamId] = useState('');
    const [profileId, setProfileId] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [profilesLoading, setProfilesLoading] = useState(true);
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    useEffect(() => {
        const loadData = async () => {
            if (!companyId) return;
            try {
                const [teamsData, profilesData] = await Promise.all([
                    dataService.getTeamsByCompany(companyId),
                    dataService.getCompanyProfiles(companyId)
                ]);
                setTeams(teamsData);
                setProfiles(profilesData);
            } catch (error) {
                console.error("Error loading form data", error);
            } finally {
                setTeamsLoading(false);
                setProfilesLoading(false);
            }
        };
        loadData();
    }, [companyId]);

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.slice(0, 11);

        let formatted = val;
        if (val.length > 2) formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
        if (val.length > 7) formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;

        setMobile(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        if (password !== confirmPassword) {
            setModal({
                isOpen: true,
                title: 'Atenção',
                message: 'Senhas não conferem!',
                type: 'warning'
            });
            return;
        }

        const mobileClean = mobile.replace(/\D/g, '');
        if (mobileClean.length > 0 && mobileClean.length < 10) {
            setModal({
                isOpen: true,
                title: 'Atenção',
                message: 'Número de celular inválido (mínimo com DDD).',
                type: 'warning'
            });
            return;
        }

        try {
            setIsSaving(true);
            // Artificial delay for premium effect visibility
            await new Promise(resolve => setTimeout(resolve, 1000));

            await dataService.createUser({
                email,
                nameFull,
                nameShort,
                mobile: mobileClean,
                teamId,
                profileId,
                companyId
            }, password);

            setModal({
                isOpen: true,
                title: 'Sucesso',
                message: 'Usuário criado com sucesso!',
                type: 'success'
            });

        } catch (error: any) {
            console.error("Error creating user", error);
            let msg = error.message || "Erro desconhecido";
            if (msg.includes("Error sending confirmation email")) {
                msg = "O Supabase falhou ao enviar o email de confirmação. Por favor, desative a opção 'Confirm Email' no painel do Supabase (Authentication -> Providers -> Email) ou configure um servidor SMTP.";
            }
            setModal({
                isOpen: true,
                title: 'Erro',
                message: "Erro ao criar usuário: " + msg,
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
            {isSaving && (
                <div className="absolute top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-primary/20">
                    <div className="h-full bg-primary animate-loading-bar w-[40%]" />
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <KeyboardAwareScrollView className="flex-1 p-4 w-full space-y-6 pb-10" extraPadding={30}>
                    {/* Email */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail *</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="usuario@exemplo.com"
                    />
                </div>

                {/* Password Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha *</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar Senha *</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Name Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo *</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            value={nameFull}
                            onChange={e => setNameFull(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Apelido *</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            value={nameShort}
                            onChange={e => setNameShort(e.target.value)}
                        />
                    </div>
                </div>

                {/* Team Combo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Equipe *"
                        required
                        value={teamId}
                        onChange={e => setTeamId(e.target.value)}
                        disabled={teamsLoading}
                        leftIcon={<span className="material-symbols-outlined text-xl">groups</span>}
                    >
                        <option value="">{teamsLoading ? 'Carregando...' : 'Selecione uma equipe'}</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </Select>

                    <Select
                        label="Perfil de Acesso *"
                        required
                        value={profileId}
                        onChange={e => setProfileId(e.target.value)}
                        disabled={profilesLoading}
                        leftIcon={<span className="material-symbols-outlined text-xl">admin_panel_settings</span>}
                    >
                        <option value="">{profilesLoading ? 'Carregando...' : 'Selecione um perfil'}</option>
                        {profiles.map(profile => (
                            <option key={profile.id} value={profile.id}>
                                {profile.description}
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Mobile */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Celular</label>
                    <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        value={mobile}
                        onChange={handleMobileChange}
                        placeholder="(99) 99999-9999"
                        maxLength={15}
                    />
                </div>
                </KeyboardAwareScrollView>
            </form>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
                saveLabel="Salvar Usuário"
            />

            <Modal
                isOpen={modal.isOpen}
                onClose={() => {
                    setModal(prev => ({ ...prev, isOpen: false }));
                    if (modal.type === 'success') onSave();
                }}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
};
