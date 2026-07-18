import React from 'react';

interface Tab {
    id: string;
    label: string;
}

interface TabsBarProps {
    tabs: (Tab | string)[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
}

export const TabsBar: React.FC<TabsBarProps> = ({ tabs, activeTab, onTabChange, className = '' }) => {
    const normalizedTabs = tabs.map(t => typeof t === 'string' ? { id: t, label: t } : t);

    return (
        <div className={`flex items-center no-scrollbar overflow-x-auto gap-4 ${className}`}>
            {normalizedTabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${
                        activeTab === tab.id
                            ? 'text-primary'
                            : 'text-slate-400 hover:text-slate-300'
                    }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                </button>
            ))}
        </div>
    );
};
