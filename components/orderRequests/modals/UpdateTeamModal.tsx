import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { dataService } from '../../../services/dataService';
import { Team, User, Order } from '../../../types';
import { toast } from 'sonner';

interface UpdateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onSuccess?: () => void;
}

/**
 * Modal to update the assigned team for an existing OS
 */
export const UpdateTeamModal: React.FC<UpdateTeamModalProps> = ({
    isOpen,
    onClose,
    order,
    onSuccess
}) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [selectedLeaderId, setSelectedLeaderId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadTeams();
            setSelectedTeamId(order.teamId || '');
            setSelectedLeaderId('');
            setTeamMembers([]);
        }
    }, [isOpen, order]);

    useEffect(() => {
        if (selectedTeamId) {
            dataService.getAvailableTeamMembers(selectedTeamId).then(members => {
                setTeamMembers(members);
                // If it's the current team, pre-select current leader if available (assuming order has teamLeaderId but it might not be in the type yet, so use isTeamLeader as fallback)
                // Actually order object might need to have teamLeaderId to pre-fill correctly if we want to show current leader.
                // Assuming we want to reset or smart select.
                const defaultLeader = members.find(m => m.isTeamLeader);
                if (defaultLeader) {
                    setSelectedLeaderId(defaultLeader.id.toString());
                } else if (members.length > 0) {
                    setSelectedLeaderId(members[0].id.toString());
                } else {
                    setSelectedLeaderId('');
                }
            });
        } else {
            setTeamMembers([]);
            setSelectedLeaderId('');
        }
    }, [selectedTeamId]);

    const loadTeams = async () => {
        setIsLoading(true);
        try {
            let providerCompanyId = order.providerCompanyId;
            let providerDepartmentId = order.providerDepartmentId;

            // Fallback: fetch contract details if missing provider info
            if ((!providerCompanyId || !providerDepartmentId) && order.contractId) {
                const contract = await dataService.getContractById(order.contractId);
                if (contract) {
                    if (!providerCompanyId) providerCompanyId = contract.providerCompanyId;
                    if (!providerDepartmentId) providerDepartmentId = contract.providerDepartmentId;
                }
            }

            // Default to order.companyId if no provider company found (internal service)
            const targetCompanyId = providerCompanyId || order.companyId;

            const data = await dataService.getTeams(targetCompanyId);

            const filteredTeams = providerDepartmentId
                ? data.filter(t => t.departmentId == providerDepartmentId)
                : data;

            setTeams(filteredTeams);
        } catch (error) {
            console.error('Error loading teams:', error);
            toast.error('Erro ao carregar equipes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedTeamId) {
            toast.error('Por favor, selecione a equipe');
            return;
        }

        setIsSaving(true);
        try {
            await dataService.updateOrderTeam(order.id, selectedTeamId, selectedLeaderId);
            toast.success('Equipe atualizada com sucesso');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating team:', error);
            toast.error('Erro ao atualizar equipe');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="ALTERAR EQUIPE"
            maxWidth="sm"
        >
            <div className="flex flex-col gap-6 py-2">
                <div className="w-full bg-[#3B82F6] rounded-2xl p-6 shadow-lg shadow-blue-500/30 flex flex-col justify-center">
                    <h3 className="text-4xl font-bold text-white tracking-tight mb-3">{order.orderMask}</h3>
                    <div className="flex items-end justify-between w-full">
                        <span className="text-white/90 text-[11px] font-bold uppercase tracking-wider">
                            OS {[order.typeCode, order.typeSubCode, order.objectCode].filter(Boolean).join('/')}
                        </span>
                        <span className="text-white text-[11px] font-bold uppercase tracking-wider">
                            {order.priorityCode}
                        </span>
                    </div>
                </div>

                <Select
                    label="Nova Equipe Executora"
                    options={teams.map(t => ({ value: t.id, label: `${t.code} - ${t.name}` }))}
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    placeholder="Selecione uma equipe..."
                    leftIcon={<span className="material-symbols-outlined">groups</span>}
                    required
                />

                <Select
                    label="Líder da Equipe"
                    options={teamMembers.map(u => ({ value: u.id, label: `${u.isTeamLeader ? '★ ' : ''}${u.nameShort || u.nameFull}` }))}
                    value={selectedLeaderId}
                    onChange={(e) => setSelectedLeaderId(e.target.value)}
                    placeholder="Selecione um líder..."
                    leftIcon={<span className="material-symbols-outlined">person</span>}
                    disabled={!selectedTeamId}
                />

                <div className="flex flex-col mt-4">
                    <button
                        onClick={handleConfirm}
                        disabled={isSaving || isLoading}
                        className={`
                            w-full py-4 rounded-2xl bg-primary text-white font-bold transition-all shadow-lg active:scale-95
                            ${(isSaving || isLoading) ? 'opacity-50 grayscale' : 'hover:bg-primary-dark'}
                        `}
                    >
                        {isSaving ? 'Salvando...' : 'Atualizar Equipe'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
