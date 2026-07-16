import React, { useState } from 'react';
import { MaintenancePlansList } from './MaintenancePlansList';
import { MaintenancePlanForm } from './MaintenancePlanForm';
import { MaintenancePlanDetails } from './MaintenancePlanDetails';
import { dataService } from '../../../services/dataService';
import { toast } from 'sonner';

export const MaintenancePlansScreen: React.FC<{
    currentScreen: string;
    onNavigate: (screen: any) => void;
    onBack: () => void;
    currentUser: any;
}> = ({ currentScreen, onNavigate, onBack, currentUser }) => {
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    const handleDuplicate = async (planId: string) => {
        console.log('[DUPLICAR] ▶ handleDuplicate iniciado');
        console.log('[DUPLICAR] planId:', planId);
        console.log('[DUPLICAR] currentUser:', currentUser);
        console.log('[DUPLICAR] userId:', currentUser?.id, '→ String:', String(currentUser?.id));
        try {
            console.log('[DUPLICAR] chamando dataService.duplicateMaintenancePlan...');
            const newPlanId = await dataService.duplicateMaintenancePlan(planId, String(currentUser?.id));
            console.log('[DUPLICAR] ✅ novo plano ID:', newPlanId);
            setSelectedPlanId(newPlanId);
            console.log('[DUPLICAR] setSelectedPlanId chamado, navegando para maintenance-plan-edit...');
            onNavigate('maintenance-plan-edit');
            toast.success('Plano duplicado com sucesso');
        } catch (error) {
            console.error('[DUPLICAR] ❌ ERRO:', error);
            console.error('[DUPLICAR] mensagem:', (error as any)?.message);
            console.error('[DUPLICAR] detalhes:', JSON.stringify(error, null, 2));
            toast.error('Erro ao duplicar plano');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

            <div className="flex-1 overflow-y-auto">
                {currentScreen === 'maintenance-plans' && (
                    <MaintenancePlansList 
                        onBack={onBack}
                        onSelect={(plan) => {
                            setSelectedPlanId(plan.id);
                            onNavigate('maintenance-plan-details');
                        }} 
                        onAdd={() => {
                            setSelectedPlanId(null);
                            onNavigate('maintenance-plan-form');
                        }} 
                    />
                )}

                {currentScreen === 'maintenance-plan-details' && selectedPlanId && (
                    <MaintenancePlanDetails 
                        planId={selectedPlanId}
                        onEdit={() => onNavigate('maintenance-plan-edit')}
                        onDuplicate={() => handleDuplicate(selectedPlanId)}
                        onBack={() => onNavigate('maintenance-plans')}
                    />
                )}

                {(currentScreen === 'maintenance-plan-form' || currentScreen === 'maintenance-plan-edit') && (
                    <MaintenancePlanForm 
                        planId={selectedPlanId}
                        onSave={() => onNavigate(currentScreen === 'maintenance-plan-edit' ? 'maintenance-plan-details' : 'maintenance-plans')}
                        onCancel={() => onNavigate(currentScreen === 'maintenance-plan-edit' ? 'maintenance-plan-details' : 'maintenance-plans')}
                        userId={String(currentUser?.id)}
                    />
                )}
            </div>
        </div>
    );
};
