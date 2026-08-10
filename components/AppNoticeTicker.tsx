import React, { useState } from 'react';
import { SystemNotice } from '../types';
import { useAppNotices } from '../hooks/useAppNotices';
import { Modal } from './ui/Modal';

interface AppNoticeTickerProps {
  dashboard?: string;
}

export const AppNoticeTicker: React.FC<AppNoticeTickerProps> = ({ dashboard }) => {
  const { notices, loading } = useAppNotices({ dashboard });

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
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0">notifications</span>
        
        <div className="flex items-center gap-2 flex-wrap">
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const color = notice.severityColor || '#6B7280';

  return (
    <>
      <div
        className="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer inline-flex items-center transition-all hover:opacity-90 active:scale-[0.98] shrink-0"
        style={{
          backgroundColor: `${color}15`,
          borderColor: `${color}30`,
          color: color,
        }}
        onClick={() => setIsModalOpen(true)}
      >
        <span>{notice.title}</span>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={notice.title}
        type="info"
        maxWidth="sm"
      >
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {notice.message}
        </div>
        {(notice.categoryLabel || notice.severityLabel) && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {notice.categoryLabel && (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{
                  backgroundColor: `${notice.categoryColor || color}15`,
                  color: notice.categoryColor || color,
                }}
              >
                {notice.categoryLabel}
              </span>
            )}
            {notice.severityLabel && (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{
                  backgroundColor: `${color}15`,
                  color: color,
                }}
              >
                {notice.severityLabel}
              </span>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
