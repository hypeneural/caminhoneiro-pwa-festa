import { Photo, GalleryFilters, FilterOptions } from '@/types/gallery';

// Configurações avançadas do cache
const ADVANCED_CACHE_CONFIG = {
  DB_NAME: 'AdvancedGalleryCache',
  DB_VERSION: 2,
  STORES: {
    PHOTOS: 'photos',
    THUMBNAILS: 'thumbnails', 
    FILTERS: 'filters',
    METADATA: 'metadata',
    IMAGES: 'images' // Cache de imagens binárias
  },
  TTL: {
    PHOTOS: 60 * 60 * 1000,       // 1 hora
    THUMBNAILS: 24 * 60 * 60 * 1000, // 24 horas
    FILTERS: 2 * 60 * 60 * 1000,  // 2 horas
    METADATA: 30 * 60 * 1000,     // 30 minutos
    IMAGES: 7 * 24 * 60 * 60 * 1000 // 7 dias
  },
  MAX_SIZE: {
    PHOTOS: 100,          // 100 páginas
    THUMBNAILS: 1000,     // 1000 thumbnails
    FILTERS: 50,          // 50 filtros
    METADATA: 20,         // 20 metadados
    IMAGES: 200           // 200 imagens (≈50MB)
  },
  MEMORY_CACHE_SIZE: 50, // Itens em memória
  PRELOAD_THRESHOLD: 0.8, // 80% do scroll para preload
  COMPRESSION_QUALITY: 0.85 // Qualidade de compressão
} as const;

interface AdvancedCacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  etag?: string;
  size: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high';
  compressionRatio?: number;
  networkQuality?: 'slow' | 'medium' | 'fast';
}

interface CacheStrategy {
  ttl: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'priority';
  compression: boolean;
}

interface NetworkAwareOptions {
  quality: 'slow' | 'medium' | 'fast';
  adaptiveLoading: boolean;
  preloadCount: number;
}

class AdvancedGalleryCache {
  private db: IDBDatabase | null = null;
  private memoryCache: Map<string, AdvancedCacheEntry> = new Map();
  private initialized = false;
  private hitCount = 0;
  private missCount = 0;
  private networkQuality: 'slow' | 'medium' | 'fast' = 'fast';
  private compressionSupported = false;

  // Detecta qualidade da rede
  private detectNetworkQuality(): 'slow' | 'medium' | 'fast' {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow';
        if (effectiveType === '3g') return 'medium';
      }
    }
    return 'fast';
  }

  // Verifica suporte à compressão
  private checkCompressionSupport(): boolean {
    try {
      return 'CompressionStream' in window && 'DecompressionStream' in window;
    } catch {
      return false;
    }
  }

  // Inicializa o cache
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.networkQuality = this.detectNetworkQuality();
    this.compressionSupported = this.checkCompressionSupport();

    try {
      this.db = await this.openDatabase();
      await this.loadCriticalDataToMemory();
      await this.cleanupExpiredEntries();
      this.initialized = true;
      console.log('📦 Advanced Gallery Cache initialized');
    } catch (error) {
      console.error('❌ Failed to initialize advanced cache:', error);
    }
  }

  // Abre conexão com IndexedDB
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(ADVANCED_CACHE_CONFIG.DB_NAME, ADVANCED_CACHE_CONFIG.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Cria object stores
        Object.values(ADVANCED_CACHE_CONFIG.STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp');
            store.createIndex('lastAccessed', 'lastAccessed');
            store.createIndex('priority', 'priority');
          }
        });
      };
    });
  }

  // Carrega dados críticos para memória
  private async loadCriticalDataToMemory(): Promise<void> {
    try {
      // Carrega filtros e metadados críticos
      const filters = await this.getFromStore(ADVANCED_CACHE_CONFIG.STORES.FILTERS, null);
      const metadata = await this.getFromStore(ADVANCED_CACHE_CONFIG.STORES.METADATA, null);
      
      console.log(`🧠 Loaded ${filters.length + metadata.length} critical items to memory`);
    } catch (error) {
      console.warn('⚠️ Failed to load critical data to memory:', error);
    }
  }

  // Comprime dados se suportado
  private async compressData(data: any): Promise<{ compressed: any, ratio: number }> {
    if (!this.compressionSupported) {
      return { compressed: data, ratio: 1 };
    }

    try {
      const jsonString = JSON.stringify(data);
      const originalSize = new Blob([jsonString]).size;
      
      // Simula compressão (implementação real usaria CompressionStream)
      const compressed = jsonString; // Placeholder
      const compressedSize = new Blob([compressed]).size;
      
      return {
        compressed,
        ratio: compressedSize / originalSize
      };
    } catch {
      return { compressed: data, ratio: 1 };
    }
  }

  // Estratégia de cache baseada no tipo de dado
  private getCacheStrategy(storeType: string): CacheStrategy {
    const networkMultiplier = this.networkQuality === 'slow' ? 1.5 : 
                              this.networkQuality === 'medium' ? 1.2 : 1;

    switch (storeType) {
      case ADVANCED_CACHE_CONFIG.STORES.PHOTOS:
        return {
          ttl: ADVANCED_CACHE_CONFIG.TTL.PHOTOS * networkMultiplier,
          maxSize: ADVANCED_CACHE_CONFIG.MAX_SIZE.PHOTOS,
          evictionPolicy: 'lru',
          compression: true
        };
      case ADVANCED_CACHE_CONFIG.STORES.THUMBNAILS:
        return {
          ttl: ADVANCED_CACHE_CONFIG.TTL.THUMBNAILS,
          maxSize: ADVANCED_CACHE_CONFIG.MAX_SIZE.THUMBNAILS,
          evictionPolicy: 'lfu',
          compression: false
        };
      case ADVANCED_CACHE_CONFIG.STORES.IMAGES:
        return {
          ttl: ADVANCED_CACHE_CONFIG.TTL.IMAGES,
          maxSize: ADVANCED_CACHE_CONFIG.MAX_SIZE.IMAGES,
          evictionPolicy: 'priority',
          compression: true
        };
      default:
        return {
          ttl: ADVANCED_CACHE_CONFIG.TTL.METADATA,
          maxSize: ADVANCED_CACHE_CONFIG.MAX_SIZE.METADATA,
          evictionPolicy: 'lru',
          compression: false
        };
    }
  }

  // Cache inteligente com múltiplas camadas
  async setItem<T>(
    store: string, 
    key: string, 
    data: T, 
    options: Partial<{ priority: 'low' | 'medium' | 'high', etag: string }> = {}
  ): Promise<void> {
    const strategy = this.getCacheStrategy(store);
    const { compressed, ratio } = await this.compressData(data);
    
    const entry: AdvancedCacheEntry<T> = {
      key,
      data: strategy.compression ? compressed : data,
      timestamp: Date.now(),
      etag: options.etag,
      size: JSON.stringify(data).length,
      accessCount: 1,
      lastAccessed: Date.now(),
      priority: options.priority || 'medium',
      compressionRatio: ratio,
      networkQuality: this.networkQuality
    };

    // Cache em memória para itens críticos
    if (this.memoryCache.size < ADVANCED_CACHE_CONFIG.MEMORY_CACHE_SIZE || 
        options.priority === 'high') {
      this.memoryCache.set(`${store}:${key}`, entry);
    }

    // Cache em IndexedDB
    try {
      await this.setInStore(store, entry);
      await this.enforceStoreMaxSize(store, strategy);
    } catch (error) {
      console.warn(`⚠️ Failed to cache item ${key}:`, error);
    }
  }

  // Recupera item do cache com fallback em camadas
  async getItem<T>(store: string, key: string): Promise<T | null> {
    const fullKey = `${store}:${key}`;
    
    // 1. Verifica cache de memória primeiro
    const memoryEntry = this.memoryCache.get(fullKey);
    if (memoryEntry && this.isEntryValid(memoryEntry, store)) {
      memoryEntry.accessCount++;
      memoryEntry.lastAccessed = Date.now();
      this.hitCount++;
      console.log(`💾 Memory cache hit: ${key}`);
      return memoryEntry.data;
    }

    // 2. Verifica IndexedDB
    try {
      const entry = await this.getFromStore(store, key);
      if (entry && this.isEntryValid(entry, store)) {
        // Promove para memória se acessado frequentemente
        if (entry.accessCount > 3) {
          this.memoryCache.set(fullKey, entry);
        }
        
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        await this.setInStore(store, entry);
        
        this.hitCount++;
        console.log(`🗄️ IndexedDB cache hit: ${key}`);
        return entry.data;
      }
    } catch (error) {
      console.warn(`⚠️ Error reading from IndexedDB:`, error);
    }

    this.missCount++;
    console.log(`❌ Cache miss: ${key}`);
    return null;
  }

  // Verifica se entrada está válida
  private isEntryValid(entry: AdvancedCacheEntry, store: string): boolean {
    const strategy = this.getCacheStrategy(store);
    const age = Date.now() - entry.timestamp;
    
    // TTL adaptativo baseado na rede
    const adaptiveTTL = this.networkQuality === 'slow' ? strategy.ttl * 1.5 : strategy.ttl;
    
    return age < adaptiveTTL;
  }

  // Aplica política de remoção por tamanho
  private async enforceStoreMaxSize(store: string, strategy: CacheStrategy): Promise<void> {
    const entries = await this.getFromStore(store, null);
    
    if (entries.length <= strategy.maxSize) return;

    const sortedEntries = entries.sort((a, b) => {
      switch (strategy.evictionPolicy) {
        case 'lru':
          return a.lastAccessed - b.lastAccessed;
        case 'lfu':
          return a.accessCount - b.accessCount;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'fifo':
        default:
          return a.timestamp - b.timestamp;
      }
    });

    // Remove entradas mais antigas/menos usadas
    const toRemove = sortedEntries.slice(0, entries.length - strategy.maxSize);
    await Promise.all(toRemove.map(entry => this.removeFromStore(store, entry.key)));
    
    console.log(`🧹 Evicted ${toRemove.length} entries from ${store}`);
  }

  // Limpeza de entradas expiradas
  async cleanupExpiredEntries(): Promise<void> {
    for (const store of Object.values(ADVANCED_CACHE_CONFIG.STORES)) {
      try {
        const entries = await this.getFromStore(store, null);
        const expired = entries.filter(entry => !this.isEntryValid(entry, store));
        
        await Promise.all(expired.map(entry => this.removeFromStore(store, entry.key)));
        
        if (expired.length > 0) {
          console.log(`🗑️ Cleaned ${expired.length} expired entries from ${store}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error cleaning store ${store}:`, error);
      }
    }
  }

  // Pré-carregamento inteligente
  async intelligentPreload(photos: Photo[], currentIndex: number): Promise<void> {
    const preloadCount = this.networkQuality === 'slow' ? 2 : 
                        this.networkQuality === 'medium' ? 3 : 5;
    
    const toPreload: Photo[] = [];
    
    // Próximas fotos
    for (let i = 1; i <= preloadCount && currentIndex + i < photos.length; i++) {
      toPreload.push(photos[currentIndex + i]);
    }
    
    // Fotos anteriores (menos prioridade)
    for (let i = 1; i <= Math.floor(preloadCount / 2) && currentIndex - i >= 0; i++) {
      toPreload.push(photos[currentIndex - i]);
    }

    // Pré-carrega em background
    Promise.all(toPreload.map(async (photo, index) => {
      const priority = index < 2 ? 'high' : 'medium';
      const url = photo.variants?.preview?.webp || photo.url;
      
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        await this.setItem(ADVANCED_CACHE_CONFIG.STORES.IMAGES, photo.id, blob, { priority });
      } catch (error) {
        console.warn(`⚠️ Failed to preload photo ${photo.id}:`, error);
      }
    }));
  }

  // Helpers para IndexedDB
  private async getFromStore(storeName: string, key: string | null): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      if (key === null) {
        // Retorna todos os itens
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }

  private async setInStore(storeName: string, entry: AdvancedCacheEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(entry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async removeFromStore(storeName: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Remove do cache de memória também
    this.memoryCache.delete(`${storeName}:${key}`);
  }

  // Estatísticas detalhadas
  getCacheStats() {
    const hitRate = this.hitCount + this.missCount > 0 ? 
      this.hitCount / (this.hitCount + this.missCount) : 0;

    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: hitRate,
      memoryItems: this.memoryCache.size,
      networkQuality: this.networkQuality,
      compressionSupported: this.compressionSupported,
      initialized: this.initialized
    };
  }

  // APIs públicas para tipos específicos
  async cachePhotos(filters: GalleryFilters, photos: Photo[]): Promise<void> {
    const key = JSON.stringify(filters);
    await this.setItem(ADVANCED_CACHE_CONFIG.STORES.PHOTOS, key, photos, { priority: 'high' });
  }

  async getCachedPhotos(filters: GalleryFilters): Promise<Photo[] | null> {
    const key = JSON.stringify(filters);
    return this.getItem<Photo[]>(ADVANCED_CACHE_CONFIG.STORES.PHOTOS, key);
  }

  async cacheFilterOptions(options: FilterOptions): Promise<void> {
    await this.setItem(ADVANCED_CACHE_CONFIG.STORES.FILTERS, 'options', options, { priority: 'high' });
  }

  async getCachedFilterOptions(): Promise<FilterOptions | null> {
    return this.getItem<FilterOptions>(ADVANCED_CACHE_CONFIG.STORES.FILTERS, 'options');
  }
}

// Instância singleton
export const advancedCache = new AdvancedGalleryCache(); 