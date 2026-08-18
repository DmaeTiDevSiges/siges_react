
import React, { useState, useEffect } from 'react';
import { Route } from '../../types';
import { dataService } from '../../services/dataService';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { toast } from 'sonner';

interface RouteManagementScreenProps {
    onAdd?: () => void;
    onEdit?: (route: Route) => void;
    onBack?: () => void;
}

export const RouteManagementScreen: React.FC<RouteManagementScreenProps> = ({ onAdd, onEdit, onBack }) => {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadRoutes();
    }, []);

    const loadRoutes = async () => {
        try {
            setLoading(true);
            const data = await dataService.getAllRoutesAdmin();
            setRoutes(data);
        } catch (error) {
            console.error('Error loading routes:', error);
            toast.error('Erro ao carregar rotas');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async (route: Route) => {
        const newAvailability = !route.isAvailable;
        try {
            setSaving(route.id);
            await dataService.updateRouteAvailability(route.id, newAvailability);
            setRoutes(prev =>
                prev.map(r => r.id === route.id ? { ...r, isAvailable: newAvailability } : r)
            );
            toast.success(`Rota "${route.description}" ${newAvailability ? 'ativada' : 'desativada'}`);
        } catch (error) {
            console.error('Error updating route:', error);
            toast.error('Erro ao atualizar rota');
        } finally {
            setSaving(null);
        }
    };

    const handleToggleVisibleToAdmin = async (route: Route) => {
        const newVisible = !(route.isVisibleToAdmin ?? true);
        try {
            setSaving(route.id);
            await dataService.updateRoute(route.id, { ...route, isVisibleToAdmin: newVisible });
            setRoutes(prev =>
                prev.map(r => r.id === route.id ? { ...r, isVisibleToAdmin: newVisible } : r)
            );
            toast.success(`Visibilidade para admin atualizada`);
        } catch (error) {
            console.error('Error updating route visibility:', error);
            toast.error('Erro ao atualizar visibilidade');
        } finally {
            setSaving(null);
        }
    };

    const handleDelete = async (route: Route) => {
        if (!window.confirm(`Tem certeza que deseja excluir a rota "${route.description}"?`)) return;
        try {
            setSaving(route.id);
            await dataService.deleteRoute(route.id);
            setRoutes(prev => prev.filter(r => r.id !== route.id));
            toast.success('Rota excluida com sucesso!');
        } catch (error) {
            console.error('Error deleting route:', error);
            toast.error('Erro ao excluir rota');
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="p-8">Carregando...</div>;

    const normalizedSearch = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtered = routes.filter(r =>
        r.description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizedSearch) ||
        r.routeKey.toLowerCase().includes(normalizedSearch)
    );

    const parentRoutes = filtered.filter(r => !r.parentId);
    const childRoutes = filtered.filter(r => r.parentId);

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">route</span>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciar Rotas</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Criar, editar e configurar rotas do sistema
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-64">
                        <SearchInput
                            placeholder="Filtrar rotas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={onAdd} variant="primary">
                        <span className="material-symbols-outlined text-base mr-1">add</span>
                        Nova Rota
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descricao</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chave</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caminho</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Ordem</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Vis. Admin</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Acoes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {parentRoutes.map(route => (
                                <React.Fragment key={route.id}>
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleToggleAvailability(route)}
                                                disabled={saving === route.id}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                                    route.isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                                } ${saving === route.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                    route.isAvailable ? 'translate-x-4' : 'translate-x-0.5'
                                                }`} />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                {route.icon && <span className="material-symbols-outlined mr-2 text-gray-400 text-base">{route.icon}</span>}
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{route.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{route.routeKey}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{route.routePath}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{route.orderIndex}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleVisibleToAdmin(route)}
                                                disabled={saving === route.id}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                                    route.isVisibleToAdmin ?? true ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                                } ${saving === route.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                    route.isVisibleToAdmin ?? true ? 'translate-x-4' : 'translate-x-0.5'
                                                }`} />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => onEdit?.(route)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(route)}
                                                    disabled={saving === route.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {childRoutes
                                        .filter(child => child.parentId === route.id)
                                        .map(child => (
                                            <tr key={child.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3 pl-10">
                                                    <button
                                                        onClick={() => handleToggleAvailability(child)}
                                                        disabled={saving === child.id}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                                            child.isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                                        } ${saving === child.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                            child.isAvailable ? 'translate-x-4' : 'translate-x-0.5'
                                                        }`} />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 pl-10">
                                                    <div className="flex items-center">
                                                        {child.icon && <span className="material-symbols-outlined mr-2 text-gray-400 text-base">{child.icon}</span>}
                                                        <div className="text-sm text-gray-700 dark:text-gray-300">{child.description}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{child.routeKey}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">{child.routePath}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">{child.orderIndex}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleToggleVisibleToAdmin(child)}
                                                        disabled={saving === child.id}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                                            child.isVisibleToAdmin ?? true ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                                        } ${saving === child.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                            child.isVisibleToAdmin ?? true ? 'translate-x-4' : 'translate-x-0.5'
                                                        }`} />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => onEdit?.(child)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <span className="material-symbols-outlined text-base">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(child)}
                                                            disabled={saving === child.id}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
