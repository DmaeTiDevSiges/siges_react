
import React, { useState, useEffect } from 'react';
import { Route } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ButtonSave } from '../../components/ui/ButtonSave';
import { dataService } from '../../services/dataService';

const MATERIAL_ICONS = [
    'route', 'dashboard', 'settings', 'group', 'verified_user', 'business',
    'apartment', 'inventory_2', 'inventory', 'engineering', 'flag', 'category',
    'schema', 'assignment', 'sell', 'place', 'hub', 'rule', 'tune',
    'design_services', 'rate_review', 'tips_and_updates', 'psychology',
    'handyman', 'checklist', 'menu_book', 'notifications', 'person_add',
    'search', 'home', 'map', 'location_on', 'build', 'construction',
    'precision_manufacturing', 'electrical_services', 'plumbing', 'hammer_and_wrench',
    'inventory_2', 'balance', 'analytics', 'summarize', 'description',
    'fact_check', 'task_alt', 'check_circle', 'pending', 'schedule',
    'calendar_month', 'event', 'bookmark', 'star', 'favorite',
    'visibility', 'lock', 'key', 'shield', 'admin_panel_settings',
    'manage_accounts', 'person', 'people', 'badge', 'card_membership',
    'work', 'domain', 'corporate_fare', 'apartment', 'home_work',
    'warehouse', 'factory', 'local_shipping', 'delivery_dining', 'inventory'
];

interface RouteFormProps {
    initialRoute?: Partial<Route>;
    onSave: (route: Partial<Route>) => Promise<void> | void;
    onCancel: () => void;
}

export const RouteForm: React.FC<RouteFormProps> = ({
    initialRoute,
    onSave,
    onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [allRoutes, setAllRoutes] = useState<Route[]>([]);

    useEffect(() => {
        const loadRoutes = async () => {
            try {
                const data = await dataService.getAllRoutesAdmin();
                setAllRoutes(data);
            } catch (error) {
                console.error('Error loading routes:', error);
            }
        };
        loadRoutes();
    }, []);

    const [form, setForm] = useState({
        description: initialRoute?.description || '',
        routeKey: initialRoute?.routeKey || '',
        routePath: initialRoute?.routePath || '',
        icon: initialRoute?.icon || '',
        parentId: initialRoute?.parentId || '',
        orderIndex: initialRoute?.orderIndex ?? 0,
        isAvailable: initialRoute?.isAvailable ?? true,
        isVisibleToAdmin: initialRoute?.isVisibleToAdmin ?? true
    });

    const parentRoutes = allRoutes.filter(r => !r.parentId && r.id !== initialRoute?.id);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSaving) return;

        try {
            setIsSaving(true);
            await onSave({
                ...form,
                id: initialRoute?.id
            } as Partial<Route>);
        } catch (error) {
            console.error("Error saving route", error);
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

            <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 overflow-y-auto pb-10">
                <Input
                    label="Descricao"
                    placeholder="Ex: Gestao de Ordens"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <Input
                    label="Chave (route_key)"
                    placeholder="Ex: dashboard_orders"
                    value={form.routeKey}
                    onChange={(e) => setForm({ ...form, routeKey: e.target.value })}
                    required
                />

                <Input
                    label="Caminho (route_path)"
                    placeholder="Ex: /orders"
                    value={form.routePath}
                    onChange={(e) => setForm({ ...form, routePath: e.target.value })}
                    required
                />

                <Select
                    label="Icone"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                >
                    <option value="">Selecione um icone...</option>
                    {MATERIAL_ICONS.sort().map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                    ))}
                </Select>

                <Select
                    label="Rota Pai"
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                >
                    <option value="">Nenhuma (rota principal)</option>
                    {parentRoutes.map(r => (
                        <option key={r.id} value={r.id}>{r.description}</option>
                    ))}
                </Select>

                <Input
                    label="Ordem (order_index)"
                    type="number"
                    value={form.orderIndex.toString()}
                    onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })}
                />

                <Select
                    label="Situacao"
                    value={form.isAvailable ? 'active' : 'inactive'}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.value === 'active' })}
                >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </Select>

                <Select
                    label="Visivel ao Admin da Empresa"
                    value={form.isVisibleToAdmin ? 'yes' : 'no'}
                    onChange={(e) => setForm({ ...form, isVisibleToAdmin: e.target.value === 'yes' })}
                >
                    <option value="yes">Sim</option>
                    <option value="nao">Nao</option>
                </Select>
            </form>

            <ButtonSave
                onSave={handleSubmit}
                onCancel={onCancel}
                isSaving={isSaving}
            />
        </div>
    );
};
