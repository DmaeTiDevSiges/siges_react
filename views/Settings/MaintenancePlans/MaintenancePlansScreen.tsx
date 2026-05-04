import React, { useState } from 'react';
import { MaintenancePlansList } from './MaintenancePlansList';
import { MaintenancePlanForm } from './MaintenancePlanForm';
import { MaintenancePlanDetails } from './MaintenancePlanDetails';

export const MaintenancePlansScreen: React.FC<{
    currentScreen: string;
    onNavigate: (screen: any) => void;
    onBack: () => void;
    currentUser: any;
}> = ({ currentScreen, onNavigate, onBack, currentUser }) => {
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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
