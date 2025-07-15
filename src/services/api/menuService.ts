import axios from '@/lib/axios';
import { API } from '@/constants/api';

// Response types
interface APIResponse<T> {
  status: 'success' | 'error';
  message: string | null;
  meta: {
    total?: number;
    page?: number;
    limit?: number;
  };
  data: T;
}

// API types
export interface APIMenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  created_at: string;
  category_id: number;
  category_name: string;
  icon_url: string;
  is_available?: number;
}

export interface APIMenuCategory {
  id: number;
  name: string;
  icon_url: string;
}

// Parameters type
export interface MenuQueryParams {
  search?: string;
  category?: number;
  min_price?: number;
  max_price?: number;
  sort?: 'price';
  order?: 'ASC' | 'DESC';
  limit?: number;
  page?: number;
}

class MenuService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly BASE_URL = '/cardaoui';

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

    // Check cache first
    if (this.shouldUseCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const response = await axios.get<APIResponse<T>>(endpoint, { params });
      
      // Validate response
      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error(response.data.message || 'Invalid response from server');
      }

      // Update cache
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

  // Get menu categories
  async getCategories(): Promise<APIMenuCategory[]> {
    return this.fetchWithCache<APIMenuCategory[]>(`${this.BASE_URL}/categories`);
  }

  // Get menu items with filters
  async getMenuItems(params?: MenuQueryParams): Promise<{
    items: APIMenuItem[];
    meta: { total: number; page: number; limit: number };
  }> {
    const response = await axios.get<APIResponse<APIMenuItem[]>>(this.BASE_URL, { params });
    
    if (response.data.status !== 'success' || !response.data.data) {
      throw new Error(response.data.message || 'Invalid response from server');
    }

    return {
      items: response.data.data,
      meta: {
        total: response.data.meta.total || 0,
        page: response.data.meta.page || 1,
        limit: response.data.meta.limit || 25
      }
    };
  }

  // Get single menu item
  async getMenuItem(id: number | string): Promise<APIMenuItem> {
    return this.fetchWithCache<APIMenuItem>(`${this.BASE_URL}/${id}`);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(endpoint: string, params?: Record<string, any>): void {
    const cacheKey = this.generateCacheKey(endpoint, params);
    this.cache.delete(cacheKey);
  }
}

export const menuService = new MenuService(); 