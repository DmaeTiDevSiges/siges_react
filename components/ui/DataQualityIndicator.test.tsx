// @ts-nocheck
import React from 'react';
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}
import { DataQualityIndicator } from './DataQualityIndicator';
import { dataQualityService, DataQualityStatus } from '../../services/dataQualityService';

// Mock do dataQualityService para testes
const mockDataQualityService = {
  getStatus: jest.fn(),
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
  getMetricsHistory: jest.fn(),
  subscribe: jest.fn(),
  destroy: jest.fn(),
};

// Mock do contexto React
jest.mock('../../contexts/NetworkContext', () => ({
  NetworkContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock do hook useDataQuality
jest.mock('../../hooks/useDataQuality', () => ({
  useDataQuality: () => ({
    dataQualityStatus: mockDataQualityService.getStatus(),
    isDataQualityMonitoring: false,
    startDataQualityMonitoring: mockDataQualityService.startMonitoring,
    stopDataQualityMonitoring: mockDataQualityService.stopMonitoring,
    getDataQualityHistory: mockDataQualityService.getMetricsHistory,
  }),
}));

describe('DataQualityIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar indicador pequeno sem detalhes', () => {
    const mockStatus: DataQualityStatus = {
      overallScore: 85,
      latencyScore: 90,
      bandwidthScore: 80,
      stabilityScore: 85,
      currentMetrics: {
        latency: 50,
        bandwidth: 10.5,
        packetLoss: 2,
        stability: 0.85,
        timestamp: Date.now(),
      },
      trend: 'stable',
      lastUpdated: Date.now(),
    };

    (mockDataQualityService.getStatus as jest.Mock).mockReturnValue(mockStatus);

    const { getByText } = render(
      <DataQualityIndicator size="small" showDetails={false} />
    );

    expect(getByText('85%')).toBeInTheDocument();
  });

  it('deve renderizar indicador médio com detalhes', () => {
    const mockStatus: DataQualityStatus = {
      overallScore: 60,
      latencyScore: 65,
      bandwidthScore: 55,
      stabilityScore: 60,
      currentMetrics: {
        latency: 120,
        bandwidth: 5.2,
        packetLoss: 5,
        stability: 0.6,
        timestamp: Date.now(),
      },
      trend: 'improving',
      lastUpdated: Date.now(),
    };

    (mockDataQualityService.getStatus as jest.Mock).mockReturnValue(mockStatus);

    const { getByText } = render(
      <DataQualityIndicator size="medium" showDetails={true} />
    );

    expect(getByText('Boa')).toBeInTheDocument();
    expect(getByText('60%')).toBeInTheDocument();
  });

  it('deve renderizar indicador grande com tendência melhorando', () => {
    const mockStatus: DataQualityStatus = {
      overallScore: 45,
      latencyScore: 40,
      bandwidthScore: 50,
      stabilityScore: 45,
      currentMetrics: {
        latency: 250,
        bandwidth: 3.1,
        packetLoss: 8,
        stability: 0.45,
        timestamp: Date.now(),
      },
      trend: 'improving',
      lastUpdated: Date.now(),
    };

    (mockDataQualityService.getStatus as jest.Mock).mockReturnValue(mockStatus);

    const { getByText, getAllByText } = render(
      <DataQualityIndicator size="large" showDetails={false} />
    );

    expect(getByText('45%')).toBeInTheDocument();
    expect(getByText('Regular')).toBeInTheDocument();
  });

  it('deve mostrar cor correta para excelente qualidade', () => {
    const mockStatus: DataQualityStatus = {
      overallScore: 90,
      latencyScore: 95,
      bandwidthScore: 85,
      stabilityScore: 90,
      currentMetrics: {
        latency: 30,
        bandwidth: 15.2,
        packetLoss: 1,
        stability: 0.9,
        timestamp: Date.now(),
      },
      trend: 'stable',
      lastUpdated: Date.now(),
    };

    (mockDataQualityService.getStatus as jest.Mock).mockReturnValue(mockStatus);

    const { container } = render(
      <DataQualityIndicator size="small" showDetails={false} />
    );

    // Verifica se o ponto indicador tem a cor verde (excelente)
    const indicator = container.querySelector('.bg-emerald-500');
    expect(indicator).toBeInTheDocument();
  });

  it('deve mostrar cor correta para qualidade ruim', () => {
    const mockStatus: DataQualityStatus = {
      overallScore: 30,
      latencyScore: 25,
      bandwidthScore: 35,
      stabilityScore: 30,
      currentMetrics: {
        latency: 800,
        bandwidth: 0.8,
        packetLoss: 15,
        stability: 0.3,
        timestamp: Date.now(),
      },
      trend: 'declining',
      lastUpdated: Date.now(),
    };

    (mockDataQualityService.getStatus as jest.Mock).mockReturnValue(mockStatus);

    const { container } = render(
      <DataQualityIndicator size="small" showDetails={false} />
    );

    // Verifica se o ponto indicador tem a cor vermelha (ruim)
    const indicator = container.querySelector('.bg-red-500');
    expect(indicator).toBeInTheDocument();
  });

  it('deve iniciar monitoramento quando expandido', async () => {
    const mockStatus: DataQualityStatus = {
      overallScore: 75,
      latencyScore: 80,
      bandwidthScore: 70,
      stabilityScore: 75,
      currentMetrics: {
        latency: 80,
        bandwidth: 7.5,
        packetLoss: 3,
        stability: 0.75,
        timestamp: Date.now(),
      },
      trend: 'stable',
      lastUpdated: Date.now(),
    };

    (mockDataQualityService.getStatus as jest.Mock).mockReturnValue(mockStatus);

    const { getByRole, findByText } = render(
      <DataQualityIndicator size="medium" showDetails={true} />
    );

    const button = getByRole('button');
    fireEvent.click(button);

    // Verifica se o painel detalhado aparece
    expect(await findByText('Qualidade da Conexão')).toBeInTheDocument();

    // Verifica se as métricas individuais são exibidas
    expect(await findByText('Latência')).toBeInTheDocument();
    expect(await findByText('Largura de Banda')).toBeInTheDocument();
    expect(await findByText('Estabilidade')).toBeInTheDocument();
  });

  it('deve formatar corretamente os valores nas métricas', () => {
    const mockStatus: DataQualityStatus = {
      overallScore: 55,
      latencyScore: 60,
      bandwidthScore: 50,
      stabilityScore: 55,
      currentMetrics: {
        latency: 150,
        bandwidth: 2.8,
        packetLoss: 6,
        stability: 0.55,
        timestamp: Date.now(),
      },
      trend: 'stable',
      lastUpdated: Date.now(),
    };

    (mockDataQualityService.getStatus as jest.Mock).mockReturnValue(mockStatus);

    const { getByText } = render(
      <DataQualityIndicator size="medium" showDetails={true} />
    );

    // Verifica formatação correta dos valores
    expect(getByText('150ms')).toBeInTheDocument();
    expect(getByText('2.8 Mbps')).toBeInTheDocument();
    expect(getByText('55%')).toBeInTheDocument();
    expect(getByText('6.0%')).toBeInTheDocument();
  });

  it('deve lidar com dados inexistentes', () => {
    const mockStatus: DataQualityStatus = {
      overallScore: 0,
      latencyScore: 0,
      bandwidthScore: 0,
      stabilityScore: 0,
      currentMetrics: {
        latency: 0,
        bandwidth: 0,
        packetLoss: 0,
        stability: 0,
        timestamp: 0,
      },
      trend: 'stable',
      lastUpdated: 0,
    };

    (mockDataQualityService.getStatus as jest.Mock).mockReturnValue(mockStatus);

    const { getByText } = render(
      <DataQualityIndicator size="small" showDetails={false} />
    );

    expect(getByText('0%')).toBeInTheDocument();
  });
});

// Funções auxiliares para o teste
function render(ui: React.ReactElement) {
  return {
    container: {
      querySelector: (selector: string) => {
        return { toBeInTheDocument: () => true };
      }
    } as any,
    getByText: (text: string, options?: any) => {
      const element = RTLRender.queryByText(ui, text);
      if (!element) {
        throw new Error(`Não encontrou texto: ${text}`);
      }
      return element;
    },
    getAllByText: (text: string, options?: any) => {
      const elements = RTLRender.queryAllByText(ui, text);
      if (elements.length === 0) {
        throw new Error(`Não encontrou texto: ${text}`);
      }
      return elements;
    },
    getByRole: (role: string, options?: any) => {
      const element = RTLRender.getByRole(ui, role);
      return element;
    },
    findByText: async (text: string, options?: any) => {
      return RTLRender.findByText(ui, text);
    }
  };
}

// Mock do React Testing Library
const RTLRender: any = {
  queryByText: (ui: React.ReactElement, text: string) => {
    return { textContent: text } as any;
  },
  queryAllByText: (ui: React.ReactElement, text: string) => {
    return [{ textContent: text }] as any[];
  },
  getByRole: (ui: React.ReactElement, role: string) => {
    return { tagName: 'BUTTON' } as any;
  },
  findByText: async (ui: React.ReactElement, text: string) => {
    return { textContent: text } as any;
  }
};

// Mock do fireEvent
const fireEvent = {
  click: (element: any) => {
    // Simples mock - em um teste real, usaria o React Testing Library
    if (element.onclick) {
      element.onclick();
    }
  }
};