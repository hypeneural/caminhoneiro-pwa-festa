import { CacheEntry, APIMenuItem, APIMenuCategory } from '@/types/menu';

interface DBSchema {
  menuItems: {
    key: string;
    value: CacheEntry<APIMenuItem[]>;
  };
  categories: {
    key: string;
    value: CacheEntry<APIMenuCategory[]>;
  };
  singleItems: {
    key: number;
    value: CacheEntry<APIMenuItem>;
  };
}

class CacheService {
  private dbName = 'menu-cache-db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CACHE_VERSION = '1.0.0';

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening cache database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('menuItems')) {
          db.createObjectStore('menuItems', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('singleItems')) {
          db.createObjectStore('singleItems', { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  private generateCacheKey(endpoint: string, params?: Record<string, any>): string {
    const baseKey = endpoint.replace(/^\/+|\/+$/g, '');
    if (!params) return baseKey;
    
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${baseKey}?${new URLSearchParams(sortedParams).toString()}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.CACHE_DURATION;
  }

  private isVersionValid(entry: CacheEntry<any>): boolean {
    return entry.version === this.CACHE_VERSION;
  }

  // Cache menu items
  async cacheMenuItems(
    key: string, 
    data: APIMenuItem[], 
    params?: Record<string, any>
  ): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['menuItems'], 'readwrite');
      const store = transaction.objectStore('menuItems');

      const cacheKey = this.generateCacheKey(key, params);
      const entry: CacheEntry<APIMenuItem[]> = {
        key: cacheKey,
        data,
        timestamp: Date.now(),
        version: this.CACHE_VERSION
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Clean old entries to manage storage
      await this.cleanOldEntries('menuItems');
    } catch (error) {
      console.warn('Failed to cache menu items:', error);
    }
  }

  // Get cached menu items
  async getCachedMenuItems(
    key: string, 
    params?: Record<string, any>
  ): Promise<APIMenuItem[] | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['menuItems'], 'readonly');
      const store = transaction.objectStore('menuItems');

      const cacheKey = this.generateCacheKey(key, params);
      
      return new Promise<APIMenuItem[] | null>((resolve, reject) => {
        const request = store.get(cacheKey);
        
        request.onsuccess = () => {
          const entry = request.result as CacheEntry<APIMenuItem[]> | undefined;
          
          if (!entry) {
            resolve(null);
            return;
          }

          if (this.isExpired(entry) || !this.isVersionValid(entry)) {
            // Remove expired entry
            this.removeCacheEntry('menuItems', cacheKey);
            resolve(null);
            return;
          }

          resolve(entry.data);
        };
        
        request.onerror = () => {
          console.warn('Failed to get cached menu items:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('Failed to get cached menu items:', error);
      return null;
    }
  }

  // Cache categories
  async cacheCategories(data: APIMenuCategory[]): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['categories'], 'readwrite');
      const store = transaction.objectStore('categories');

      const entry: CacheEntry<APIMenuCategory[]> = {
        key: 'categories',
        data,
        timestamp: Date.now(),
        version: this.CACHE_VERSION
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to cache categories:', error);
    }
  }

  // Get cached categories
  async getCachedCategories(): Promise<APIMenuCategory[] | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['categories'], 'readonly');
      const store = transaction.objectStore('categories');

      return new Promise<APIMenuCategory[] | null>((resolve, reject) => {
        const request = store.get('categories');
        
        request.onsuccess = () => {
          const entry = request.result as CacheEntry<APIMenuCategory[]> | undefined;
          
          if (!entry) {
            resolve(null);
            return;
          }

          if (this.isExpired(entry) || !this.isVersionValid(entry)) {
            this.removeCacheEntry('categories', 'categories');
            resolve(null);
            return;
          }

          resolve(entry.data);
        };
        
        request.onerror = () => {
          console.warn('Failed to get cached categories:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('Failed to get cached categories:', error);
      return null;
    }
  }

  // Cache single menu item
  async cacheSingleItem(id: number, data: APIMenuItem): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['singleItems'], 'readwrite');
      const store = transaction.objectStore('singleItems');

      const entry: CacheEntry<APIMenuItem> = {
        key: id.toString(),
        data,
        timestamp: Date.now(),
        version: this.CACHE_VERSION
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put({ ...entry, key: id });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to cache single item:', error);
    }
  }

  // Get cached single menu item
  async getCachedSingleItem(id: number): Promise<APIMenuItem | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['singleItems'], 'readonly');
      const store = transaction.objectStore('singleItems');

      return new Promise<APIMenuItem | null>((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = () => {
          const entry = request.result as CacheEntry<APIMenuItem> | undefined;
          
          if (!entry) {
            resolve(null);
            return;
          }

          if (this.isExpired(entry) || !this.isVersionValid(entry)) {
            this.removeCacheEntry('singleItems', id);
            resolve(null);
            return;
          }

          resolve(entry.data);
        };
        
        request.onerror = () => {
          console.warn('Failed to get cached single item:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('Failed to get cached single item:', error);
      return null;
    }
  }

  // Remove specific cache entry
  private async removeCacheEntry(
    storeName: keyof DBSchema, 
    key: string | number
  ): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`Failed to remove cache entry from ${storeName}:`, error);
    }
  }

  // Clean old entries to manage storage size
  private async cleanOldEntries(storeName: keyof DBSchema): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.openCursor();
      const entriesToDelete: (string | number)[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry<any>;
          
          if (this.isExpired(entry) || !this.isVersionValid(entry)) {
            entriesToDelete.push(cursor.key);
          }
          
          cursor.continue();
        } else {
          // Delete expired entries
          entriesToDelete.forEach(key => {
            store.delete(key);
          });
        }
      };
    } catch (error) {
      console.warn(`Failed to clean old entries from ${storeName}:`, error);
    }
  }

  // Clear all cache
  async clearAllCache(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['menuItems', 'categories', 'singleItems'], 'readwrite');
      
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('menuItems').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('categories').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('singleItems').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      ]);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Get cache size estimate
  async getCacheSize(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
    } catch (error) {
      console.warn('Failed to get cache size:', error);
    }
    return 0;
  }

  // Check if cache is approaching limit
  async isCacheNearLimit(): Promise<boolean> {
    const currentSize = await this.getCacheSize();
    return currentSize > (this.MAX_CACHE_SIZE * 0.8); // 80% of limit
  }

  // Preload essential data
  async preloadEssentialData(): Promise<void> {
    try {
      // This would be called by the service worker to preload key data
      console.log('Preloading essential menu data for offline use...');
      
      // The actual preloading logic would be implemented here
      // when the service worker is updated
    } catch (error) {
      console.warn('Failed to preload essential data:', error);
    }
  }
}

export const cacheService = new CacheService(); 