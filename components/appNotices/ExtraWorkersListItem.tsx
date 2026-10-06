import React, { useEffect, useState } from 'react';

export interface ExtraWorkersListItemProps {
  unitId: number;
  title: string;
  subtitle?: string;
  total: number;
  value?: number;
  editable?: boolean;
  saving?: boolean;
  onChange: (unitId: number, nextValue: number) => void;
}

const clamp = (n: number) => Math.max(0, Math.round(Number.isFinite(n) ? n : 0));

export const ExtraWorkersListItem: React.FC<ExtraWorkersListItemProps> = ({
  unitId,
  title,
  subtitle,
  total,
  value,
  editable = false,
  saving = false,
  onChange,
}) => {
  const current = value ?? 0;
  const [local, setLocal] = useState(String(current));

  useEffect(() => {
    setLocal(String(current));
  }, [current]);

  const commit = (next: number) => {
    const normalized = clamp(next);
    if (normalized === current) {
      setLocal(String(normalized));
      return;
    }
    onChange(unitId, normalized);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const showTotalChip = total !== current;

  return (
    <div className="bg-white dark:bg-card-dark rounded-[12px] border border-slate-100 dark:border-slate-800 shadow-sm p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate text-left">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate text-left mt-0.5">
            {subtitle}
          </p>
        )}
        {showTotalChip && (
          <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
            {total} no total
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          aria-label="Diminuir"
          disabled={!editable || saving || current <= 0}
          onClick={() => commit(current - 1)}
          className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>

        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={local}
          disabled={!editable || saving}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => commit(Number(local))}
          onKeyDown={handleKeyDown}
          className="w-14 h-9 text-center text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <button
          type="button"
          aria-label="Aumentar"
          disabled={!editable || saving}
          onClick={() => commit(current + 1)}
          className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {saving ? (
            <span className="material-symbols-outlined text-[18px] animate-spin text-primary">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">add</span>
          )}
        </button>
      </div>
    </div>
  );
};
