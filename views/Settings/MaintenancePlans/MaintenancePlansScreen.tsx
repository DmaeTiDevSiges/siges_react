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
        try {
            const newPlanId = await dataService.duplicateMaintenancePlan(planId, String(currentUser?.id));
            setSelectedPlanId(newPlanId);
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
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">

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
