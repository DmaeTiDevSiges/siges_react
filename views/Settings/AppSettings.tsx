
import React from 'react';

export const AppSettings: React.FC<{ onNavigate?: (screen: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="p-6 pb-32 space-y-4">



            <div className="space-y-1 mt-6">
                <h3 className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Unidades
                </h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <SettingItem
                        icon="rule"
                        title="Situações"
                        subtitle="Gerenciar estados e fluxos"
                        onClick={() => { }}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="hub"
                        title="Sistemas / Sub-sistemas"
                        subtitle="Configurar módulos do sistema"
                        onClick={() => onNavigate?.('systems')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="category"
                        title="Tipos / Sub-tipos"
                        subtitle="Categorização de registros"
                        onClick={() => onNavigate?.('unit-types')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="sell"
                        title="Setores"
                        subtitle="Gerenciar setores (Asset Tags)"
                        onClick={() => onNavigate?.('asset-tags')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="place"
                        title="Posições"
                        subtitle="Gerenciar posições (Asset Tag Subs)"
                        onClick={() => onNavigate?.('asset-tag-subs')}
                    />
                </div>
            </div>

            <div className="space-y-1 mt-6">
                <h3 className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Ordens de Serviço
                </h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <SettingItem
                        icon="engineering"
                        title="Atividades"
                        subtitle="Gerenciar atividades de serviço"
                        onClick={() => onNavigate?.('activities')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="flag"
                        title="Prioridades"
                        subtitle="Definir níveis de prioridade"
                        onClick={() => onNavigate?.('priorities')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="category"
                        title="Tipos de OS"
                        subtitle="Configurar tipos e categorias"
                        onClick={() => onNavigate?.('order-types')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="schema"
                        title="Sub-Tipos de OS"
                        subtitle="Configurar especializações"
                        onClick={() => onNavigate?.('order-sub-types')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="assignment"
                        title="Planos"
                        subtitle="Gerenciar planos de manutenção"
                        onClick={() => onNavigate?.('order-plans')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="inventory_2"
                        title="Objetos"
                        subtitle="Gerenciar objetos de serviço"
                        onClick={() => onNavigate?.('order-objects')}
                    />
                </div>
            </div>

            <div className="space-y-1 mt-6">
                <h3 className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Clientes
                </h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <SettingItem
                        icon="person_add"
                        title="Cadastro"
                        subtitle="Gerenciar clientes e contatos"
                        onClick={() => onNavigate?.('clients')}
                    />
                </div>
            </div>

            <div className="space-y-1 mt-6">
                <h3 className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Empresas
                </h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <SettingItem
                        icon="business"
                        title="Cadastro"
                        subtitle="Gerenciar empresas e parceiros"
                        onClick={() => onNavigate?.('companies')}
                    />
                </div>
            </div>

            <div className="space-y-1 mt-6">
                <h3 className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Ativos
                </h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <SettingItem
                        icon="category"
                        title="Tipos"
                        subtitle="Gerenciar tipos de ativos"
                        onClick={() => onNavigate?.('asset-types')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />

                    <SettingItem
                        icon="rule"
                        title="Situações"
                        subtitle="Gerenciar situações de ativos"
                        onClick={() => onNavigate?.('asset-statuses')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="flag"
                        title="Prioridades"
                        subtitle="Gerenciar prioridades de ativos"
                        onClick={() => onNavigate?.('asset-priorities')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="tune"
                        title="Dados Técnicos"
                        subtitle="Configurar atributos técnicos por tipo"
                        onClick={() => onNavigate?.('asset-type-attributes')}
                    />
                </div>
            </div>

            <div className="space-y-1 mt-6">
                <h3 className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Contratos
                </h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <SettingItem
                        icon="design_services"
                        title="Serviços"
                        subtitle="Gerenciar catálogo de serviços"
                        onClick={() => onNavigate?.('services')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="inventory_2"
                        title="Materiais"
                        subtitle="Gerenciar catálogo de materiais"
                        onClick={() => onNavigate?.('materials')}
                    />
                </div>
            </div>

            <div className="space-y-1 mt-6">
                <h3 className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Acesso e Segurança
                </h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <SettingItem
                        icon="group"
                        title="Usuários"
                        subtitle="Gerenciar lista de todos os usuários"
                        onClick={() => onNavigate?.('all-users')}
                    />
                    <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                    <SettingItem
                        icon="verified_user"
                        title="Permissões de Acesso"
                        subtitle="Gerenciar permissões por perfil"
                        onClick={() => onNavigate?.('profile-permissions')}
                    />
                </div>
            </div>

            <div className="space-y-1 mt-6">
                <h3 className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Inteligência Artificial
                </h3>
                <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <SettingItem
                        icon="psychology"
                        title="Governança AI"
                        subtitle="Alimentar RAG e manuais"
                        onClick={() => onNavigate?.('ai-admin')}
                    />
                </div>
            </div>
        </div>
    );
};

interface SettingItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, subtitle, onClick, variant = 'default' }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
    >
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${variant === 'danger'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
                : 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                }`}>
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <div className="text-left">
                <span className={`font-medium block ${variant === 'danger'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-slate-100'
                    }`}>{title}</span>
                {subtitle && <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{subtitle}</span>}
            </div>
        </div>
        <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
    </button>
);
