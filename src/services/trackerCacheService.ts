import type { 
  TraccarPosition, 
  ProcessedTrackerData, 
  CachedTrackerData 
} from '@/types/tracker';
import { API } from '@/constants/api';

// Interface para configuração de cache
interface CacheConfig {
  maxEntries: number;
  defaultTTL: number;
  compressionEnabled: boolean;
  persistToIndexedDB: boolean;
  debugMode: boolean;
}

// Interface para métricas de cache
interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheSize: number;
  storageUsed: number;
  lastCleanup: number;
}

// Interface para item de cache
interface CacheItem<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  priority: 'high' | 'medium' | 'low';
  accessCount: number;
  lastAccess: number;
  networkLatency?: number;
  compressionRatio?: number;
}

// Interface para estratégias de limpeza
type EvictionStrategy = 'lru' | 'ttl' | 'priority' | 'size';

export class TrackerCacheService {
  private static instance: TrackerCacheService;
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupTimer?: NodeJS.Timeout;
  private dbConnection?: IDBDatabase;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxEntries: 1000,
      defaultTTL: API.CACHE.TRACKER_CACHE_TIME,
      compressionEnabled: false, // Desabilitado temporariamente devido a bugs
      persistToIndexedDB: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    };

    this.metrics = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheSize: 0,
      storageUsed: 0,
      lastCleanup: Date.now()
    };

    this.initializeIndexedDB();
    this.startCleanupTimer();
  }

  public static getInstance(config?: Partial<CacheConfig>): TrackerCacheService {
    if (!TrackerCacheService.instance) {
      TrackerCacheService.instance = new TrackerCacheService(config);
    }
    return TrackerCacheService.instance;
  }

  // Inicializar IndexedDB para persistência
  private async initializeIndexedDB(): Promise<void> {
    if (!this.config.persistToIndexedDB || typeof indexedDB === 'undefined') {
      return;
    }

    try {
      const request = indexedDB.open('TrackerCache', 1);
      
      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB');
      };

      request.onsuccess = () => {
        this.dbConnection = request.result;
        this.loadFromIndexedDB();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
        }
      };
    } catch (error) {
      console.error('❌ Erro ao inicializar IndexedDB:', error);
    }
  }

  // Carregar dados do IndexedDB na inicialização
  private async loadFromIndexedDB(): Promise<void> {
    if (!this.dbConnection) return;

    try {
      const transaction = this.dbConnection.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as CacheItem<any>[];
        const now = Date.now();

        items.forEach(item => {
          // Verificar se ainda é válido
          if (now - item.timestamp < item.ttl) {
            this.cache.set(item.key, item);
          }
        });

        console.log(`📦 Carregados ${items.length} itens do cache persistente`);
        this.updateMetrics();
      };
    } catch (error) {
      console.error('❌ Erro ao carregar cache do IndexedDB:', error);
    }
  }

  // Salvar item no IndexedDB
  private async saveToIndexedDB(item: CacheItem<any>): Promise<void> {
    if (!this.dbConnection || !this.config.persistToIndexedDB) return;

    try {
      const transaction = this.dbConnection.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.put(item);
    } catch (error) {
      console.error('❌ Erro ao salvar no IndexedDB:', error);
    }
  }

  // Comprimir dados se habilitado
  private compressData(data: any): { compressed: string; ratio: number } {
    if (!this.config.compressionEnabled) {
      return { compressed: JSON.stringify(data), ratio: 1 };
    }

    try {
      const original = JSON.stringify(data);
      const compressed = this.simpleCompress(original);
      const ratio = compressed.length / original.length;
      
      return { compressed, ratio };
    } catch (error) {
      console.error('❌ Erro na compressão:', error);
      return { compressed: JSON.stringify(data), ratio: 1 };
    }
  }

  // Descomprimir dados
  private decompressData(compressed: string): any {
    if (!this.config.compressionEnabled) {
      return JSON.parse(compressed);
    }

    try {
      const decompressed = this.simpleDecompress(compressed);
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('❌ Erro na descompressão:', error);
      return JSON.parse(compressed);
    }
  }

  // Compressão simples usando RLE (Run Length Encoding)
  private simpleCompress(str: string): string {
    let compressed = '';
    let count = 1;
    
    for (let i = 0; i < str.length; i++) {
      if (str[i] === str[i + 1]) {
        count++;
      } else {
        compressed += count > 1 ? `${count}${str[i]}` : str[i];
        count = 1;
      }
    }
    
    return compressed;
  }

  // Descompressão simples
  private simpleDecompress(compressed: string): string {
    return compressed.replace(/(\d+)(.)/g, (match, count, char) => {
      return char.repeat(parseInt(count));
    });
  }

  // Determinar TTL baseado na qualidade dos dados
  private calculateDynamicTTL(data: TraccarPosition): number {
    let ttl = this.config.defaultTTL;

    // TTL mais curto para dados mais frescos e precisos
    if (data.valid && data.accuracy < 10) {
      ttl = API.CACHE.TRACKER_STALE_TIME; // Dados muito precisos = cache curto
    } else if (!data.valid || data.accuracy > 50) {
      ttl = API.CACHE.TRACKER_CACHE_TIME; // Dados ruins = cache mais longo
    }

    // Ajustar baseado na idade dos dados
    const dataAge = Date.now() - new Date(data.fixTime).getTime();
    if (dataAge > 30000) { // > 30s
      ttl *= 2; // Cache mais longo para dados antigos
    }

    return ttl;
  }

  // Determinar prioridade baseada no contexto
  private calculatePriority(data: TraccarPosition): 'high' | 'medium' | 'low' {
    // Prioridade alta: dados recentes, válidos e precisos
    if (data.valid && data.accuracy < 15) {
      const dataAge = Date.now() - new Date(data.fixTime).getTime();
      if (dataAge < 30000) { // < 30s
        return 'high';
      }
    }

    // Prioridade baixa: dados antigos ou imprecisos
    if (!data.valid || data.accuracy > 50) {
      return 'low';
    }

    return 'medium';
  }

  // Armazenar dados no cache
  public async set<T>(
    key: string, 
    data: T, 
    options?: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      networkLatency?: number;
    }
  ): Promise<void> {
    const now = Date.now();
    const { compressed, ratio } = this.compressData(data);
    
    const item: CacheItem<string> = {
      key,
      data: compressed,
      timestamp: now,
      ttl: options?.ttl || this.config.defaultTTL,
      priority: options?.priority || 'medium',
      accessCount: 0,
      lastAccess: now,
      networkLatency: options?.networkLatency,
      compressionRatio: ratio
    };

    // Verificar se precisa fazer limpeza
    if (this.cache.size >= this.config.maxEntries) {
      await this.cleanup('size');
    }

    this.cache.set(key, item);
    await this.saveToIndexedDB(item);
    this.updateMetrics();

    if (this.config.debugMode) {
      console.log(`💾 Cache SET: ${key}`, {
        size: compressed.length,
        ratio: ratio.toFixed(2),
        ttl: item.ttl,
        priority: item.priority
      });
    }
  }

  // Recuperar dados do cache
  public async get<T>(key: string): Promise<T | null> {
    this.metrics.totalRequests++;
    
    const item = this.cache.get(key);
    if (!item) {
      this.metrics.missRate++;
      this.updateMetrics();
      return null;
    }

    const now = Date.now();
    
    // Verificar se expirou
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.metrics.missRate++;
      this.updateMetrics();
      return null;
    }

    // Atualizar estatísticas de acesso
    item.accessCount++;
    item.lastAccess = now;

    this.metrics.hitRate++;
    this.updateMetrics();

    try {
      const decompressed = this.decompressData(item.data);
      
      if (this.config.debugMode) {
        console.log(`🎯 Cache HIT: ${key}`, {
          age: now - item.timestamp,
          accessCount: item.accessCount,
          priority: item.priority
        });
      }
      
      return decompressed as T;
    } catch (error) {
      console.error('❌ Erro ao descomprimir cache:', error);
      this.cache.delete(key);
      return null;
    }
  }

  // Cache específico para posições do tracker
  public async cachePosition(data: TraccarPosition, networkLatency?: number): Promise<void> {
    const key = `position-${data.deviceId}-${data.id}`;
    const ttl = this.calculateDynamicTTL(data);
    const priority = this.calculatePriority(data);

    await this.set(key, data, { ttl, priority, networkLatency });

    // Cache também a posição mais recente
    await this.set('latest-position', data, { ttl, priority: 'high', networkLatency });
  }

  // Recuperar posição mais recente
  public async getLatestPosition(): Promise<TraccarPosition | null> {
    return await this.get<TraccarPosition>('latest-position');
  }

  // Cache para dados processados
  public async cacheProcessedData(data: ProcessedTrackerData): Promise<void> {
    const key = `processed-${data.deviceId}-${data.id}`;
    const ttl = this.calculateDynamicTTL(data);
    
    await this.set(key, data, { 
      ttl, 
      priority: data.hasValidGPS ? 'high' : 'medium' 
    });
  }

  // Limpeza de cache baseada em estratégia
  public async cleanup(strategy: EvictionStrategy = 'lru'): Promise<number> {
    const sizeBefore = this.cache.size;
    const now = Date.now();
    const itemsToRemove: string[] = [];

    switch (strategy) {
      case 'ttl':
        // Remove itens expirados
        for (const [key, item] of this.cache) {
          if (now - item.timestamp > item.ttl) {
            itemsToRemove.push(key);
          }
        }
        break;

      case 'lru':
        // Remove itens menos recentemente usados
        const sortedByAccess = Array.from(this.cache.entries())
          .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);
        
        const removeCount = Math.floor(this.cache.size * 0.2); // Remove 20%
        itemsToRemove.push(...sortedByAccess.slice(0, removeCount).map(([key]) => key));
        break;

      case 'priority':
        // Remove itens de baixa prioridade primeiro
        const sortedByPriority = Array.from(this.cache.entries())
          .sort(([, a], [, b]) => {
            const priorityOrder = { low: 0, medium: 1, high: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          });
        
        const lowPriorityCount = Math.floor(this.cache.size * 0.3);
        itemsToRemove.push(...sortedByPriority.slice(0, lowPriorityCount).map(([key]) => key));
        break;

      case 'size':
        // Remove itens maiores primeiro
        const sortedBySize = Array.from(this.cache.entries())
          .sort(([, a], [, b]) => b.data.length - a.data.length);
        
        const removeSize = Math.floor(this.cache.size * 0.15);
        itemsToRemove.push(...sortedBySize.slice(0, removeSize).map(([key]) => key));
        break;
    }

    // Remover itens selecionados
    itemsToRemove.forEach(key => this.cache.delete(key));
    
    this.metrics.lastCleanup = now;
    this.updateMetrics();

    const removedCount = sizeBefore - this.cache.size;
    
    if (this.config.debugMode) {
      console.log(`🧹 Limpeza de cache (${strategy}): ${removedCount} itens removidos`);
    }

    return removedCount;
  }

  // Limpeza automática periódica
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup('ttl'); // Limpar itens expirados a cada 5 minutos
    }, 5 * 60 * 1000);
  }

  // Atualizar métricas
  private updateMetrics(): void {
    this.metrics.cacheSize = this.cache.size;
    this.metrics.storageUsed = Array.from(this.cache.values())
      .reduce((total, item) => total + item.data.length, 0);
  }

  // Obter métricas do cache
  public getMetrics(): CacheMetrics {
    return {
      ...this.metrics,
      hitRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.hitRate / this.metrics.totalRequests) * 100 : 0,
      missRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.missRate / this.metrics.totalRequests) * 100 : 0
    };
  }

  // Limpar todo o cache
  public async clear(): Promise<void> {
    this.cache.clear();
    
    if (this.dbConnection) {
      try {
        const transaction = this.dbConnection.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await store.clear();
      } catch (error) {
        console.error('❌ Erro ao limpar IndexedDB:', error);
      }
    }

    this.updateMetrics();
    console.log('🗑️ Cache completamente limpo');
  }

  // Destruir instância
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.dbConnection) {
      this.dbConnection.close();
    }
    
    this.cache.clear();
  }
}

// Exportar instância singleton
export const trackerCache = TrackerCacheService.getInstance(); 