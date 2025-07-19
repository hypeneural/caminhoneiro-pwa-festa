import { Photo, GalleryFilters, FilterOptions } from '@/types/gallery';

// Configurações do cache
const CACHE_CONFIG = {
  DB_NAME: 'GalleryCache',
  DB_VERSION: 1,
  STORES: {
    PHOTOS: 'photos',
    THUMBNAILS: 'thumbnails',
    FILTERS: 'filters',
    METADATA: 'metadata'
  },
  TTL: {
    PHOTOS: 30 * 60 * 1000,       // 30 minutos
    THUMBNAILS: 24 * 60 * 60 * 1000, // 24 horas
    FILTERS: 60 * 60 * 1000,      // 1 hora
    METADATA: 10 * 60 * 1000      // 10 minutos
  },
  MAX_SIZE: {
    PHOTOS: 50,          // 50 páginas de fotos
    THUMBNAILS: 500,     // 500 thumbnails
    FILTERS: 20,         // 20 conjuntos de filtros
    METADATA: 10         // 10 metadados
  }
} as const;

interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  etag?: string;
  size?: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalSize: number;
  entriesCount: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

class SmartGalleryCache {
  private db: IDBDatabase | null = null;
  private initialized = false;
  private hitCount = 0;
  private missCount = 0;

  // Inicializa o IndexedDB
  async initialize(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.DB_VERSION);

      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log('✅ Cache IndexedDB inicializado');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para fotos
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.PHOTOS)) {
          const photosStore = db.createObjectStore(CACHE_CONFIG.STORES.PHOTOS, { keyPath: 'key' });
          photosStore.createIndex('timestamp', 'timestamp', { unique: false });
          photosStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }

        // Store para thumbnails (blobs de imagem)
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.THUMBNAILS)) {
          const thumbnailsStore = db.createObjectStore(CACHE_CONFIG.STORES.THUMBNAILS, { keyPath: 'key' });
          thumbnailsStore.createIndex('timestamp', 'timestamp', { unique: false });
          thumbnailsStore.createIndex('size', 'size', { unique: false });
        }

        // Store para filtros
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.FILTERS)) {
          const filtersStore = db.createObjectStore(CACHE_CONFIG.STORES.FILTERS, { keyPath: 'key' });
          filtersStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store para metadados
        if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.METADATA)) {
          const metadataStore = db.createObjectStore(CACHE_CONFIG.STORES.METADATA, { keyPath: 'key' });
          metadataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Cria chave única para cache
  private createCacheKey(type: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);

    return `${type}:${JSON.stringify(sortedParams)}`;
  }

  // Verifica se entrada está válida
  private isEntryValid(entry: CacheEntry, ttl: number): boolean {
    return Date.now() - entry.timestamp < ttl;
  }

  // Salva dados no cache
  async set<T>(
    store: string,
    key: string,
    data: T,
    etag?: string,
    size?: number
  ): Promise<void> {
    if (!this.db) await this.initialize();

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      etag,
      size,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.put(entry);

      request.onsuccess = () => {
        // Limpa cache se necessário
        this.cleanupIfNeeded(store);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Erro ao salvar no cache ${store}:`, request.error);
        reject(request.error);
      };
    });
  }

  // Recupera dados do cache
  async get<T>(store: string, key: string, ttl: number): Promise<T | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = request.result;

        if (!entry) {
          this.missCount++;
          resolve(null);
          return;
        }

        if (!this.isEntryValid(entry, ttl)) {
          // Remove entrada expirada
          objectStore.delete(key);
          this.missCount++;
          resolve(null);
          return;
        }

        // Atualiza estatísticas de acesso
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        objectStore.put(entry);

        this.hitCount++;
        resolve(entry.data);
      };

      request.onerror = () => {
        this.missCount++;
        resolve(null);
      };
    });
  }

  // Cache para fotos
  async cachePhotos(filters: GalleryFilters, photos: Photo[], etag?: string): Promise<void> {
    const key = this.createCacheKey('photos', filters);
    await this.set(CACHE_CONFIG.STORES.PHOTOS, key, photos, etag);
  }

  async getCachedPhotos(filters: GalleryFilters): Promise<Photo[] | null> {
    const key = this.createCacheKey('photos', filters);
    return this.get<Photo[]>(CACHE_CONFIG.STORES.PHOTOS, key, CACHE_CONFIG.TTL.PHOTOS);
  }

  // Cache para thumbnails (como blob)
  async cacheThumbnail(url: string, blob: Blob): Promise<void> {
    await this.set(CACHE_CONFIG.STORES.THUMBNAILS, url, blob, undefined, blob.size);
  }

  async getCachedThumbnail(url: string): Promise<Blob | null> {
    return this.get<Blob>(CACHE_CONFIG.STORES.THUMBNAILS, url, CACHE_CONFIG.TTL.THUMBNAILS);
  }

  // Cache para filtros
  async cacheFilterOptions(options: FilterOptions): Promise<void> {
    await this.set(CACHE_CONFIG.STORES.FILTERS, 'filter-options', options);
  }

  async getCachedFilterOptions(): Promise<FilterOptions | null> {
    return this.get<FilterOptions>(CACHE_CONFIG.STORES.FILTERS, 'filter-options', CACHE_CONFIG.TTL.FILTERS);
  }

  // Cache para metadados gerais
  async cacheMetadata(key: string, data: any): Promise<void> {
    await this.set(CACHE_CONFIG.STORES.METADATA, key, data);
  }

  async getCachedMetadata<T>(key: string): Promise<T | null> {
    return this.get<T>(CACHE_CONFIG.STORES.METADATA, key, CACHE_CONFIG.TTL.METADATA);
  }

  // Limpa cache quando necessário (LRU + tamanho)
  private async cleanupIfNeeded(store: string): Promise<void> {
    if (!this.db) return;

    const maxSize = CACHE_CONFIG.MAX_SIZE[store as keyof typeof CACHE_CONFIG.MAX_SIZE];
    if (!maxSize) return;

    const transaction = this.db.transaction([store], 'readwrite');
    const objectStore = transaction.objectStore(store);
    const countRequest = objectStore.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;
      
      if (count <= maxSize) return;

      // Remove entradas antigas usando LRU
      const index = objectStore.index('lastAccessed');
      const cursorRequest = index.openCursor();
      let deletedCount = 0;
      const toDelete = count - maxSize;

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor && deletedCount < toDelete) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };
    };
  }

  // Limpa todo o cache
  async clearAll(): Promise<void> {
    if (!this.db) return;

    const stores = Object.values(CACHE_CONFIG.STORES);
    const transaction = this.db.transaction(stores, 'readwrite');

    stores.forEach(store => {
      transaction.objectStore(store).clear();
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        this.hitCount = 0;
        this.missCount = 0;
        console.log('🧹 Cache limpo completamente');
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  // Limpa cache expirado
  async clearExpired(): Promise<void> {
    if (!this.db) return;

    const stores = [
      { name: CACHE_CONFIG.STORES.PHOTOS, ttl: CACHE_CONFIG.TTL.PHOTOS },
      { name: CACHE_CONFIG.STORES.THUMBNAILS, ttl: CACHE_CONFIG.TTL.THUMBNAILS },
      { name: CACHE_CONFIG.STORES.FILTERS, ttl: CACHE_CONFIG.TTL.FILTERS },
      { name: CACHE_CONFIG.STORES.METADATA, ttl: CACHE_CONFIG.TTL.METADATA }
    ];

    const now = Date.now();

    for (const { name, ttl } of stores) {
      const transaction = this.db.transaction([name], 'readwrite');
      const objectStore = transaction.objectStore(name);
      const index = objectStore.index('timestamp');
      const range = IDBKeyRange.upperBound(now - ttl);
      
      index.openCursor(range).onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  // Estatísticas do cache
  async getStats(): Promise<CacheStats> {
    if (!this.db) await this.initialize();

    let totalSize = 0;
    let entriesCount = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    const stores = Object.values(CACHE_CONFIG.STORES);

    for (const store of stores) {
      const transaction = this.db!.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      
      // Conta entradas
      const countRequest = objectStore.count();
      const count = await new Promise<number>((resolve) => {
        countRequest.onsuccess = () => resolve(countRequest.result);
      });
      
      entriesCount += count;

      // Calcula tamanho e datas
      const cursorRequest = objectStore.openCursor();
      await new Promise<void>((resolve) => {
        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          
          if (cursor) {
            const entry: CacheEntry = cursor.value;
            totalSize += entry.size || 0;
            oldestEntry = Math.min(oldestEntry, entry.timestamp);
            newestEntry = Math.max(newestEntry, entry.timestamp);
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
    }

    const hitRate = this.hitCount + this.missCount > 0 
      ? this.hitCount / (this.hitCount + this.missCount) 
      : 0;

    return {
      totalSize,
      entriesCount,
      hitRate,
      oldestEntry,
      newestEntry
    };
  }

  // Preload de imagens críticas
  async preloadCriticalImages(urls: string[]): Promise<void> {
    const loadPromises = urls.map(async (url) => {
      try {
        // Verifica se já está em cache
        const cached = await this.getCachedThumbnail(url);
        if (cached) return;

        // Carrega e armazena
        const response = await fetch(url);
        const blob = await response.blob();
        await this.cacheThumbnail(url, blob);
      } catch (error) {
        console.warn(`⚠️ Falha ao preload da imagem ${url}:`, error);
      }
    });

    await Promise.allSettled(loadPromises);
  }

  // Otimiza cache baseado no padrão de uso
  async optimizeCache(): Promise<void> {
    // Limpa cache expirado
    await this.clearExpired();

    // Remove thumbnails menos acessados se o cache estiver muito grande
    const stats = await this.getStats();
    const maxTotalSize = 50 * 1024 * 1024; // 50MB

    if (stats.totalSize > maxTotalSize) {
      await this.cleanupBySize(CACHE_CONFIG.STORES.THUMBNAILS, maxTotalSize * 0.7);
    }
  }

  private async cleanupBySize(store: string, targetSize: number): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([store], 'readwrite');
    const objectStore = transaction.objectStore(store);
    const index = objectStore.index('lastAccessed');
    
    let currentSize = 0;
    
    // Calcula tamanho atual
    const sizeRequest = objectStore.openCursor();
    await new Promise<void>((resolve) => {
      sizeRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          currentSize += cursor.value.size || 0;
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    if (currentSize <= targetSize) return;

    // Remove entradas menos acessadas
    const cleanupRequest = index.openCursor();
    let deletedSize = 0;
    const sizeToDelete = currentSize - targetSize;

    cleanupRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      
      if (cursor && deletedSize < sizeToDelete) {
        deletedSize += cursor.value.size || 0;
        cursor.delete();
        cursor.continue();
      }
    };
  }
}

// Instância singleton
export const smartGalleryCache = new SmartGalleryCache();

// Hook para usar o cache
export const useSmartCache = () => {
  return {
    cache: smartGalleryCache,
    
    // Helpers específicos
    cachePhotos: (filters: GalleryFilters, photos: Photo[], etag?: string) =>
      smartGalleryCache.cachePhotos(filters, photos, etag),
    
    getCachedPhotos: (filters: GalleryFilters) =>
      smartGalleryCache.getCachedPhotos(filters),
    
    cacheImage: (url: string, blob: Blob) =>
      smartGalleryCache.cacheThumbnail(url, blob),
    
    getCachedImage: (url: string) =>
      smartGalleryCache.getCachedThumbnail(url),
    
    getStats: () => smartGalleryCache.getStats(),
    
    optimize: () => smartGalleryCache.optimizeCache()
  };
};

export default smartGalleryCache; 