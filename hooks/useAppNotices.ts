import { useState, useEffect, useCallback } from 'react';
import { SystemNotice, NoticeFilters } from '../types';
import { appNoticesService } from '../services/core/appNoticesService';

const NOTICES_CHANGED_EVENT = 'app-notices-changed';

export const emitNoticesChanged = () => {
  window.dispatchEvent(new CustomEvent(NOTICES_CHANGED_EVENT));
};

interface UseAppNoticesOptions {
  dashboard?: string;
  autoRefreshInterval?: number;
}

interface UseAppNoticesReturn {
  notices: SystemNotice[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAppNotices = ({
  dashboard,
  autoRefreshInterval = 30000,
}: UseAppNoticesOptions = {}): UseAppNoticesReturn => {
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    try {
      setError(null);
      const data = await appNoticesService.getActiveNotices(dashboard);
      setNotices(data);
    } catch (err) {
      console.error('[AppNoticeTicker] Error:', err);
      setError('Erro ao carregar avisos do app');
    } finally {
      setLoading(false);
    }
  }, [dashboard]);

  useEffect(() => {
    fetchNotices();

    const interval = setInterval(fetchNotices, autoRefreshInterval);
    const onNoticesChanged = () => fetchNotices();
    window.addEventListener(NOTICES_CHANGED_EVENT, onNoticesChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTICES_CHANGED_EVENT, onNoticesChanged);
    };
  }, [fetchNotices, autoRefreshInterval]);

  return {
    notices,
    loading,
    error,
    refresh: fetchNotices,
  };
};

interface UseAppNoticesAdminReturn {
  notices: SystemNotice[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchNotices: (filters?: NoticeFilters) => Promise<void>;
  createNotice: (input: import('../types').CreateSystemNoticeInput) => Promise<SystemNotice>;
  updateNotice: (id: number, data: Partial<SystemNotice>) => Promise<SystemNotice>;
  deleteNotice: (id: number) => Promise<void>;
  toggleActive: (id: number, isActive: boolean) => Promise<void>;
}

export const useAppNoticesAdmin = (): UseAppNoticesAdminReturn => {
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async (filters: NoticeFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await appNoticesService.listNotices(filters);
      setNotices(result.notices);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createNotice = useCallback(async (input: import('../types').CreateSystemNoticeInput) => {
    const notice = await appNoticesService.createNotice(input);
    await fetchNotices();
    emitNoticesChanged();
    return notice;
  }, [fetchNotices]);

  const updateNotice = useCallback(async (id: number, data: Partial<SystemNotice>) => {
    const notice = await appNoticesService.updateNotice(id, data);
    await fetchNotices();
    emitNoticesChanged();
    return notice;
  }, [fetchNotices]);

  const deleteNotice = useCallback(async (id: number) => {
    await appNoticesService.deleteNotice(id);
    await fetchNotices();
    emitNoticesChanged();
  }, [fetchNotices]);

  const toggleActive = useCallback(async (id: number, isActive: boolean) => {
    await appNoticesService.toggleNoticeActive(id, isActive);
    await fetchNotices();
    emitNoticesChanged();
  }, [fetchNotices]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  return {
    notices,
    total,
    loading,
    error,
    fetchNotices,
    createNotice,
    updateNotice,
    deleteNotice,
    toggleActive,
  };
};
