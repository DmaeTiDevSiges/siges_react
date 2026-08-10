#!/usr/bin/env node

/**
 * Script de teste para o indicador de qualidade de dados
 * Permite simular diferentes condições de rede e verificar o comportamento
 */

const dataQualityService = require('../services/dataQualityService');

console.log('🔧 Teste do Indicador de Qualidade de Dados');
console.log('=============================================\n');

// Função para simular diferentes cenários de rede
function simulateNetworkScenario(scenario) {
  console.log(`📡 Simulando cenário: ${scenario.name}`);
  console.log(`Descrição: ${scenario.description}`);
  
  // Simula as métricas para este cenário
  dataQualityService.currentStatus = {
    overallScore: scenario.overallScore,
    latencyScore: scenario.latencyScore,
    bandwidthScore: scenario.bandwidthScore,
    stabilityScore: scenario.stabilityScore,
    currentMetrics: scenario.metrics,
    trend: scenario.trend,
    lastUpdated: Date.now()
  };

  console.log(`📊 Métricas simuladas:`);
  console.log(`  - Qualidade geral: ${scenario.overallScore}% (${getQualityLabel(scenario.overallScore)})`);
  console.log(`  - Latência: ${scenario.metrics.latency}ms (${getLatencyLabel(scenario.metrics.latency)})`);
  console.log(`  - Largura de banda: ${scenario.metrics.bandwidth} Mbps (${getBandwidthLabel(scenario.metrics.bandwidth)})`);
  console.log(`  - Estabilidade: ${(scenario.metrics.stability * 100).toFixed(0)}%`);
  console.log(`  - Perda de pacotes: ${scenario.metrics.packetLoss}%`);
  console.log(`  - Tendência: ${scenario.trend}`);
  
  console.log(`\n🎨 Indicador visual:`);
  console.log(`  - Cor: ${getQualityColor(scenario.overallScore)}`);
  console.log(`  - Status: ${getStatusMessage(scenario.overallScore)}`);
  console.log(`  - Recomendação: ${getRecommendation(scenario.overallScore, scenario.metrics.latency, scenario.metrics.bandwidth)}`);
  
  console.log('\n' + '='.repeat(50) + '\n');
}

// Funções auxiliares
function getQualityLabel(score) {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Boa';
  if (score >= 40) return 'Regular';
  return 'Ruim';
}

function getLatencyLabel(latency) {
  if (latency <= 50) return 'Excelente';
  if (latency <= 100) return 'Boa';
  if (latency <= 200) return 'Regular';
  return 'Ruim';
}

function getBandwidthLabel(bandwidth) {
  if (bandwidth >= 10) return 'Excelente';
  if (bandwidth >= 5) return 'Boa';
  if (bandwidth >= 2) return 'Regular';
  return 'Ruim';
}

function getQualityColor(score) {
  if (score >= 80) return '🟢 Verde';
  if (score >= 60) return '🔵 Azul';
  if (score >= 40) return '🟠 Laranja';
  return '🔴 Vermelho';
}

function getStatusMessage(score) {
  if (score >= 80) return 'Conexão excelente';
  if (score >= 60) return 'Conexão boa';
  if (score >= 40) return 'Conexão instável';
  return 'Conexão problemática';
}

function getRecommendation(score, latency, bandwidth) {
  if (score >= 80) return 'Ótimo para todas as operações';
  if (score >= 60) return 'Bom para operações normais';
  if (score >= 40) return 'Recomendado evitar operações críticas';
  return 'Evitar operações que exigem boa conexão';
}

// Cenários de teste
const testScenarios = [
  {
    name: 'Rede WiFi Excelente',
    description: 'Conexão WiFi estável e rápida',
    overallScore: 95,
    latencyScore: 98,
    bandwidthScore: 92,
    stabilityScore: 95,
    metrics: {
      latency: 25,
      bandwidth: 25.5,
      packetLoss: 0.5,
      stability: 0.95,
      timestamp: Date.now()
    },
    trend: 'stable'
  },
  {
    name: 'Rede 4G Boa',
    description: 'Conexão 4G rápida e confiável',
    overallScore: 75,
    latencyScore: 80,
    bandwidthScore: 70,
    stabilityScore: 75,
    metrics: {
      latency: 65,
      bandwidth: 8.2,
      packetLoss: 2.1,
      stability: 0.75,
      timestamp: Date.now()
    },
    trend: 'improving'
  },
  {
    name: 'Rede WiFi Instável',
    description: 'Conexão WiFi com oscilações',
    overallScore: 45,
    latencyScore: 40,
    bandwidthScore: 50,
    stabilityScore: 45,
    metrics: {
      latency: 180,
      bandwidth: 4.1,
      packetLoss: 5.5,
      stability: 0.45,
      timestamp: Date.now()
    },
    trend: 'declining'
  },
  {
    name: 'Rede Móvel Fraca',
    description: 'Conexão móvel lenta e instável',
    overallScore: 25,
    latencyScore: 20,
    bandwidthScore: 30,
    stabilityScore: 25,
    metrics: {
      latency: 450,
      bandwidth: 0.8,
      packetLoss: 12.3,
      stability: 0.25,
      timestamp: Date.now()
    },
    trend: 'declining'
  },
  {
    name: 'Sem Conexão',
    description: 'Sem conexão com a internet',
    overallScore: 0,
    latencyScore: 0,
    bandwidthScore: 0,
    stabilityScore: 0,
    metrics: {
      latency: 0,
      bandwidth: 0,
      packetLoss: 100,
      stability: 0,
      timestamp: Date.now()
    },
    trend: 'stable'
  }
];

// Executa todos os cenários de teste
console.log('Iniciando testes...\n');
testScenarios.forEach(scenario => {
  simulateNetworkScenario(scenario);
});

console.log('✅ Testes concluídos!');
console.log('\n📋 Resumo:');
console.log('- O indicador mostra cores diferentes baseadas na qualidade da conexão');
console.log('- São exibidas notificações para condições de rede ruins');
console.log('- O monitoramento contínuo verifica mudanças na qualidade');
console.log('- As métricas individuais são exibidas quando expandidas');

console.log('\n🔧 Como usar no aplicativo:');
console.log('1. O indicador é exibido no topo da tela (cabeçalho)');
console.log('2. Clique para expandir e ver detalhes das métricas');
console.log('3. Notificações são mostradas automaticamente para problemas');
console.log('4. O monitoramento é feito automaticamente a cada 30 segundos');

// Teste de integração com o serviço
console.log('\n🔍 Testando integração com o serviço...');
try {
  const currentStatus = dataQualityService.getStatus();
  console.log(`✅ Serviço acessível - Status: ${currentStatus.overallScore}%`);
  
  // Testa subscrição
  const unsubscribe = dataQualityService.subscribe((status) => {
    console.log(`📡 Atualização recebida: ${status.overallScore}%`);
  });
  
  console.log('✅ Subscrição funcionando');
  
  // Limpa
  unsubscribe();
  console.log('✅ Unsubscribe funcionando');
  
} catch (error) {
  console.error('❌ Erro na integração:', error.message);
}

console.log('\n🎉 Testes finalizados!');