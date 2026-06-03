import React, { useState, useEffect } from 'react';
import { dataQualityService, DataQualityStatus, QualityLevel } from '../../services/dataQualityService';

interface DataQualityIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  className?: string;
}

export const DataQualityIndicator: React.FC<DataQualityIndicatorProps> = ({
  size = 'medium',
  showDetails = false,
  className = ''
}) => {
  const [status, setStatus] = useState<DataQualityStatus>(dataQualityService.getStatus());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = dataQualityService.subscribe(setStatus);
    return () => unsubscribe();
  }, []);

  const qualityLevel = getQualityLevel(status.overallScore);
  const qualityColor = getQualityColor(qualityLevel);
  const qualityLabel = getQualityLabel(qualityLevel);

  const sizes = {
    small: {
      dot: 'w-2 h-2',
      text: 'text-[10px]',
      icon: 'w-3 h-3',
      score: 'text-[9px]',
      barWidth: 'w-[3px]',
      bar1: 'h-[4px]',
      bar2: 'h-[7px]',
      bar3: 'h-[10px]',
      barGap: 'gap-[2px]',
    },
    medium: {
      dot: 'w-2.5 h-2.5',
      text: 'text-xs',
      icon: 'w-4 h-4',
      score: 'text-[10px]',
      barWidth: 'w-[4px]',
      bar1: 'h-[5px]',
      bar2: 'h-[9px]',
      bar3: 'h-[13px]',
      barGap: 'gap-[2px]',
    },
    large: {
      dot: 'w-3 h-3',
      text: 'text-sm',
      icon: 'w-5 h-5',
      score: 'text-xs',
      barWidth: 'w-[5px]',
      bar1: 'h-[6px]',
      bar2: 'h-[11px]',
      bar3: 'h-[16px]',
      barGap: 'gap-[3px]',
    },
  };

  const currentSize = sizes[size];

  // Quantas barras devem ficar acesas com base no score (0-100)
  const activeBars = status.overallScore >= 67 ? 3 : status.overallScore >= 34 ? 2 : status.overallScore >= 1 ? 1 : 0;
  const inactiveBarClass = 'bg-slate-300 dark:bg-slate-700';
  const getBarClass = (index: number) =>
    index < activeBars ? `${qualityColor.bg} ${qualityColor.pulse}` : inactiveBarClass;

  // Renderização compacta (indicador 0-100 no topo + três barras verticais crescentes)
  if (!showDetails) {
    return (
      <div
        className={`inline-flex flex-col items-center justify-end ${className}`}
        title={`Qualidade: ${qualityLabel} (${status.overallScore}%)`}
      >
        <span className={`${currentSize.score} font-black leading-none ${qualityColor.text} mb-0.5`}>
          {status.overallScore}
        </span>
        <div className={`flex items-end ${currentSize.barGap}`}>
          <span className={`${currentSize.barWidth} ${currentSize.bar1} rounded-sm ${getBarClass(0)} transition-colors`} />
          <span className={`${currentSize.barWidth} ${currentSize.bar2} rounded-sm ${getBarClass(1)} transition-colors`} />
          <span className={`${currentSize.barWidth} ${currentSize.bar3} rounded-sm ${getBarClass(2)} transition-colors`} />
        </div>
      </div>
    );
  }

  // Renderização expandida com detalhes
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        {/* Indicador visual circular */}
        <div className="relative flex items-center justify-center w-6 h-6">
          <svg className="transform -rotate-90" width="24" height="24">
            <circle
              className="text-slate-200 dark:text-slate-700"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="10"
              cx="12"
              cy="12"
            />
            <circle
              className={`${qualityColor.stroke} transition-all duration-700 ease-out`}
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 10}
              strokeDashoffset={2 * Math.PI * 10 - (status.overallScore / 100) * 2 * Math.PI * 10}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="10"
              cx="12"
              cy="12"
            />
          </svg>
          <div className={`absolute ${currentSize.dot} rounded-full ${qualityColor.bg}`} />
        </div>

        <div className="flex flex-col items-start">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Qualidade
          </span>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-black ${qualityColor.text}`}>
              {qualityLabel}
            </span>
            <TrendIcon trend={status.trend} className={`w-3 h-3 ${getTrendColor(status.trend)}`} />
          </div>
        </div>
      </button>

      {/* Painel detalhado expandido */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          {/* Header */}
          <div className={`px-4 py-3 ${qualityColor.bg} bg-opacity-10`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  Qualidade da Conexão
                </p>
                <p className={`text-lg font-black ${qualityColor.text}`}>
                  {status.overallScore}% - {qualityLabel}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full ${qualityColor.bg} flex items-center justify-center`}>
                <SignalIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Métricas detalhadas */}
          <div className="px-4 py-3 space-y-3">
            <MetricBar
              label="Latência"
              value={status.latencyScore}
              realValue={`${status.currentMetrics.latency.toFixed(0)}ms`}
              color={getMetricColor(status.latencyScore)}
            />
            <MetricBar
              label="Largura de Banda"
              value={status.bandwidthScore}
              realValue={`${status.currentMetrics.bandwidth.toFixed(1)} Mbps`}
              color={getMetricColor(status.bandwidthScore)}
            />
            <MetricBar
              label="Estabilidade"
              value={status.stabilityScore}
              realValue={`${(status.currentMetrics.stability * 100).toFixed(0)}%`}
              color={getMetricColor(status.stabilityScore)}
            />
            <MetricBar
              label="Perda de Pacotes"
              value={100 - status.currentMetrics.packetLoss}
              realValue={`${status.currentMetrics.packetLoss.toFixed(1)}%`}
              color={getMetricColor(100 - status.currentMetrics.packetLoss)}
              inverted
            />
          </div>

          {/* Footer com timestamp */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
              Última medição: {formatTime(status.lastUpdated)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para barra de métrica
const MetricBar: React.FC<{
  label: string;
  value: number;
  realValue: string;
  color: { bg: string; text: string };
  inverted?: boolean;
}> = ({ label, value, realValue, color, inverted }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {label}
          {inverted && <span className="text-[9px] text-slate-400 ml-1">(invertida)</span>}
        </span>
        <span className={`text-xs font-bold ${color.text}`}>{realValue}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color.bg} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

// Componente auxiliar para ícone de tendência
const TrendIcon: React.FC<{ trend: string; className?: string }> = ({ trend, className }) => {
  if (trend === 'improving') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (trend === 'declining') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M5 9l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Componente auxiliar para ícone de sinal
const SignalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 22h2v-4H2v4zm5 0h2V14H7v8zm5 0h2V10h-2v12zm5 0h2V6h-2v16zm5 0h2V2h-2v20z" />
  </svg>
);

// Funções auxiliares
function getQualityLevel(score: number): QualityLevel {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function getQualityLabel(level: QualityLevel): string {
  switch (level) {
    case 'excellent': return 'Excelente';
    case 'good': return 'Boa';
    case 'fair': return 'Regular';
    case 'poor': return 'Ruim';
  }
}

function getQualityColor(level: QualityLevel) {
  switch (level) {
    case 'excellent':
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-500',
        stroke: 'text-emerald-500',
        pulse: 'animate-pulse'
      };
    case 'good':
      return {
        bg: 'bg-blue-500',
        text: 'text-blue-500',
        stroke: 'text-blue-500',
        pulse: ''
      };
    case 'fair':
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-500',
        stroke: 'text-amber-500',
        pulse: 'animate-pulse'
      };
    case 'poor':
      return {
        bg: 'bg-red-500',
        text: 'text-red-500',
        stroke: 'text-red-500',
        pulse: 'animate-pulse'
      };
  }
}

function getMetricColor(score: number) {
  if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-500' };
  if (score >= 60) return { bg: 'bg-blue-500', text: 'text-blue-500' };
  if (score >= 40) return { bg: 'bg-amber-500', text: 'text-amber-500' };
  return { bg: 'bg-red-500', text: 'text-red-500' };
}

function getTrendColor(trend: string): string {
  if (trend === 'improving') return 'text-emerald-500';
  if (trend === 'declining') return 'text-red-500';
  return 'text-slate-400';
}

function formatTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return new Date(timestamp).toLocaleString('pt-BR');
}
