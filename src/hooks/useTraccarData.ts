import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import type { 
  TraccarResponse, 
  TraccarPosition, 
  ProcessedTrackerData
} from '@/types/tracker';
import { API } from '@/constants/api';
import { useNetworkStatus } from './useNetworkStatus';
import { trackerCache } from '@/services/trackerCacheService';
import { 
  isValidCoordinate, 
  isValidTimestamp, 
  processTrackerData 
} from '@/utils/trackerUtils';

// Hook para detectar visibilidade da página
const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
};

// Função para buscar dados do Traccar com cache inteligente
const fetchTraccarData = async (): Promise<ProcessedTrackerData> => {
  const startTime = Date.now();
  const url = `${API.TRACCAR.BASE_URL}${API.TRACCAR.ENDPOINTS.POSITIONS}`;
  
  console.log('🚚 Fazendo requisição Traccar para:', url);
  
  try {
    // Tentar cache primeiro em caso de falha de rede
    const cachedPosition = await trackerCache.getLatestPosition();
    
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000) // 8s timeout
    });
    
    const latency = Date.now() - startTime;
    console.log(`📡 Resposta recebida em ${latency}ms`);
    
    if (!response.ok) {
      // Se falhou mas temos cache, usar cache
      if (cachedPosition) {
        console.log('📦 Usando cache devido a erro na API');
        const processed = processTrackerData(cachedPosition);
        return processed;
      }
      
      throw new TrackerError({
        type: response.status >= 500 ? 'server' : 'network',
        message: `Erro na API: ${response.status} - ${response.statusText}`,
        code: response.status,
        timestamp: Date.now(),
        retryable: response.status >= 500 || response.status === 429
      });
    }
    
    const result: TraccarResponse = await response.json();
    console.log('📊 Dados recebidos:', result);
    
    // Validação da resposta
    if (!Array.isArray(result) || result.length === 0) {
      // Se falhou mas temos cache, usar cache
      if (cachedPosition) {
        console.log('📦 Usando cache devido a resposta inválida');
        const processed = processTrackerData(cachedPosition);
        return processed;
      }
      
      throw new TrackerError({
        type: 'validation',
        message: 'API retornou array vazio ou formato inválido',
        timestamp: Date.now(),
        retryable: true
      });
    }
    
    const position = result[0];
    
    // Validações críticas
    if (!isValidCoordinate(position.latitude, position.longitude)) {
      throw new TrackerError({
        type: 'validation',
        message: `Coordenadas inválidas: ${position.latitude}, ${position.longitude}`,
        timestamp: Date.now(),
        retryable: false
      });
    }
    
    if (!isValidTimestamp(position.fixTime)) {
      throw new TrackerError({
        type: 'validation',
        message: `Timestamp inválido: ${position.fixTime}`,
        timestamp: Date.now(),
        retryable: false
      });
    }
    
    // Validação de precisão
    if (position.accuracy > API.TRACCAR.VALIDATION.MAX_ACCURACY) {
      console.warn(`⚠️ Precisão baixa: ${position.accuracy}m (máx: ${API.TRACCAR.VALIDATION.MAX_ACCURACY}m)`);
    }
    
    // Validação de idade dos dados
    const dataAge = Date.now() - new Date(position.fixTime).getTime();
    if (dataAge > API.TRACCAR.VALIDATION.MAX_AGE) {
      console.warn(`⚠️ Dados antigos: ${Math.floor(dataAge / 1000)}s (máx: ${API.TRACCAR.VALIDATION.MAX_AGE / 1000}s)`);
    }
    
    // Cachear a posição recebida
    await trackerCache.cachePosition(position, latency);
    
    // Processar dados
    const processed = processTrackerData(position);
    
    // Cachear dados processados
    await trackerCache.cacheProcessedData(processed);
    
    console.log('✅ Dados validados e cacheados com sucesso');
    return processed;
    
  } catch (error) {
    console.error('❌ Erro na requisição Traccar:', error);
    
    // Tentar cache como fallback
    const cachedPosition = await trackerCache.getLatestPosition();
    if (cachedPosition) {
      console.log('📦 Usando cache como fallback após erro');
      const processed = processTrackerData(cachedPosition);
      return processed;
    }
    
    if (error instanceof TrackerError) {
      throw error;
    }
    
    // Converter outros erros
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new TrackerError({
        type: 'network',
        message: 'Erro de conexão - verifique sua internet',
        timestamp: Date.now(),
        retryable: true
      });
    }
    
    if (error.name === 'AbortError') {
      throw new TrackerError({
        type: 'timeout',
        message: 'Timeout na requisição',
        timestamp: Date.now(),
        retryable: true
      });
    }
    
    throw new TrackerError({
      type: 'unknown',
      message: error.message || 'Erro desconhecido',
      timestamp: Date.now(),
      retryable: true
    });
  }
};

// Hook principal do Traccar
export const useTraccarData = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const isPageVisible = usePageVisibility();
  const metricsRef = useRef({
    requestCount: 0,
    errorCount: 0,
    latencySum: 0,
    lastSuccessfulUpdate: 0
  });

  // Polling adaptativo baseado no contexto
  const getPollingInterval = useCallback(() => {
    if (!isOnline) {
      return API.TRACCAR.POLLING.OFFLINE;
    }
    
    if (!isPageVisible) {
      return API.TRACCAR.POLLING.BACKGROUND;
    }
    
    // Verificar se há dados em cache
    const cachedData = queryClient.getQueryData<ProcessedTrackerData>(['traccar-data']);
    if (cachedData?.connectionStatus.state === 'live') {
      return API.TRACCAR.POLLING.REALTIME;
    }
    
    return API.TRACCAR.POLLING.SLOW_CONNECTION;
  }, [isOnline, isPageVisible, queryClient]);

  // Função de retry inteligente
  const shouldRetry = useCallback((failureCount: number, error: any): boolean => {
    // Não tentar se offline
    if (!isOnline) {
      console.log('🔄 Não tentando novamente - offline');
      return false;
    }
    
    // Limite de tentativas
    if (failureCount >= API.TRACCAR.RETRY.ATTEMPTS) {
      console.log(`🔄 Limite de tentativas atingido: ${failureCount}`);
      return false;
    }
    
    // Não tentar em erros não-retryáveis
    if (error instanceof TrackerError && !error.retryable) {
      console.log('🔄 Erro não-retryável:', error.message);
      return false;
    }
    
    // Não tentar em erros 404/403
    if (error?.code === 404 || error?.code === 403) {
      console.log('🔄 Erro de autorização - não tentando novamente');
      return false;
    }
    
    console.log(`🔄 Tentando novamente (${failureCount + 1}/${API.TRACCAR.RETRY.ATTEMPTS})`);
    return true;
  }, [isOnline]);

  // Delay de retry com backoff exponencial
  const getRetryDelay = useCallback((attemptIndex: number): number => {
    const delay = Math.min(
      API.TRACCAR.RETRY.DELAY_BASE * Math.pow(API.TRACCAR.RETRY.BACKOFF_FACTOR, attemptIndex),
      API.TRACCAR.RETRY.MAX_DELAY
    );
    console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
    return delay;
  }, []);

  // Query principal
  const query = useQuery({
    queryKey: ['traccar-data'],
    queryFn: async (): Promise<ProcessedTrackerData> => {
      metricsRef.current.requestCount++;
      const startTime = Date.now();
      
      try {
        const processed = await fetchTraccarData();
        
        // Atualizar métricas
        const latency = Date.now() - startTime;
        metricsRef.current.latencySum += latency;
        metricsRef.current.lastSuccessfulUpdate = Date.now();
        
        console.log('📈 Dados processados com sucesso:', {
          movement: processed.movementStatus.label,
          connection: processed.connectionStatus.label,
          battery: `${processed.batteryStatus.level}%`,
          accuracy: `${processed.accuracyStatus.value.toFixed(1)}m`
        });
        
        return processed;
      } catch (error) {
        metricsRef.current.errorCount++;
        throw error;
      }
    },
    
    refetchInterval: getPollingInterval(),
    staleTime: API.CACHE.TRACKER_STALE_TIME,
    
    retry: shouldRetry,
    retryDelay: getRetryDelay,
    
    // Gestão de foco e reconexão
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  // Função para invalidar cache e forçar atualização
  const forceRefresh = useCallback(() => {
    console.log('🔄 Forçando atualização dos dados...');
    queryClient.invalidateQueries({ queryKey: ['traccar-data'] });
  }, [queryClient]);

  // Função para obter métricas combinadas
  const getMetrics = useCallback(() => {
    const queryMetrics = metricsRef.current;
    const cacheMetrics = trackerCache.getMetrics();
    
    return {
      requestCount: queryMetrics.requestCount,
      errorCount: queryMetrics.errorCount,
      successRate: queryMetrics.requestCount > 0 ? 
        ((queryMetrics.requestCount - queryMetrics.errorCount) / queryMetrics.requestCount) * 100 : 0,
      averageLatency: queryMetrics.requestCount > 0 ? 
        queryMetrics.latencySum / queryMetrics.requestCount : 0,
      lastSuccessfulUpdate: queryMetrics.lastSuccessfulUpdate,
      cacheHitRate: cacheMetrics.hitRate,
      cacheSize: cacheMetrics.cacheSize,
      storageUsed: cacheMetrics.storageUsed
    };
  }, []);

  // Função para limpar cache
  const clearCache = useCallback(async () => {
    console.log('🗑️ Limpando cache do tracker...');
    await trackerCache.clear();
    queryClient.removeQueries({ queryKey: ['traccar-data'] });
  }, [queryClient]);

  // Log de mudanças de estado para debug
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Estado do tracker alterado:', {
        isLoading: query.isLoading,
        isError: query.isError,
        isFetching: query.isFetching,
        dataAge: query.data?.dataAge,
        pollingInterval: getPollingInterval()
      });
    }
  }, [query.isLoading, query.isError, query.isFetching, query.data?.dataAge, getPollingInterval]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    forceRefresh,
    getMetrics,
    clearCache,
    
    // Estados derivados
    isOnline,
    isPageVisible,
    pollingInterval: getPollingInterval(),
    
    // Dados processados
    hasValidData: query.data?.hasValidGPS || false,
    needsAttention: query.data?.needsAttention || false,
    isRealtime: query.data?.isRealtime || false
  };
};

// Classe de erro customizada
class TrackerError extends Error {
  public type: 'network' | 'validation' | 'timeout' | 'server' | 'unknown';
  public code?: number;
  public timestamp: number;
  public retryable: boolean;

  constructor(config: {
    type: TrackerError['type'];
    message: string;
    code?: number;
    timestamp: number;
    retryable: boolean;
  }) {
    super(config.message);
    this.name = 'TrackerError';
    this.type = config.type;
    this.code = config.code;
    this.timestamp = config.timestamp;
    this.retryable = config.retryable;
  }
}

// Re-exportar tipos e interfaces para conveniência
export type { TraccarPosition, ProcessedTrackerData };