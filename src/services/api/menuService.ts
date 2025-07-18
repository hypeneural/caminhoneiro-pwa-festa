import axios from '@/lib/axios';
import { APIResponse, APIMenuItem, APIMenuCategory, MenuQueryParams } from '@/types/menu';
import { cacheService } from '../cacheService';

class MenuService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly BASE_URL = 'https://api.festadoscaminhoneiros.com.br/v1/cardaoui';

  private generateCacheKey(endpoint: string, params?: Record<string, any>): string {
    return `${endpoint}${params ? `?${new URLSearchParams(params).toString()}` : ''}`;
  }

  private shouldUseCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    return cached ? Date.now() - cached.timestamp < this.CACHE_DURATION : false;
  }

  private async fetchWithCache<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(endpoint, params);

    // Check memory cache first
    if (this.shouldUseCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get<APIResponse<T>>(endpoint, { params });
      
      // Validate response
      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error(response.data.message || 'Invalid response from server');
      }

      // Update memory cache
      this.cache.set(cacheKey, {
        data: response.data.data,
        timestamp: Date.now()
      });

      return response.data.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  // Get menu categories with offline support
  async getCategories(): Promise<APIMenuCategory[]> {
    try {
      // Try to fetch from API first
      const data = await this.fetchWithCache<APIMenuCategory[]>(`${this.BASE_URL}/categories`);
      
      // Cache for offline use
      await cacheService.cacheCategories(data);
      
      return data;
    } catch (error) {
      // If offline or API fails, try cache
      const cachedData = await cacheService.getCachedCategories();
      if (cachedData) {
        console.log('Using cached categories (offline mode)');
        return cachedData;
      }
      
      // No cache available, re-throw error
      throw error;
    }
  }

  // Get menu items with filters and offline support
  async getMenuItems(params?: MenuQueryParams): Promise<{
    items: APIMenuItem[];
    meta: { total: number; page: number; limit: number };
  }> {
    const cacheKey = 'menu-items';
    
    try {
      const response = await axios.get<APIResponse<APIMenuItem[]>>(this.BASE_URL, { params });
      
      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error(response.data.message || 'Invalid response from server');
      }

      const result = {
        items: response.data.data,
        meta: {
          total: response.data.meta.total || 0,
          page: response.data.meta.page || 1,
          limit: response.data.meta.limit || 15
        }
      };

      // Cache the items for offline use
      await cacheService.cacheMenuItems(cacheKey, result.items, params);

      return result;
    } catch (error) {
      // If offline or API fails, try cache
      const cachedItems = await cacheService.getCachedMenuItems(cacheKey, params);
      if (cachedItems) {
        console.log('Using cached menu items (offline mode)');
        return {
          items: cachedItems,
          meta: {
            total: cachedItems.length,
            page: 1,
            limit: cachedItems.length
          }
        };
      }
      
      // No cache available, re-throw error
      throw error;
    }
  }

  // Get single menu item with offline support
  async getMenuItem(id: number | string): Promise<APIMenuItem> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    
    try {
      const data = await this.fetchWithCache<APIMenuItem>(`${this.BASE_URL}/${id}`);
      
      // Cache for offline use
      await cacheService.cacheSingleItem(numericId, data);
      
      return data;
    } catch (error) {
      // If offline or API fails, try cache
      const cachedItem = await cacheService.getCachedSingleItem(numericId);
      if (cachedItem) {
        console.log('Using cached menu item (offline mode)');
        return cachedItem;
      }
      
      // No cache available, re-throw error
      throw error;
    }
  }

  // Preload essential data for offline use
  async preloadEssentialData(): Promise<void> {
    try {
      console.log('Preloading essential menu data...');
      
      // Preload categories
      await this.getCategories();
      
      // Preload first page of menu items
      await this.getMenuItems({ limit: 20, page: 1 });
      
      console.log('Essential menu data preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload essential data:', error);
    }
  }

  // Check cache status
  async getCacheStatus(): Promise<{
    hasCache: boolean;
    cacheSize: number;
    isNearLimit: boolean;
  }> {
    const cacheSize = await cacheService.getCacheSize();
    const isNearLimit = await cacheService.isCacheNearLimit();
    
    return {
      hasCache: cacheSize > 0,
      cacheSize,
      isNearLimit
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    cacheService.clearAllCache();
  }

  // Clear specific cache entry
  clearCacheEntry(endpoint: string, params?: Record<string, any>): void {
    const cacheKey = this.generateCacheKey(endpoint, params);
    this.cache.delete(cacheKey);
  }
}

export const menuService = new MenuService(); 