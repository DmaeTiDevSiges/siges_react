import React, { useState } from 'react';
import { ToolsList } from './ToolsList';
import { UserToolsView } from './UserToolsView';
import { ResponsibleToolsView } from './ResponsibleToolsView';

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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            {/* Page Header */}
            <div className="px-4 pt-5 pb-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
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
