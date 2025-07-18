// Menu Cache Service Integration
// This module provides offline-first caching for menu data

interface CacheStrategyOptions {
  cacheName: string;
  maxAge: number;
  maxEntries: number;
}

class MenuCacheWorker {
  private readonly API_CACHE_NAME = 'menu-api-v1';
  private readonly STATIC_CACHE_NAME = 'menu-static-v1';
  private readonly IMAGE_CACHE_NAME = 'menu-images-v1';
  
  private readonly CACHE_STRATEGIES = {
    api: {
      cacheName: this.API_CACHE_NAME,
      maxAge: 30 * 60 * 1000, // 30 minutes
      maxEntries: 100
    },
    images: {
      cacheName: this.IMAGE_CACHE_NAME,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 200
    },
    static: {
      cacheName: this.STATIC_CACHE_NAME,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxEntries: 50
    }
  };

  // Cache menu data with network-first strategy
  async cacheMenuData(data: { url: string; data: any; type: 'categories' | 'items' | 'single' }) {
    try {
      if (!('caches' in window)) {
        console.warn('[MenuCache] Cache API not supported');
        return;
      }

      const cache = await caches.open(this.API_CACHE_NAME);
      const response = new Response(JSON.stringify({
        data: data.data,
        timestamp: Date.now(),
        type: data.type
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=1800' // 30 minutes
        }
      });

      await cache.put(data.url, response);
      console.log(`[MenuCache] Cached ${data.type} data:`, data.url);
    } catch (error) {
      console.error('[MenuCache] Failed to cache menu data:', error);
    }
  }

  // Cache images with cache-first strategy
  async cacheImage(imageUrl: string): Promise<Response | null> {
    try {
      if (!('caches' in window)) {
        return null;
      }

      const cache = await caches.open(this.IMAGE_CACHE_NAME);
      
      // Check cache first
      const cachedResponse = await cache.match(imageUrl);
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network
      try {
        const networkResponse = await fetch(imageUrl);
        if (networkResponse.ok) {
          // Cache the response
          await cache.put(imageUrl, networkResponse.clone());
          return networkResponse;
        }
      } catch (networkError) {
        console.warn('[MenuCache] Network fetch failed for image:', imageUrl);
      }

      return null;
    } catch (error) {
      console.error('[MenuCache] Failed to cache image:', error);
      return null;
    }
  }

  // Get cached data with fallback
  async getCachedData(url: string): Promise<any | null> {
    try {
      if (!('caches' in window)) {
        return null;
      }

      const cache = await caches.open(this.API_CACHE_NAME);
      const response = await cache.match(url);
      
      if (!response) return null;

      const data = await response.json();
      
      // Check if cache is still valid
      const isExpired = Date.now() - data.timestamp > this.CACHE_STRATEGIES.api.maxAge;
      if (isExpired) {
        await cache.delete(url);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('[MenuCache] Failed to get cached data:', error);
      return null;
    }
  }

  // Preload essential data for offline use
  async preloadEssentialData() {
    const baseUrl = 'https://api.festadoscaminhoneiros.com.br/v1/cardaoui';
    
    try {
      // Preload categories
      await this.fetchAndCache(`${baseUrl}/categories`, 'categories');
      
      // Preload first page of menu items
      await this.fetchAndCache(`${baseUrl}?limit=20&page=1`, 'items');
      
      console.log('[MenuCache] Essential data preloaded successfully');
    } catch (error) {
      console.warn('[MenuCache] Failed to preload essential data:', error);
    }
  }

  private async fetchAndCache(url: string, type: 'categories' | 'items' | 'single') {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        await this.cacheMenuData({ url, data, type });
      }
    } catch (error) {
      console.warn(`[MenuCache] Failed to fetch and cache ${type}:`, error);
    }
  }

  // Clean old cache entries
  async cleanOldCache() {
    if (!('caches' in window)) {
      return;
    }

    for (const strategy of Object.values(this.CACHE_STRATEGIES)) {
      try {
        const cache = await caches.open(strategy.cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const data = await response.json().catch(() => null);
            
            if (data && data.timestamp) {
              const isExpired = Date.now() - data.timestamp > strategy.maxAge;
              if (isExpired) {
                await cache.delete(request);
              }
            }
          }
        }
        
        // Limit cache size
        const remainingRequests = await cache.keys();
        if (remainingRequests.length > strategy.maxEntries) {
          const excessCount = remainingRequests.length - strategy.maxEntries;
          for (let i = 0; i < excessCount; i++) {
            await cache.delete(remainingRequests[i]);
          }
        }
      } catch (error) {
        console.error(`[MenuCache] Failed to clean cache ${strategy.cacheName}:`, error);
      }
    }
  }

  // Sync offline orders when back online
  async syncOfflineOrders(orders: any[]) {
    const syncPromises = orders.map(async (order) => {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order)
        });

        if (response.ok) {
          console.log('[MenuCache] Order synced successfully:', order.id);
          return { success: true, orderId: order.id };
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('[MenuCache] Failed to sync order:', order.id, error);
        return { success: false, orderId: order.id, error };
      }
    });

    const results = await Promise.allSettled(syncPromises);
    return results;
  }

  // Check if caching is supported
  isSupported(): boolean {
    return 'caches' in window && 'serviceWorker' in navigator;
  }

  // Get cache status
  async getCacheStatus() {
    if (!this.isSupported()) {
      return {
        supported: false,
        apiCacheSize: 0,
        imageCacheSize: 0,
        totalSize: 0
      };
    }

    try {
      const [apiCache, imageCache] = await Promise.all([
        caches.open(this.API_CACHE_NAME),
        caches.open(this.IMAGE_CACHE_NAME)
      ]);

      const [apiKeys, imageKeys] = await Promise.all([
        apiCache.keys(),
        imageCache.keys()
      ]);

      return {
        supported: true,
        apiCacheSize: apiKeys.length,
        imageCacheSize: imageKeys.length,
        totalSize: apiKeys.length + imageKeys.length
      };
    } catch (error) {
      console.error('[MenuCache] Failed to get cache status:', error);
      return {
        supported: true,
        apiCacheSize: 0,
        imageCacheSize: 0,
        totalSize: 0
      };
    }
  }

  // Initialize the cache worker
  static async initialize() {
    const worker = new MenuCacheWorker();
    
    // Clean old cache on startup
    await worker.cleanOldCache();
    
    // Preload essential data if supported
    if (worker.isSupported()) {
      setTimeout(() => {
        worker.preloadEssentialData().catch(console.warn);
      }, 2000); // Delay to not block initial page load
    }
    
    return worker;
  }

  // Clear all menu caches
  async clearAllCaches() {
    if (!this.isSupported()) return;

    try {
      await Promise.all([
        caches.delete(this.API_CACHE_NAME),
        caches.delete(this.IMAGE_CACHE_NAME),
        caches.delete(this.STATIC_CACHE_NAME)
      ]);
      
      console.log('[MenuCache] All caches cleared successfully');
    } catch (error) {
      console.error('[MenuCache] Failed to clear caches:', error);
    }
  }
}

export { MenuCacheWorker }; 