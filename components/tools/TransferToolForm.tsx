import React, { useState, useEffect } from 'react';
import { UserTool, User } from '../../types';
import { toolsService } from '../../services/toolsService';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface TransferToolFormProps {
    userTool: UserTool;
    companyId: string;
    onSave: () => void;
    onCancel: () => void;
}

export const TransferToolForm: React.FC<TransferToolFormProps> = ({ userTool, companyId, onSave, onCancel }) => {
    const { currentUser } = useAuth();
    const [toUserId, setToUserId] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
    }>({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const currentUserDeptId = currentUser?.departmentId;
                if (!currentUserDeptId) return;

                const { data: usersData, error: usersError } = await supabase
                    .from('v_users')
                    .select('id, name_full, name_short, email, status_id, department_id')
                    .eq('department_id', Number(currentUserDeptId))
                    .eq('status_id', 2)
                    .order('name_full');

                if (usersError) {
                    console.error('Error fetching users from v_users:', usersError);
                    return;
                }

                const activeUsers = (usersData || [])
                    .filter((u: any) => String(u.id) !== String(userTool.user_id))
                    .map((u: any) => ({
                        id: u.id.toString(),
                        nameFull: u.name_full,
                        nameShort: u.name_short,
                        email: u.email,
                        statusId: u.status_id,
                        departmentId: u.department_id?.toString(),
                    }));
                setUsers(activeUsers);
            } catch (error) {
                console.error("Error loading users", error);
            }
        };
        loadUsers();
    }, [userTool.user_id, currentUser?.departmentId]);

    const handleSave = async () => {
        if (!toUserId) {
            setModal({ isOpen: true, title: 'Atenção', message: 'Selecione o novo responsável.', type: 'warning' });
            return;
        }

        setIsSaving(true);
        try {
            await toolsService.transferTool(
                userTool.id,
                userTool.tool_id,
                userTool.user_id,
                Number(toUserId),
                userTool.amount || 1,
                currentUser ? Number(currentUser.id) : undefined
            );
            onSave();
        } catch (error: any) {
            console.error('Error transferring tool:', error);
            setModal({ isOpen: true, title: 'Erro', message: error?.message || 'Erro ao transferir ferramenta.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Transferir Ferramenta</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Esta operação transfere a custódia da ferramenta para outro responsável.
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
                        Novo Responsável *
                    </label>
                    <Select
                        value={toUserId}
                        onChange={(e) => setToUserId(e.target.value)}
                        options={[
                            { value: '', label: 'Selecione um responsável' },
                            ...users.map(u => ({ value: String(u.id), label: u.nameFull || u.nameShort || u.email }))
                        ]}
                        placeholder="Selecione um responsável"
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
                        Confirmar Transferência
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
