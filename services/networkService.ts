import { Network } from '@capacitor/network';

export type ConnectionType = 'wifi' | '4g' | '5g' | 'cellular' | 'ethernet' | 'unknown' | null;

export interface NetworkStatus {
  isConnected: boolean;
  connectionType: ConnectionType;
}

export interface NetworkChangeCallback {
  (status: NetworkStatus): void;
}

class NetworkServiceImpl {
  private listeners: Set<NetworkChangeCallback> = new Set();
  private currentStatus: NetworkStatus = {
    isConnected: false,
    connectionType: null,
  };
  private initialized = false;
  private pollerInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize network monitoring
   */
  async initialize() {
    if (this.initialized) return;

    // Initialize with current web status FIRST (for browsers)
    if (typeof window !== 'undefined' && navigator) {
      this.currentStatus = {
        isConnected: navigator.onLine,
        connectionType: navigator.onLine ? 'unknown' : null,
      };
      console.log('[NetworkService] Initial web status:', this.currentStatus);
    }

    // Try to get native status (Capacitor)
    try {
      await this.updateStatus();
      console.log('[NetworkService] Updated from native:', this.currentStatus);
    } catch (error) {
      console.warn('[NetworkService] Capacitor not available, using web API');
    }

    // Subscribe to Capacitor network changes
    try {
      if (Network.addListener) {
        Network.addListener('networkStatusChange', (status) => {
          this.handleStatusChange(status);
        });
        console.log('[NetworkService] Capacitor listener attached');
      }
    } catch (error) {
      console.warn('[NetworkService] Could not attach Capacitor listener:', error);
    }

    // Add web API listeners for online/offline events
    if (typeof window !== 'undefined') {
      const onlineHandler = () => {
        console.log('[NetworkService] Online event fired');
        this.handleWebStatusChange();
      };
      const offlineHandler = () => {
        console.log('[NetworkService] Offline event fired');
        this.handleWebStatusChange();
      };

      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      console.log('[NetworkService] Web API listeners attached');

      // Start polling for web (in case events don't fire - e.g., airplane mode)
      this.startWebPoller();
    }

    this.initialized = true;
    console.log('[NetworkService] Initialization complete');
  }

  /**
   * Start polling for web status changes (for browsers that don't fire online/offline events)
   */
  private startWebPoller() {
    if (this.pollerInterval) clearInterval(this.pollerInterval);

    this.pollerInterval = setInterval(() => {
      if (typeof window !== 'undefined' && navigator) {
        const currentOnlineStatus = navigator.onLine;
        if (currentOnlineStatus !== this.currentStatus.isConnected) {
          console.log('[NetworkService] Web status changed via poller:', currentOnlineStatus);
          this.handleWebStatusChange();
        }
      }
    }, 1000); // Check every second
  }

  /**
   * Stop polling
   */
  private stopWebPoller() {
    if (this.pollerInterval) {
      clearInterval(this.pollerInterval);
      this.pollerInterval = null;
    }
  }

  /**
   * Update current status from native
   */
  private async updateStatus() {
    try {
      const status = await Network.getStatus();
      this.currentStatus = {
        isConnected: status.connected,
        connectionType: this.normalizeConnectionType(status.connectionType),
      };
    } catch (error) {
      console.error('Error getting network status:', error);
      // Fallback to web API
      this.currentStatus = {
        isConnected: navigator.onLine,
        connectionType: navigator.onLine ? 'unknown' : null,
      };
    }
  }

  /**
   * Handle status change from Capacitor
   */
  private handleStatusChange(status: any) {
    this.currentStatus = {
      isConnected: status.connected,
      connectionType: this.normalizeConnectionType(status.connectionType),
    };
    this.notifyListeners();
  }

  /**
   * Handle status change from web API
   */
  private handleWebStatusChange() {
    this.currentStatus = {
      isConnected: navigator.onLine,
      connectionType: navigator.onLine ? 'unknown' : null,
    };
    this.notifyListeners();
  }

  /**
   * Normalize connection type from native to standard format
   */
  private normalizeConnectionType(connectionType: string): ConnectionType {
    if (!connectionType) return null;

    const normalized = connectionType.toLowerCase();

    if (normalized.includes('wifi')) return 'wifi';
    if (normalized.includes('5g')) return '5g';
    if (normalized.includes('4g') || normalized.includes('lte')) return '4g';
    if (normalized.includes('cellular') || normalized.includes('mobile')) return 'cellular';
    if (normalized.includes('ethernet')) return 'ethernet';

    return 'unknown';
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if device is connected
   */
  isConnected(): boolean {
    return this.currentStatus.isConnected;
  }

  /**
   * Get connection type
   */
  getConnectionType(): ConnectionType {
    return this.currentStatus.connectionType;
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: NetworkChangeCallback): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.getStatus());
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Cleanup listeners (rarely needed, but useful for testing)
   */
  destroy() {
    this.listeners.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const networkService = new NetworkServiceImpl();
