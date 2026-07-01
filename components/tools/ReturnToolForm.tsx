import React, { useState } from 'react';
import { UserTool } from '../../types';
import { toolsService } from '../../services/toolsService';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

interface ReturnToolFormProps {
    userTool: UserTool;
    onSave: () => void;
    onCancel: () => void;
}

export const ReturnToolForm: React.FC<ReturnToolFormProps> = ({ userTool, onSave, onCancel }) => {
    const { currentUser } = useAuth();
    const [newToolStatus, setNewToolStatus] = useState<'DISPONIVEL' | 'MANUTENCAO'>('DISPONIVEL');
    const [isSaving, setIsSaving] = useState(false);
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
    }>({ isOpen: false, title: '', message: '', type: 'info' });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await toolsService.returnTool(
                userTool.id,
                userTool.tool_id,
                userTool.user_id,
                newToolStatus,
                currentUser ? Number(currentUser.id) : undefined
            );
            onSave();
        } catch (error: any) {
            console.error('Error returning tool:', error);
            setModal({ isOpen: true, title: 'Erro', message: error?.message || 'Erro ao dar baixa na ferramenta.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Baixar Ferramenta</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Esta operação remove a ferramenta do perfil do responsável. A ferramenta ainda permanecerá no cadastro de inventário.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden mb-6">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-700/50">
                        {userTool.user_avatar ? (
                            <img src={userTool.user_avatar} alt={userTool.user_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-base text-primary">person</span>
                            </div>
                        )}
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">{userTool.user_name}</p>
                    </div>
                    <div className="px-4 py-3">
                        <p className="font-bold text-primary text-sm truncate">{userTool.tool_code || '—'}</p>
                        {userTool.tool_material_code && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                <span className="font-semibold text-slate-500 dark:text-slate-400">{userTool.tool_material_code}</span>
                                {userTool.tool_material_description && <span> — {userTool.tool_material_description}</span>}
                                {userTool.tool_material_unit && <span className="ml-1 text-slate-400">({userTool.tool_material_unit})</span>}
                            </p>
                        )}
                        <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                            {userTool.tool_brand} {userTool.tool_model} {userTool.tool_serial}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Após a baixa, qual o status físico da ferramenta?
                    </label>
                    <Select
                        value={newToolStatus}
                        onChange={(e) => setNewToolStatus(e.target.value as 'DISPONIVEL' | 'MANUTENCAO')}
                        options={[
                            { value: 'DISPONIVEL', label: 'Disponível para novo vínculo' },
                            { value: 'MANUTENCAO', label: 'Em Manutenção' }
                        ]}
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={onCancel}
                        disabled={isSaving}
                        type="button"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleSave}
                        loading={isSaving}
                        type="button"
                    >
                        Confirmar Baixa
                    </Button>
                </div>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
};
