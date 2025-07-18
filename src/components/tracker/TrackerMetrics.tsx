import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Activity, 
  Database, 
  Wifi, 
  RefreshCw,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTraccarData } from '@/hooks/useTraccarData';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackerMetricsProps {
  className?: string;
  showOnlyInDev?: boolean;
}

export const TrackerMetrics: React.FC<TrackerMetricsProps> = ({ 
  className = "",
  showOnlyInDev = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const { getMetrics, clearCache, pollingInterval, isOnline } = useTraccarData();

  // Não mostrar em produção se showOnlyInDev for true
  if (showOnlyInDev && process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Atualizar métricas a cada 2 segundos
  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = getMetrics();
      setMetrics(currentMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, [getMetrics]);

  if (!metrics) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    if (!timestamp) return 'Nunca';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCacheHitRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Botão toggle */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        size="sm"
        variant="outline"
        className="mb-2 bg-background/80 backdrop-blur-sm"
      >
        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <span className="ml-2">Métricas</span>
      </Button>

      {/* Painel de métricas */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="w-80 p-4 bg-background/95 backdrop-blur-sm border-2">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-trucker-blue" />
                    <h3 className="font-bold text-foreground">Tracker Debug</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-muted-foreground">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Métricas de Rede */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-trucker-blue" />
                    <span className="text-sm font-medium">Rede</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-muted-foreground">Requisições</div>
                      <div className="font-bold">{metrics.requestCount}</div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-muted-foreground">Erros</div>
                      <div className="font-bold text-red-600">{metrics.errorCount}</div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-muted-foreground">Taxa Sucesso</div>
                      <div className={`font-bold ${getSuccessRateColor(metrics.successRate)}`}>
                        {metrics.successRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-muted-foreground">Latência Média</div>
                      <div className="font-bold">{metrics.averageLatency.toFixed(0)}ms</div>
                    </div>
                  </div>
                </div>

                {/* Métricas de Cache */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-trucker-blue" />
                    <span className="text-sm font-medium">Cache</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-muted-foreground">Hit Rate</div>
                      <div className={`font-bold ${getCacheHitRateColor(metrics.cacheHitRate)}`}>
                        {metrics.cacheHitRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-muted-foreground">Itens</div>
                      <div className="font-bold">{metrics.cacheSize}</div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded col-span-2">
                      <div className="text-muted-foreground">Armazenamento</div>
                      <div className="font-bold">{formatBytes(metrics.storageUsed)}</div>
                    </div>
                  </div>
                </div>

                {/* Métricas de Polling */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-trucker-blue" />
                    <span className="text-sm font-medium">Polling</span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Intervalo:</span>
                      <Badge variant="outline">{pollingInterval / 1000}s</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última Atualização:</span>
                      <span className="font-mono">
                        {formatTime(metrics.lastSuccessfulUpdate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.location.reload()}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                  <Button
                    onClick={clearCache}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Limpar Cache
                  </Button>
                </div>

                {/* Indicadores visuais */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Status:</div>
                  <div className="flex gap-2 flex-wrap">
                    {metrics.successRate >= 90 && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        ✓ Rede Saudável
                      </Badge>
                    )}
                    {metrics.cacheHitRate >= 70 && (
                      <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                        🎯 Cache Eficiente
                      </Badge>
                    )}
                    {pollingInterval <= 5000 && (
                      <Badge variant="default" className="text-xs bg-purple-100 text-purple-800">
                        ⚡ Tempo Real
                      </Badge>
                    )}
                    {metrics.averageLatency < 1000 && (
                      <Badge variant="default" className="text-xs bg-orange-100 text-orange-800">
                        🚀 Baixa Latência
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 