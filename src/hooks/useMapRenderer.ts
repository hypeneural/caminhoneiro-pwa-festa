import { useState, useEffect } from 'react';

export interface MapHealth {
  leafletAvailable: boolean;
  webglSupported: boolean;
  canvasSupported: boolean;
  performanceScore: number;
}

export interface MapMetrics {
  renderTime: number;
  memoryUsage: number;
  errorCount: number;
  successRate: number;
}

export const useMapRenderer = () => {
  const [health, setHealth] = useState<MapHealth>({
    leafletAvailable: false,
    webglSupported: false,
    canvasSupported: false,
    performanceScore: 0
  });

  const [metrics, setMetrics] = useState<MapMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    errorCount: 0,
    successRate: 100
  });

  // Health check do sistema de mapas
  const checkMapHealth = (): MapHealth => {
    const result: MapHealth = {
      leafletAvailable: false,
      webglSupported: false,
      canvasSupported: false,
      performanceScore: 0
    };

    try {
      // Verifica Leaflet
      result.leafletAvailable = typeof window !== 'undefined' && 
                               'L' in window;

      // Verifica WebGL
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      result.webglSupported = !!gl;

      // Verifica Canvas 2D
      result.canvasSupported = !!canvas.getContext('2d');

      // Calcula score de performance
      let score = 0;
      if (result.leafletAvailable) score += 40;
      if (result.webglSupported) score += 30;
      if (result.canvasSupported) score += 20;
      if (navigator.hardwareConcurrency >= 4) score += 10;
      
      result.performanceScore = score;

      console.log('🏥 Map Health Check:', result);
    } catch (error) {
      console.error('❌ Erro no health check:', error);
    }

    return result;
  };

  // Monitora performance do mapa
  const measurePerformance = (operation: () => Promise<void>) => {
    return async () => {
      const startTime = performance.now();
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

      try {
        await operation();
        
        const endTime = performance.now();
        const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        setMetrics(prev => ({
          ...prev,
          renderTime: endTime - startTime,
          memoryUsage: endMemory - startMemory,
          successRate: Math.min(100, prev.successRate + 1)
        }));

        console.log('📊 Map Performance:', {
          renderTime: endTime - startTime,
          memoryDelta: endMemory - startMemory
        });
      } catch (error) {
        setMetrics(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          successRate: Math.max(0, prev.successRate - 5)
        }));
        
        console.error('📊 Map Error:', error);
        throw error;
      }
    };
  };

  // Log estruturado para debugging
  const logMapEvent = (event: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      data,
      health,
      metrics,
      userAgent: navigator.userAgent
    };

    console.log(`🗺️ [${timestamp}] ${event}:`, logEntry);
    
    // Em produção, poderia enviar para serviço de telemetria
    if (process.env.NODE_ENV === 'production') {
      // sendToTelemetry(logEntry);
    }
  };

  // Recomenda melhor estratégia de renderização
  const getRecommendedStrategy = () => {
    if (health.performanceScore >= 70) {
      return 'leaflet';
    } else if (health.performanceScore >= 40) {
      return 'static';
    } else if (health.canvasSupported) {
      return 'coordinates';
    } else {
      return 'placeholder';
    }
  };

  // Detecta problemas comuns
  const detectIssues = () => {
    const issues: string[] = [];

    if (!health.leafletAvailable) {
      issues.push('Leaflet não carregado');
    }

    if (metrics.errorCount > 3) {
      issues.push('Muitos erros de renderização');
    }

    if (metrics.renderTime > 5000) {
      issues.push('Renderização muito lenta');
    }

    if (metrics.successRate < 50) {
      issues.push('Taxa de sucesso baixa');
    }

    return issues;
  };

  // Otimização automática baseada em performance
  const optimizeForDevice = () => {
    const issues = detectIssues();
    
    if (issues.length > 0) {
      logMapEvent('optimization_triggered', { issues });
      
      // Sugere fallback para dispositivos com problemas
      return {
        useSimpleRenderer: true,
        disableAnimations: true,
        reducedFeatures: true
      };
    }

    return {
      useSimpleRenderer: false,
      disableAnimations: false,
      reducedFeatures: false
    };
  };

  useEffect(() => {
    const healthCheck = checkMapHealth();
    setHealth(healthCheck);
    
    logMapEvent('map_renderer_initialized', healthCheck);
  }, []);

  return {
    health,
    metrics,
    checkMapHealth,
    measurePerformance,
    logMapEvent,
    getRecommendedStrategy,
    detectIssues,
    optimizeForDevice
  };
};