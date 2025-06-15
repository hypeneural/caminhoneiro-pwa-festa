/**
 * Advanced Cache Management System
 * Intelligent caching with offline-first strategy and background sync
 */

export interface CacheStrategy {
  name: string;
  maxAge: number;
  maxEntries: number;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  backgroundSync?: boolean;
}

export const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  api: {
    name: 'api-cache-v2',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 100,
    strategy: 'network-first',
    backgroundSync: true
  },
  tracker: {
    name: 'tracker-cache-v2',
    maxAge: 30 * 1000, // 30 seconds
    maxEntries: 50,
    strategy: 'network-first',
    backgroundSync: true
  },
  images: {
    name: 'images-cache-v2',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 200,
    strategy: 'cache-first'
  },
  static: {
    name: 'static-cache-v2',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 50,
    strategy: 'cache-first'
  }
};

class AdvancedCacheManager {
  private static instance: AdvancedCacheManager;
  private backgroundSyncQueue: Array<{
    url: string;
    method: string;
    body?: any;
    timestamp: number;
  }> = [];

  static getInstance(): AdvancedCacheManager {
    if (!AdvancedCacheManager.instance) {
      AdvancedCacheManager.instance = new AdvancedCacheManager();
    }
    return AdvancedCacheManager.instance;
  }

  async get(url: string, strategy: CacheStrategy): Promise<Response | null> {
    const cache = await caches.open(strategy.name);
    const cachedResponse = await cache.match(url);

    switch (strategy.strategy) {
      case 'cache-first':
        return cachedResponse || this.fetchAndCache(url, strategy);
      
      case 'network-first':
        try {
          const networkResponse = await this.fetchAndCache(url, strategy);
          return networkResponse;
        } catch {
          return cachedResponse;
        }
      
      case 'stale-while-revalidate':
        if (cachedResponse) {
          // Return cached immediately, update in background
          this.fetchAndCache(url, strategy).catch(console.error);
          return cachedResponse;
        }
        return this.fetchAndCache(url, strategy);
      
      default:
        return cachedResponse;
    }
  }

  private async fetchAndCache(url: string, strategy: CacheStrategy): Promise<Response> {
    const response = await fetch(url);
    
    if (response.ok) {
      const cache = await caches.open(strategy.name);
      await cache.put(url, response.clone());
      
      // Clean up old entries
      await this.enforceQuota(strategy);
    }
    
    return response;
  }

  private async enforceQuota(strategy: CacheStrategy): Promise<void> {
    const cache = await caches.open(strategy.name);
    const keys = await cache.keys();
    
    if (keys.length > strategy.maxEntries) {
      const oldestKeys = keys.slice(0, keys.length - strategy.maxEntries);
      await Promise.all(oldestKeys.map(key => cache.delete(key)));
    }
  }

  // Background sync for failed requests
  addToSyncQueue(url: string, method: string, body?: any): void {
    this.backgroundSyncQueue.push({
      url,
      method,
      body,
      timestamp: Date.now()
    });
    
    localStorage.setItem('backgroundSyncQueue', JSON.stringify(this.backgroundSyncQueue));
  }

  async processSyncQueue(): Promise<void> {
    const queue = JSON.parse(localStorage.getItem('backgroundSyncQueue') || '[]');
    const successfulSyncs: number[] = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      try {
        await fetch(item.url, {
          method: item.method,
          body: item.body ? JSON.stringify(item.body) : undefined,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        successfulSyncs.push(i);
      } catch (error) {
        console.warn('Background sync failed for:', item.url, error);
      }
    }

    // Remove successful syncs from queue
    this.backgroundSyncQueue = queue.filter((_, index) => !successfulSyncs.includes(index));
    localStorage.setItem('backgroundSyncQueue', JSON.stringify(this.backgroundSyncQueue));
  }

  // Smart preloading based on user behavior
  async preloadNextLikelyResource(userBehavior: { currentRoute: string; timeSpent: number }): Promise<void> {
    const preloadMap: Record<string, string[]> = {
      '/': ['/galeria', '/mapa', '/noticias'],
      '/galeria': ['/stories', '/videos'],
      '/mapa': ['/cameras', '/rota-completa'],
      '/noticias': ['/galeria', '/historia']
    };

    const nextLikelyRoutes = preloadMap[userBehavior.currentRoute] || [];
    
    // Preload if user spent more than 3 seconds on current route
    if (userBehavior.timeSpent > 3000) {
      nextLikelyRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }
  }

  // Memory-aware caching
  async checkStorageQuota(): Promise<{ used: number; available: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = estimate.quota || 0;
      const percentage = (used / available) * 100;

      if (percentage > 80) {
        console.warn('🚨 Storage quota almost full, cleaning up...');
        await this.emergencyCleanup();
      }

      return { used, available, percentage };
    }

    return { used: 0, available: 0, percentage: 0 };
  }

  private async emergencyCleanup(): Promise<void> {
    const cacheNames = await caches.keys();
    
    // Delete oldest caches first
    const oldCaches = cacheNames.filter(name => name.includes('v1') || name.includes('old'));
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    
    // Clean up image cache if still needed
    const imageCache = await caches.open(CACHE_STRATEGIES.images.name);
    const imageKeys = await imageCache.keys();
    const oldImages = imageKeys.slice(0, Math.floor(imageKeys.length * 0.3));
    await Promise.all(oldImages.map(key => imageCache.delete(key)));
  }
}

export const cacheManager = AdvancedCacheManager.getInstance();