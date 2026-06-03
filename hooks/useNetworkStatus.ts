import { useContext } from 'react';
import { NetworkContext, NetworkContextType } from '../contexts/NetworkContext';
import { useNetworkAndQuality, useQualityNotifications } from './useNetworkAndQuality';

/**
 * Custom hook to access network status
 * Must be used inside NetworkProvider
 *
 * @returns Network status context (maintained for backward compatibility)
 * @throws Error if used outside NetworkProvider
 *
 * @example
 * const { isConnected, connectionType } = useNetworkStatus();
 * if (!isConnected) {
 *   console.log('No internet connection');
 * }
 */
export const useNetworkStatus = (): NetworkContextType => {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetworkStatus must be used inside NetworkProvider');
  }

  // Retorna apenas as propriedades originais para manter compatibilidade
  return {
    isConnected: context.isConnected,
    connectionType: context.connectionType,
    isLoading: context.isLoading,
  };
};

/**
 * Alias para useNetworkAndQuality para código mais limpo
 * Recomendado para novo código que precisa de qualidade de dados
 */
export const useNetwork = useNetworkAndQuality;

/**
 * Export de useNetworkAndQuality e useQualityNotifications para compatibilidade
 */
export { useNetworkAndQuality, useQualityNotifications };
