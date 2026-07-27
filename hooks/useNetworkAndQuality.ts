import { useContext } from 'react';
import { NetworkContext, CombinedNetworkContextType } from '../contexts/NetworkContext';
import { useDataQuality } from './useDataQuality';

/**
 * Hook combinado para acessar tanto status de rede quanto qualidade de dados
 * Deve ser usado dentro do NetworkProvider
 *
 * @returns Contexto combinado de rede e qualidade
 * @throws Error se usado fora do NetworkProvider
 *
 * @example
 * const { isConnected, overallScore, qualityLevel } = useNetworkAndQuality();
 * if (!isConnected) {
 *   console.log('Sem conexão');
 * } else if (overallScore < 40) {
 *   console.log('Qualidade ruim');
 * }
 */
export const useNetworkAndQuality = (): CombinedNetworkContextType => {
  const networkContext = useContext(NetworkContext);
  const dataQualityContext = useDataQuality();

  if (!networkContext) {
    throw new Error('useNetworkAndQuality must be used inside NetworkProvider');
  }

  // Combina ambos os contextos
  return {
    // Network Context properties
    isConnected: networkContext.isConnected,
    connectionType: networkContext.connectionType,
    isLoading: networkContext.isLoading,
    
    // Data Quality Context properties
    dataQualityStatus: dataQualityContext.dataQualityStatus,
    isDataQualityMonitoring: dataQualityContext.isDataQualityMonitoring,
    startDataQualityMonitoring: dataQualityContext.startDataQualityMonitoring,
    stopDataQualityMonitoring: dataQualityContext.stopDataQualityMonitoring,
    getDataQualityHistory: dataQualityContext.getDataQualityHistory,
  };
};

/**
 * Hook derivado para obter status geral da conexão
 *
 * @returns Objeto com status geral
 */
export const useConnectionStatus = () => {
  const { isConnected, connectionType, dataQualityStatus } = useNetworkAndQuality();
  
  const hasGoodQuality = dataQualityStatus.overallScore >= 60;
  const isStable = dataQualityStatus.stabilityScore >= 70;
  const hasLowLatency = dataQualityStatus.currentMetrics.latency < 200;
  
  return {
    isConnected,
    connectionType,
    hasGoodQuality,
    isStable,
    hasLowLatency,
    
    // Status geral
    overallStatus: isConnected 
      ? hasGoodQuality && isStable && hasLowLatency 
        ? 'excellent' 
        : isConnected && hasGoodQuality 
          ? 'good' 
          : isConnected 
            ? 'fair' 
            : 'poor'
      : 'disconnected',
    
    // Mensagem para exibição
    statusMessage: !isConnected 
      ? 'Sem conexão de internet'
      : hasGoodQuality && isStable && hasLowLatency
        ? 'Conexão excelente'
        : isConnected && hasGoodQuality
          ? 'Conexão boa'
          : isConnected
            ? 'Conexão instável'
            : 'Conexão ruim',
  };
};

/**
 * Hook derivado para notificações baseadas na qualidade
 *
 * @returns Funções de notificação
 */
export const useQualityNotifications = () => {
  const { isConnected, dataQualityStatus } = useNetworkAndQuality();
  
  const shouldShowDisconnectWarning = !isConnected;
  const shouldShowQualityWarning = isConnected && dataQualityStatus.overallScore < 40;
  const shouldShowStabilityWarning = isConnected && dataQualityStatus.stabilityScore < 50;
  const shouldShowLatencyWarning = isConnected && dataQualityStatus.currentMetrics.latency > 1000;
  
  const hasAnyWarning = shouldShowDisconnectWarning || 
                       shouldShowQualityWarning || 
                       shouldShowStabilityWarning || 
                       shouldShowLatencyWarning;
  
  return {
    shouldShowDisconnectWarning,
    shouldShowQualityWarning,
    shouldShowStabilityWarning,
    shouldShowLatencyWarning,
    hasAnyWarning,
    
    // Mensagens de alerta específicas
    alertMessages: {
      disconnect: '⚠️ Sem conexão de internet',
      quality: '⚠️ Qualidade de conexão baixa',
      stability: '⚠️ Conexão instável',
      latency: '⚠️ Latência muito alta'
    },
    
    // Prioridade do alerta
    alertPriority: shouldShowDisconnectWarning ? 'critical' : 
                  shouldShowQualityWarning ? 'high' :
                  shouldShowStabilityWarning ? 'medium' :
                  shouldShowLatencyWarning ? 'medium' : 'none'
  };
};

/**
 * Hook para logs e monitoramento
 */
export const useConnectionLogger = () => {
  const { isConnected, connectionType, dataQualityStatus } = useNetworkAndQuality();
  
  const logConnectionEvent = (event: string, details?: any) => {
    const log = {
      timestamp: new Date().toISOString(),
      event,
      isConnected,
      connectionType,
      quality: dataQualityStatus.overallScore,
      details
    };
    // Aqui você poderia enviar logs para um serviço de analytics
    // if (typeof window !== 'undefined' && window.analytics) {
    //   window.analytics.log('connection_event', log);
    // }
  };
  
  const logQualityDegradation = (threshold: number = 40) => {
    if (isConnected && dataQualityStatus.overallScore < threshold) {
      logConnectionEvent('quality_degradation', {
        score: dataQualityStatus.overallScore,
        threshold,
        metrics: {
          latency: dataQualityStatus.currentMetrics.latency,
          bandwidth: dataQualityStatus.currentMetrics.bandwidth,
          stability: dataQualityStatus.currentMetrics.stability
        }
      });
    }
  };
  
  const logConnectionLoss = () => {
    if (!isConnected) {
      logConnectionEvent('connection_loss');
    }
  };
  
  return {
    logConnectionEvent,
    logQualityDegradation,
    logConnectionLoss,
    currentStatus: {
      isConnected,
      connectionType,
      qualityScore: dataQualityStatus.overallScore,
      timestamp: dataQualityStatus.lastUpdated
    }
  };
};