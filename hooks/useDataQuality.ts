import { useContext } from 'react';
import { DataQualityContext, DataQualityContextType } from '../contexts/DataQualityContext';

/**
 * Hook para acessar o status e funções de qualidade de dados
 * Deve ser usado dentro do DataQualityProvider
 *
 * @returns Contexto de qualidade de dados
 * @throws Error se usado fora do DataQualityProvider
 *
 * @example
 * const { dataQualityStatus, startDataQualityMonitoring } = useDataQuality();
 * if (dataQualityStatus.overallScore < 40) {
 *   console.log('Qualidade de conexão ruim');
 * }
 */
export const useDataQuality = (): DataQualityContextType => {
  const context = useContext(DataQualityContext);

  if (!context) {
    throw new Error('useDataQuality must be used inside DataQualityProvider');
  }

  return context;
};

/**
 * Hook derivado para obter o nível de qualidade atual
 *
 * @returns Nível de qualidade atual
 */
export const useDataQualityLevel = () => {
  const { dataQualityStatus } = useDataQuality();
  
  if (dataQualityStatus.overallScore >= 80) return 'excellent';
  if (dataQualityStatus.overallScore >= 60) return 'good';
  if (dataQualityStatus.overallScore >= 40) return 'fair';
  return 'poor';
};

/**
 * Hook derivado para obter cor baseada na qualidade
 *
 * @returns Objeto com classes de cor
 */
export const useDataQualityColor = () => {
  const level = useDataQualityLevel();
  
  switch (level) {
    case 'excellent':
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-500',
        border: 'border-emerald-500',
        ring: 'ring-emerald-500',
      };
    case 'good':
      return {
        bg: 'bg-blue-500',
        text: 'text-blue-500',
        border: 'border-blue-500',
        ring: 'ring-blue-500',
      };
    case 'fair':
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-500',
        border: 'border-amber-500',
        ring: 'ring-amber-500',
      };
    case 'poor':
      return {
        bg: 'bg-red-500',
        text: 'text-red-500',
        border: 'border-red-500',
        ring: 'ring-red-500',
      };
  }
};

/**
 * Hook derivado para verificar se a qualidade está boa
 *
 * @returns Booleano indicando se a qualidade é boa
 */
export const useIsDataQualityGood = () => {
  const { dataQualityStatus } = useDataQuality();
  return dataQualityStatus.overallScore >= 60;
};

/**
 * Hook derivado para obter tendência da qualidade
 *
 * @returns Tendência atual
 */
export const useDataQualityTrend = () => {
  const { dataQualityStatus } = useDataQuality();
  return dataQualityStatus.trend;
};

/**
 * Hook derivado para formatar informações de qualidade
 *
 * @returns Funções de formatação
 */
export const useDataQualityFormatter = () => {
  const { dataQualityStatus } = useDataQuality();
  
  const formatLatency = (latency: number) => {
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  const formatBandwidth = (bandwidth: number) => {
    if (bandwidth >= 10) return `${bandwidth.toFixed(1)} Mbps`;
    if (bandwidth >= 1) return `${(bandwidth * 1000).toFixed(0)} Kbps`;
    return `${(bandwidth * 1000000).toFixed(0)} bps`;
  };

  const formatStability = (stability: number) => {
    return `${(stability * 100).toFixed(0)}%`;
  };

  const formatPacketLoss = (packetLoss: number) => {
    return `${packetLoss.toFixed(1)}%`;
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Boa';
    if (score >= 40) return 'Regular';
    return 'Ruim';
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `há ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return {
    formatLatency,
    formatBandwidth,
    formatStability,
    formatPacketLoss,
    getQualityLabel,
    formatTime,
    currentLatency: dataQualityStatus.currentMetrics.latency,
    currentBandwidth: dataQualityStatus.currentMetrics.bandwidth,
    currentStability: dataQualityStatus.currentMetrics.stability,
    currentPacketLoss: dataQualityStatus.currentMetrics.packetLoss,
  };
};
