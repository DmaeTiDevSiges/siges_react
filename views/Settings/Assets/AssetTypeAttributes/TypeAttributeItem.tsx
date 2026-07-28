import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TypeAttributeConfig } from '../../../../types';
import { Select } from '../../../../components/ui/Select';

interface TypeAttributeItemProps {
    config: TypeAttributeConfig;
    onToggleRequired: (junctionId: string, value: boolean) => void;
    onChangeColSpan: (junctionId: string, value: number) => void;
    onRemove: (junctionId: string, attributeId: string) => void;
}

const dataTypeLabels: Record<string, string> = {
    text: 'Texto',
    number: 'Número',
    date: 'Data',
    boolean: 'Sim/Não',
    select: 'Seleção'
};

export const TypeAttributeItem: React.FC<TypeAttributeItemProps> = ({
    config,
    onToggleRequired,
    onChangeColSpan,
    onRemove
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: config.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: 'relative' as const,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
        >
            <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 touch-none"
                >
                    <span className="material-symbols-outlined text-xl">drag_indicator</span>
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {config.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                            {config.fieldKey}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {dataTypeLabels[config.dataType] || config.dataType}
                        </span>
                        {config.unit && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                ({config.unit})
                            </span>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Required Toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                            Obrig.
                        </span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={config.isRequired}
                                onChange={(e) => onToggleRequired(config.id, e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                    </label>

                    {/* Col Span Selector */}
                    <Select
                        value={String(config.colSpan)}
                        onChange={(e) => onChangeColSpan(config.id, parseInt(e.target.value))}
                        className="w-16 text-xs py-1 px-1"
                    >
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="6">6</option>
                        <option value="12">12</option>
                    </Select>

                    {/* Remove Button */}
                    <button
                        onClick={() => onRemove(config.id, config.attributeId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Remover atributo"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
