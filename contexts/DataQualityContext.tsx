import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { dataQualityService, DataQualityStatus, DataQualityChangeCallback } from '../services/dataQualityService';

export interface DataQualityContextType {
  dataQualityStatus: DataQualityStatus;
  isDataQualityMonitoring: boolean;
  startDataQualityMonitoring: (intervalMs?: number) => Promise<void>;
  stopDataQualityMonitoring: () => void;
  getDataQualityHistory: () => any[];
}

export const DataQualityContext = createContext<DataQualityContextType | undefined>(undefined);

export const DataQualityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataQualityStatus, setDataQualityStatus] = useState<DataQualityStatus>(dataQualityService.getStatus());
  const [isDataQualityMonitoring, setIsDataQualityMonitoring] = useState(false);

  useEffect(() => {
    // Inicializa com status atual
    setDataQualityStatus(dataQualityService.getStatus());

    // Inscreve para atualizações
    const unsubscribe: (() => void) = dataQualityService.subscribe((newStatus: DataQualityStatus) => {
      setDataQualityStatus(newStatus);
    });

    // Inicia monitoramento automático após 5 segundos
    const initDelay = setTimeout(() => {
      startDataQualityMonitoring(120000); // 2 minutos de intervalo (reduzido de 30s para evitar sobrecarga)
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(initDelay);
    };
  }, []);

  const startDataQualityMonitoring = async (intervalMs: number = 30000) => {
    if (isDataQualityMonitoring) return;
    
    try {
      await dataQualityService.startMonitoring(intervalMs);
      setIsDataQualityMonitoring(true);
    } catch (error) {
      console.error('[DataQualityContext] Erro ao iniciar monitoramento:', error);
    }
  };

  const stopDataQualityMonitoring = () => {
    dataQualityService.stopMonitoring();
    setIsDataQualityMonitoring(false);
  };

  const getDataQualityHistory = () => {
    return dataQualityService.getMetricsHistory();
  };

  const value: DataQualityContextType = {
    dataQualityStatus,
    isDataQualityMonitoring,
    startDataQualityMonitoring,
    stopDataQualityMonitoring,
    getDataQualityHistory,
  };

  return (
    <DataQualityContext.Provider value={value}>
      {children}
    </DataQualityContext.Provider>
  );
};
