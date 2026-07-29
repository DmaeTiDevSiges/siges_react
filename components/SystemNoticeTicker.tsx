import React from 'react';
import { SystemNotice } from '../types';
import { useSystemNotices } from '../hooks/useSystemNotices';

interface SystemNoticeTickerProps {
  dashboard?: string;
}

export const SystemNoticeTicker: React.FC<SystemNoticeTickerProps> = ({ dashboard }) => {
  const { notices, loading } = useSystemNotices({ dashboard });

  const nowStr = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T');
  const now = new Date(nowStr);
  const visibleNotices = notices.filter((notice) => {
    const start = new Date(notice.startDate);
    const end = new Date(notice.endDate);
    return notice.isActive && start <= now && end >= now;
  });

  if (loading || visibleNotices.length === 0) {
    return null;
  }

  return (
    <div className="w-full border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30">
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0">notifications</span>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {visibleNotices.map((notice) => (
            <NoticeChip key={notice.id} notice={notice} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface NoticeChipProps {
  notice: SystemNotice;
}

const NoticeChip: React.FC<NoticeChipProps> = ({ notice }) => {
  const color = notice.severityColor || '#6B7280';

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
        color: color,
      }}
    >
      <span className="font-semibold truncate max-w-[200px]">{notice.title}</span>
      <span className="opacity-60 hidden sm:inline truncate max-w-[300px]">- {notice.message}</span>
    </div>
  );
};
