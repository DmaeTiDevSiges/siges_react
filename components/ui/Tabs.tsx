import React, { createContext, useContext, useEffect, useRef } from 'react';

interface TabsContextType {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
}

// Root container
const Root: React.FC<TabsProps> = ({ value, onValueChange, children }) => {
    return (
        <TabsContext.Provider value={{ activeTab: value, setActiveTab: onValueChange }}>
            <div className="flex flex-col w-full">
                {children}
            </div>
        </TabsContext.Provider>
    );
};

// Scrollable List container
const List: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { activeTab } = useContext(TabsContext)!;

    useEffect(() => {
        if (activeTab && scrollRef.current) {
            const activeElement = scrollRef.current.querySelector(`[data-tab="${activeTab}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            }
        }
    }, [activeTab]);

    return (
        <div className={`px-4 pt-4 pb-3 ${className}`}>
            <div
                ref={scrollRef}
                className="flex overflow-x-auto no-scrollbar h-12 w-full items-center justify-start p-1 gap-2 scroll-smooth"
            >
                {children}
            </div>
        </div>
    );
};

// Individual Trigger Button
interface TriggerProps {
    value: string;
    children: React.ReactNode;
}

const Trigger: React.FC<TriggerProps> = ({ value, children }) => {
    const { activeTab, setActiveTab } = useContext(TabsContext)!;
    const isActive = activeTab === value;

    return (
        <button
            data-tab={value}
            onClick={() => setActiveTab(value)}
            className={`whitespace-nowrap px-4 h-full flex items-center justify-center rounded-[12px] text-sm font-semibold transition-all ${isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
        >
            {children}
        </button>
    );
};

// Content Panel
interface ContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

const Content: React.FC<ContentProps> = ({ value, children, className = '' }) => {
    const { activeTab } = useContext(TabsContext)!;

    if (activeTab !== value) return null;

    return (
        <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}>
            {children}
        </div>
    );
};

export const Tabs = {
    Root,
    List,
    Trigger,
    Content
};
