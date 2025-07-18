import { useEffect, useState } from 'react';
import { MenuCacheWorker } from '@/services/menuCacheWorker';
import { useNetworkStatus } from './useNetworkStatus';

interface CacheStatus {
  supported: boolean;
  apiCacheSize: number;
  imageCacheSize: number;
  totalSize: number;
}

export function useCacheManager() {
  const [cacheWorker, setCacheWorker] = useState<MenuCacheWorker | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    supported: false,
    apiCacheSize: 0,
    imageCacheSize: 0,
    totalSize: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Initialize cache worker
  useEffect(() => {
    let mounted = true;

    const initializeCache = async () => {
      try {
        const worker = await MenuCacheWorker.initialize();
        
        if (mounted) {
          setCacheWorker(worker);
          setIsInitialized(true);
          
          // Get initial cache status
          const status = await worker.getCacheStatus();
          setCacheStatus(status);
        }
      } catch (error) {
        console.error('[CacheManager] Failed to initialize cache worker:', error);
        if (mounted) {
          setIsInitialized(true); // Mark as initialized even if failed
        }
      }
    };

    initializeCache();

    return () => {
      mounted = false;
    };
  }, []);

  // Update cache status periodically
  useEffect(() => {
    if (!cacheWorker || !isInitialized) return;

    const updateCacheStatus = async () => {
      try {
        const status = await cacheWorker.getCacheStatus();
        setCacheStatus(status);
      } catch (error) {
        console.warn('[CacheManager] Failed to update cache status:', error);
      }
    };

    // Update immediately and then every 30 seconds
    updateCacheStatus();
    const interval = setInterval(updateCacheStatus, 30000);

    return () => clearInterval(interval);
  }, [cacheWorker, isInitialized]);

  // Clean cache when going online
  useEffect(() => {
    if (isOnline && cacheWorker) {
      // Clean old cache entries when coming back online
      cacheWorker.cleanOldCache().catch(console.warn);
    }
  }, [isOnline, cacheWorker]);

  // Cache menu data
  const cacheMenuData = async (url: string, data: any, type: 'categories' | 'items' | 'single') => {
    if (!cacheWorker) return;
    
    try {
      await cacheWorker.cacheMenuData({ url, data, type });
    } catch (error) {
      console.warn('[CacheManager] Failed to cache menu data:', error);
    }
  };

  // Get cached data
  const getCachedData = async (url: string) => {
    if (!cacheWorker) return null;
    
    try {
      return await cacheWorker.getCachedData(url);
    } catch (error) {
      console.warn('[CacheManager] Failed to get cached data:', error);
      return null;
    }
  };

  // Cache image
  const cacheImage = async (imageUrl: string) => {
    if (!cacheWorker) return null;
    
    try {
      return await cacheWorker.cacheImage(imageUrl);
    } catch (error) {
      console.warn('[CacheManager] Failed to cache image:', error);
      return null;
    }
  };

  // Preload essential data
  const preloadEssentialData = async () => {
    if (!cacheWorker) return;
    
    try {
      await cacheWorker.preloadEssentialData();
    } catch (error) {
      console.warn('[CacheManager] Failed to preload essential data:', error);
    }
  };

  // Clear all caches
  const clearAllCaches = async () => {
    if (!cacheWorker) return;
    
    try {
      await cacheWorker.clearAllCaches();
      
      // Update status after clearing
      const status = await cacheWorker.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error('[CacheManager] Failed to clear caches:', error);
    }
  };

  // Sync offline orders
  const syncOfflineOrders = async (orders: any[]) => {
    if (!cacheWorker || !isOnline) return [];
    
    try {
      return await cacheWorker.syncOfflineOrders(orders);
    } catch (error) {
      console.error('[CacheManager] Failed to sync offline orders:', error);
      return [];
    }
  };

  return {
    // State
    isInitialized,
    cacheStatus,
    isSupported: cacheStatus.supported,
    
    // Actions
    cacheMenuData,
    getCachedData,
    cacheImage,
    preloadEssentialData,
    clearAllCaches,
    syncOfflineOrders,
    
    // Computed values
    hasCachedData: cacheStatus.totalSize > 0,
    cacheWorker
  };
} 