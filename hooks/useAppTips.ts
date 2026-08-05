import { useState, useEffect, useCallback } from 'react';
import { AppTip } from '../types';
import { dataService } from '../services/dataService';

const TIPS_CHANGED_EVENT = 'app-tips-changed';

export const emitAppTipsChanged = () => {
    window.dispatchEvent(new CustomEvent(TIPS_CHANGED_EVENT));
};

interface UseAppTipsOptions {
    screenKey: string;
    userId?: number;
    userCompanyId?: number | null;
    userDepartmentId?: number | null;
    userProfileId?: number | null;
    autoRefreshInterval?: number;
}

interface UseAppTipsReturn {
    tips: AppTip[];
    currentTip: AppTip | null;
    loading: boolean;
    dismissTip: (tipId: number) => Promise<void>;
    refetch: () => Promise<void>;
}

export const useAppTips = ({
    screenKey,
    userId,
    userCompanyId,
    userDepartmentId,
    userProfileId,
    autoRefreshInterval = 60000,
}: UseAppTipsOptions): UseAppTipsReturn => {
    const [tips, setTips] = useState<AppTip[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTips = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        try {
            const data = await dataService.getActiveTipsForScreen(
                screenKey,
                userId,
                userCompanyId,
                userDepartmentId,
                userProfileId,
            );
            setTips(data);
        } catch (err) {
            console.error('[useAppTips] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [screenKey, userId, userCompanyId, userDepartmentId, userProfileId]);

    useEffect(() => {
        fetchTips();

        const interval = setInterval(fetchTips, autoRefreshInterval);
        const onTipsChanged = () => fetchTips();
        window.addEventListener(TIPS_CHANGED_EVENT, onTipsChanged);

        return () => {
            clearInterval(interval);
            window.removeEventListener(TIPS_CHANGED_EVENT, onTipsChanged);
        };
    }, [fetchTips, autoRefreshInterval]);

    const dismissTip = useCallback(async (tipId: number) => {
        if (!userId) return;
        try {
            await dataService.dismissAppTip(tipId, userId);
            setTips((prev) => prev.filter((t) => t.id !== tipId));
        } catch (err) {
            console.error('[useAppTips] Error dismissing tip:', err);
        }
    }, [userId]);

    return {
        tips,
        currentTip: tips[0] || null,
        loading,
        dismissTip,
        refetch: fetchTips,
    };
};

interface UseAppTipsCountOptions {
    userId?: number;
    userCompanyId?: number | null;
    userDepartmentId?: number | null;
    userProfileId?: number | null;
    autoRefreshInterval?: number;
}

export const useAppTipsCount = ({
    userId,
    userCompanyId,
    userDepartmentId,
    userProfileId,
    autoRefreshInterval = 60000,
}: UseAppTipsCountOptions) => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchCount = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        try {
            const c = await dataService.getUndismissedTipsCount(userId, userCompanyId, userDepartmentId, userProfileId);
            setCount(c);
        } catch (err) {
            console.error('[useAppTipsCount] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, userCompanyId, userDepartmentId, userProfileId]);

    useEffect(() => {
        fetchCount();

        const interval = setInterval(fetchCount, autoRefreshInterval);
        const onTipsChanged = () => fetchCount();
        window.addEventListener(TIPS_CHANGED_EVENT, onTipsChanged);

        return () => {
            clearInterval(interval);
            window.removeEventListener(TIPS_CHANGED_EVENT, onTipsChanged);
        };
    }, [fetchCount, autoRefreshInterval]);

    return { count, loading, refetch: fetchCount };
};
