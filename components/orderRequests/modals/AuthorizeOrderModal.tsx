import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { dataService } from '../../../services/dataService';
import { Team, OrderPlan, User, Order } from '../../../types';
import { toast } from 'sonner';

interface AuthorizeOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onSuccess?: () => void;
}

export const AuthorizeOrderModal: React.FC<AuthorizeOrderModalProps> = ({
    isOpen,
    onClose,
    order,
    onSuccess
}) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [plans, setPlans] = useState<OrderPlan[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [selectedLeaderId, setSelectedLeaderId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
            // Reset state
            setSelectedTeamId(order.teamId || '');
            setSelectedPlanId(order.planId || '');
            setSelectedLeaderId('');
            setTeamMembers([]);
        }
    }, [isOpen, order]);

    useEffect(() => {
        if (selectedTeamId) {
            dataService.getAvailableTeamMembers(selectedTeamId).then(members => {
                setTeamMembers(members);
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

    const loadData = async () => {
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

            const [teamsData, plansData] = await Promise.all([
                dataService.getTeams(targetCompanyId),
                dataService.getPlans()
            ]);

            const filteredTeams = providerDepartmentId
                ? teamsData.filter(t => t.departmentId == providerDepartmentId)
                : teamsData;

            setTeams(filteredTeams);
            setPlans(plansData);
        } catch (error) {
            console.error('Error loading authorize modal data:', error);
            toast.error('Erro ao carregar dados para autorização');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedTeamId || !selectedLeaderId) {
            toast.error('Por favor, selecione a equipe e o líder');
            return;
        }

        setIsSaving(true);
        try {
            await dataService.authorizeOrder(order.id, selectedTeamId, selectedPlanId, selectedLeaderId);
            toast.success('Ordem autorizada com sucesso');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error authorizing order:', error);
            toast.error('Erro ao autorizar ordem');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={order.parentId ? "AUTORIZAÇÃO OS" : "GERAR OS"}
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
                    label="Equipe Executora"
                    options={teams.map(t => ({ value: t.id, label: t.code }))}
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
                    required
                />

                <Select
                    label="Plano de Execução"
                    options={plans.map(p => ({ value: p.id, label: p.description }))}
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    placeholder="Selecione um plano..."
                    leftIcon={<span className="material-symbols-outlined">assignment</span>}
                />

                <div className="flex flex-col gap-3 mt-4">
                    <button
                        onClick={handleConfirm}
                        disabled={isSaving || isLoading}
                        className={`
                            w-full py-4 rounded-2xl bg-primary text-white font-bold transition-all shadow-lg active:scale-95
                            ${(isSaving || isLoading) ? 'opacity-50 grayscale' : 'hover:bg-primary-dark'}
                        `}
                    >
                        {isSaving ? 'Processando...' : (order.parentId ? 'Autorizar OS' : 'Gerar Ordem de Serviço')}
                    </button>
                </div>
            </div>
        </Modal >
    );
};
