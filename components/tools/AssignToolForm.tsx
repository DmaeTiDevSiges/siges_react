import React, { useState, useEffect } from 'react';
import { Tool, User } from '../../types';
import { toolsService } from '../../services/toolsService';
import { Select } from '../ui/Select';
import { ButtonSave } from '../ui/ButtonSave';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface AssignToolFormProps {
    companyId: string;
    onSave: () => void;
    onCancel: () => void;
}

export const AssignToolForm: React.FC<AssignToolFormProps> = ({ companyId, onSave, onCancel }) => {
    const { currentUser } = useAuth();
    const [userId, setUserId] = useState('');
    const [toolId, setToolId] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [availableTools, setAvailableTools] = useState<Tool[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [modal, setModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
    }>({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        const loadData = async () => {
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

                const activeLeaders = (usersData || []).map((u: any) => ({
                    id: u.id.toString(),
                    nameFull: u.name_full,
                    nameShort: u.name_short,
                    email: u.email,
                    statusId: u.status_id,
                    departmentId: u.department_id?.toString(),
                }));

                const toolsData = await toolsService.getTools();
                setUsers(activeLeaders);
                setAvailableTools(toolsData.filter(t => t.status === 'DISPONIVEL'));
            } catch (error) {
                console.error("Error loading assign data", error);
            }
        };
        loadData();
    }, [currentUser?.departmentId]);

    const handleSave = async () => {
        if (!userId || !toolId) {
            setModal({ isOpen: true, title: 'Atenção', message: 'Selecione o usuário e a ferramenta.', type: 'warning' });
            return;
        }

        setIsSaving(true);
        try {
            await toolsService.assignToolToUser(
                Number(toolId),
                Number(userId),
                1,
                currentUser ? Number(currentUser.id) : undefined
            );
            onSave();
        } catch (error: any) {
            console.error('Error assigning tool:', error);
            setModal({ isOpen: true, title: 'Erro', message: error?.message || 'Erro ao vincular ferramenta.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6">
            <div className="space-y-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Responsável *
                    </label>
                    <Select
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        options={[
                            { value: '', label: 'Selecione um responsável' },
                            ...users.map(u => ({ value: u.id, label: u.nameFull || u.nameShort || u.email }))
                        ]}
                        placeholder="Selecione um responsável"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Ferramenta Disponível *
                    </label>
                    <Select
                        value={toolId}
                        onChange={(e) => setToolId(e.target.value)}
                        options={[
                            { value: '', label: 'Selecione uma ferramenta' },
                            ...availableTools.map(t => ({ value: t.id.toString(), label: t.material_code ? `${t.material_code} - ${t.material_description} (${t.material_unit})\n${t.code ? `[${t.code}] ` : ''}${t.brand} ${t.model} (${t.serial_number})` : `${t.code ? `[${t.code}] ` : ''}${t.brand} ${t.model} (${t.serial_number})` }))
                        ]}
                        placeholder="Selecione uma ferramenta"
                    />
                    {availableTools.length === 0 && (
                        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Não há ferramentas disponíveis em estoque.</p>
                    )}
                </div>
            </div>

            <ButtonSave
                onSave={handleSave}
                onCancel={onCancel}
                isSaving={isSaving}
                saveLabel="Vincular"
            />

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
