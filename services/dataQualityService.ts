// Serviço de medição de qualidade de conexão de dados
import { Network } from '@capacitor/network';

export interface DataQualityMetrics {
  latency: number;      // ms
  bandwidth: number;     // Mbps
  packetLoss: number;    // percentage
  stability: number;     // 0-1 score
  timestamp: number;    // timestamp da medição
}

export interface DataQualityStatus {
  overallScore: number;  // 0-100 score geral
  latencyScore: number;  // 0-100 score de latência
  bandwidthScore: number; // 0-100 score de largura de banda
  stabilityScore: number; // 0-100 score de estabilidade
  currentMetrics: DataQualityMetrics;
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: number;
}

export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor';

export interface DataQualityChangeCallback {
  (status: DataQualityStatus): void;
}

class DataQualityServiceImpl {
  private listeners: Set<DataQualityChangeCallback> = new Set();
  private currentStatus: DataQualityStatus;
  private metricsHistory: DataQualityMetrics[] = [];
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private isMonitoring = false;
  private testEndpoint = 'https://api.siges.app/health'; // Endpoint para teste de latência

  constructor() {
    this.currentStatus = this.getInitialStatus();
  }

  private getInitialStatus(): DataQualityStatus {
    return {
      overallScore: 0,
      latencyScore: 0,
      bandwidthScore: 0,
      stabilityScore: 0,
      currentMetrics: {
        latency: 0,
        bandwidth: 0,
        packetLoss: 0,
        stability: 0,
        timestamp: Date.now()
      },
      trend: 'stable',
      lastUpdated: Date.now()
    };
  }

  /**
   * Inicia o monitoramento contínuo da qualidade dos dados
   */
  async startMonitoring(intervalMs: number = 30000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Executa primeira medição imediatamente
    await this.performQualityTest();
    
    // Inicia monitoramento contínuo
    this.monitoringInterval = setInterval(async () => {
      await this.performQualityTest();
    }, intervalMs);

    console.log('[DataQualityService] Monitoramento iniciado com intervalo de', intervalMs, 'ms');
  }

  /**
   * Para o monitoramento
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('[DataQualityService] Monitoramento parado');
  }

  /**
   * Realiza teste completo de qualidade dos dados
   */
  async performQualityTest(): Promise<DataQualityStatus> {
    try {
      const metrics = await this.collectMetrics();
      this.metricsHistory.push(metrics);
      
      // Man histórico nos últimos 100 medições
      if (this.metricsHistory.length > 100) {
        this.metricsHistory = this.metricsHistory.slice(-100);
      }

      const status = this.calculateQualityStatus(metrics);
      this.currentStatus = status;
      
      this.notifyListeners();
      return status;
    } catch (error) {
      console.error('[DataQualityService] Erro na medição de qualidade:', error);
      // Retorna status atual em caso de erro
      return this.currentStatus;
    }
  }

  /**
   * Coleta métricas de qualidade
   */
  private async collectMetrics(): Promise<DataQualityMetrics> {
    const startTime = Date.now();
    
    // Teste de latência
    const latency = await this.measureLatency();
    
    // Teste de largura de banda
    const bandwidth = await this.measureBandwidth();
    
    // Estabilidade baseada no histórico
    const stability = this.calculateStability();
    
    // Perda de pacotes (estimativa baseada em inconsistências)
    const packetLoss = this.estimatePacketLoss();

    return {
      latency,
      bandwidth,
      packetLoss,
      stability,
      timestamp: Date.now()
    };
  }

  /**
   * Mede latência através de requisição HTTP
   */
  private async measureLatency(): Promise<number> {
    try {
      const start = Date.now();
      
      // Faz requisição ao endpoint de health check
      const response = await fetch(this.testEndpoint, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      });
      
      const end = Date.now();
      const latency = end - start;
      
      // Se a resposta for lenta, retorna o tempo real
      return latency > 0 ? latency : 0;
    } catch (error) {
      // Se falhar, tenta fallback com ping local
      return this.measureLatencyFallback();
    }
  }

  /**
   * Método fallback para medição de latência
   */
  private async measureLatencyFallback(): Promise<number> {
    try {
      const start = Date.now();
      await fetch('https://www.google.com', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return Date.now() - start;
    } catch {
      // Se tudo falhar, retorna um estimativa baseada no tipo de conexão
      const connectionType = this.getConnectionType();
      switch (connectionType) {
        case 'wifi': return 50;
        case '5g': return 30;
        case '4g': return 80;
        case 'cellular': return 120;
        default: return 100;
      }
    }
  }

  /**
   * Mede largura de banda de forma aproximada
   */
  private async measureBandwidth(): Promise<number> {
    try {
      // Cria um blob de teste de 1MB
      const testSize = 1024 * 1024; // 1MB
      const testData = new Uint8Array(testSize);
      
      const startTime = Date.now();
      
      // Envia dados de teste
      const response = await fetch(this.testEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: testData,
        signal: AbortSignal.timeout(10000)
      });
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // segundos
      
      // Calcula largura de banda: tamanho / tempo (bits/segundo)
      const bandwidth = (testSize * 8) / duration / 1024 / 1024; // Mbps
      
      return Math.max(0, bandwidth);
    } catch (error) {
      // Retorna estimativa baseada no tipo de conexão
      const connectionType = this.getConnectionType();
      switch (connectionType) {
        case 'wifi': return 25;
        case '5g': return 50;
        case '4g': return 10;
        case 'cellular': return 5;
        default: return 8;
      }
    }
  }

  /**
   * Calcula estabilidade baseada no histórico
   */
  private calculateStability(): number {
    if (this.metricsHistory.length < 5) {
      return 0.8; // Estabilidade inicial
    }

    const recentMetrics = this.metricsHistory.slice(-10);
    let varianceSum = 0;
    
    // Calcula variação da latência
    const latencies = recentMetrics.map(m => m.latency);
    const latencyMean = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const latencyVariance = latencies.reduce((sum, lat) => sum + Math.pow(lat - latencyMean, 2), 0) / latencies.length;
    varianceSum += latencyVariance;

    // Calcula variação da largura de banda
    const bandwidths = recentMetrics.map(m => m.bandwidth);
    const bandwidthMean = bandwidths.reduce((a, b) => a + b, 0) / bandwidths.length;
    const bandwidthVariance = bandwidths.reduce((sum, bw) => sum + Math.pow(bw - bandwidthMean, 2), 0) / bandwidths.length;
    varianceSum += bandwidthVariance;

    // Normaliza para score 0-1 (menor variação = maior estabilidade)
    const maxVariance = 10000; // Valor máximo esperado de variação
    const stabilityScore = Math.max(0, 1 - (varianceSum / maxVariance));
    
    return stabilityScore;
  }

  /**
   * Estima perda de pacotes baseada em inconsistências
   */
  private estimatePacketLoss(): number {
    if (this.metricsHistory.length < 5) {
      return 2; // Perda inicial baixa
    }

    // Conta medições com falhas ou tempos de resposta muito altos
    const failedRequests = this.metricsHistory.filter(m => m.latency > 2000).length;
    const packetLoss = (failedRequests / this.metricsHistory.length) * 100;
    
    return Math.min(100, Math.max(0, packetLoss));
  }

  /**
   * Calcula status de qualidade geral
   */
  private calculateQualityStatus(metrics: DataQualityMetrics): DataQualityStatus {
    // Calcula scores individuais (0-100)
    const latencyScore = this.calculateLatencyScore(metrics.latency);
    const bandwidthScore = this.calculateBandwidthScore(metrics.bandwidth);
    const stabilityScore = metrics.stability * 100;
    
    // Score geral ponderado
    const overallScore = (latencyScore * 0.4) + (bandwidthScore * 0.3) + (stabilityScore * 0.3);
    
    // Determina tendência
    const trend = this.calculateTrend();
    
    return {
      overallScore: Math.round(overallScore),
      latencyScore: Math.round(latencyScore),
      bandwidthScore: Math.round(bandwidthScore),
      stabilityScore: Math.round(stabilityScore),
      currentMetrics: metrics,
      trend,
      lastUpdated: Date.now()
    };
  }

  /**
   * Calcula score de latência (0-100)
   */
  private calculateLatencyScore(latency: number): number {
    if (latency <= 50) return 100;
    if (latency <= 100) return 80;
    if (latency <= 200) return 60;
    if (latency <= 500) return 40;
    return Math.max(0, 100 - (latency - 500) / 10);
  }

  /**
   * Calcula score de largura de banda (0-100)
   */
  private calculateBandwidthScore(bandwidth: number): number {
    if (bandwidth >= 10) return 100;
    if (bandwidth >= 5) return 80;
    if (bandwidth >= 2) return 60;
    if (bandwidth >= 1) return 40;
    return Math.max(0, 100 - (1 - bandwidth) * 100);
  }

  /**
   * Determina tendência da qualidade
   */
  private calculateTrend(): 'improving' | 'declining' | 'stable' {
    if (this.metricsHistory.length < 5) {
      return 'stable';
    }

    const recentScores = this.metricsHistory.slice(-5);
    const olderScores = this.metricsHistory.slice(-10, -5);
    
    if (recentScores.length === 0 || olderScores.length === 0) {
      return 'stable';
    }

    const recentAvg = recentScores.reduce((sum, m) => sum + m.latency, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((sum, m) => sum + m.latency, 0) / olderScores.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 50) return 'declining';
    if (difference < -50) return 'improving';
    return 'stable';
  }

  /**
   * Obtém tipo de conexão atual
   */
  private getConnectionType(): string {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Obtém status atual
   */
  getStatus(): DataQualityStatus {
    return { ...this.currentStatus };
  }

  /**
   * Obtém histórico de métricas
   */
  getMetricsHistory(): DataQualityMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Obtém nível de qualidade atual
   */
  getQualityLevel(): QualityLevel {
    const score = this.currentStatus.overallScore;
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Obtém cor correspondente ao nível de qualidade
   */
  getQualityColor(): string {
    const level = this.getQualityLevel();
    switch (level) {
      case 'excellent': return '#10b981'; // green-500
      case 'good': return '#3b82f6'; // blue-500
      case 'fair': return '#f59e0b'; // amber-500
      case 'poor': return '#ef4444'; // red-500
    }
  }

  /**
   * Inscreve listener para mudanças de qualidade
   */
  subscribe(callback: DataQualityChangeCallback): () => void {
    this.listeners.add(callback);
    
    // Retorna função de unsubscribe
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notifica todos os listeners
   */
  private notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.getStatus());
      } catch (error) {
        console.error('Erro no listener de qualidade de dados:', error);
      }
    });
  }

  /**
   * Limpa todos os listeners
   */
  destroy() {
    this.stopMonitoring();
    this.listeners.clear();
    this.metricsHistory = [];
  }
}

// Exporta instância singleton
export const dataQualityService = new DataQualityServiceImpl();