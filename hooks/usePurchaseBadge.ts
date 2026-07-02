import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface PurchaseBadgeState {
  hasPending: boolean;
  hasAuthorized: boolean;
  count: number;
}

export function usePurchaseBadge(intervalMs = 30000) {
  const [badgeState, setBadgeState] = useState<PurchaseBadgeState>({
    hasPending: false,
    hasAuthorized: false,
    count: 0
  });

  useEffect(() => {
    let mounted = true;

    const fetchPurchases = async () => {
      try {
        const dashboard = await dataService.getMaterialPurchasesDashboard();
        if (mounted) {
          setBadgeState({
            hasPending: dashboard.pending > 0,
            hasAuthorized: dashboard.authorized > 0,
            count: dashboard.pending + dashboard.authorized
          });
        }
      } catch (error) {
        console.error('Error fetching purchases badge data:', error);
      }
    };

    fetchPurchases();

    const interval = setInterval(fetchPurchases, intervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return badgeState;
}
