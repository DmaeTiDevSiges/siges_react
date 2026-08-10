import React, { useState } from 'react';
import { ToolsList } from './ToolsList';
import { UserToolsView } from './UserToolsView';
import { ResponsibleToolsView } from './ResponsibleToolsView';
import { TabsBar } from '../../components/ui/TabsBar';

interface ToolsMainViewProps {
    companyId: string;
}

type Tab = 'inventory' | 'responsible' | 'movements';

export const ToolsMainView: React.FC<ToolsMainViewProps> = ({ companyId }) => {
    const [activeTab, setActiveTab] = useState<Tab>('inventory');

    const tabs: { id: Tab; label: string }[] = [
        { id: 'inventory',    label: 'Inventário' },
        { id: 'movements',    label: 'Movimentações' },
        { id: 'responsible',  label: 'Responsáveis' },
    ];

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Page Header */}
            <div className="px-4 pt-5 pb-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">

                {/* Tabs */}
                <TabsBar tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as Tab)} />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'inventory' && <ToolsList />}
                {activeTab === 'responsible' && <ResponsibleToolsView />}
                {activeTab === 'movements' && <UserToolsView companyId={companyId} />}
            </div>
        </div>
    );
};
