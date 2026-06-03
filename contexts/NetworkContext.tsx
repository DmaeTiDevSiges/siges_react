import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { networkService, NetworkStatus, ConnectionType } from '../services/networkService';
import { DataQualityProvider, DataQualityContextType } from './DataQualityContext';

export interface NetworkContextType {
  isConnected: boolean;
  connectionType: ConnectionType;
  isLoading: boolean;
}

// Combina contexto de rede com contexto de qualidade de dados
export interface CombinedNetworkContextType extends NetworkContextType, DataQualityContextType {}

export const NetworkContext = createContext<CombinedNetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    // Initialize with current navigator.onLine status
    if (typeof window !== 'undefined' && navigator) {
      return {
        isConnected: navigator.onLine,
        connectionType: navigator.onLine ? 'unknown' : null,
      };
    }
    return {
      isConnected: false,
      connectionType: null,
    };
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize network service
    const initNetwork = async () => {
      try {
        await networkService.initialize();
        const currentStatus = networkService.getStatus();
        console.log('[NetworkContext] Initialized with status:', currentStatus);
        setStatus(currentStatus);
        setIsLoading(false);
      } catch (error) {
        console.error('[NetworkContext] Error initializing network service:', error);
        setIsLoading(false);
      }
    };

    initNetwork();

    // Subscribe to network changes
    const unsubscribe = networkService.subscribe((newStatus) => {
      console.log('[NetworkContext] Status changed:', newStatus);
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Renderiza o DataQualityProvider como filho para combinar contextos
  return (
    <NetworkContext.Provider value={
      {
        isConnected: status.isConnected,
        connectionType: status.connectionType,
        isLoading,
        // Será populado pelo DataQualityProvider
        dataQualityStatus: {} as any,
        isDataQualityMonitoring: false,
        startDataQualityMonitoring: async () => {},
        stopDataQualityMonitoring: () => {},
        getDataQualityHistory: () => []
      }
    }>
      <DataQualityProvider>
        {children}
      </DataQualityProvider>
    </NetworkContext.Provider>
  );
};
