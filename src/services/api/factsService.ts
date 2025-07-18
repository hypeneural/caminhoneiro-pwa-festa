import axios from '@/lib/axios';
import { Fact, FactResponse, FactFilters, FactCategory, FactCategoriesResponse } from '@/types/facts';
import { API } from '@/constants/api';

const BASE_URL = API.BASE_URL;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Cache for different endpoints
let factsCache: Map<string, {
  data: any;
  meta?: any;
  timestamp: number;
  error?: string;
}> = new Map();

const generateCacheKey = (endpoint: string, params?: any): string => {
  if (!params) return endpoint;
  const sortedParams = Object.keys(params).sort().reduce((result, key) => {
    result[key] = params[key];
    return result;
  }, {} as any);
  return `${endpoint}_${JSON.stringify(sortedParams)}`;
};

export const factsService = {
  async getFacts(filters: FactFilters = {}) {
    const cacheKey = generateCacheKey('facts', filters);
    const cached = factsCache.get(cacheKey);
    
    // Check cache first
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }

    try {
      // Set default values
      const params = {
        limit: 25,
        page: 1,
        sort: 'created_at',
        order: 'DESC',
        ...filters
      };

      console.log('Fetching facts with URL:', `${BASE_URL}/facts`);
      
      const response = await axios.get<FactResponse>(`${BASE_URL}/facts`, {
        params,
        timeout: 10000 // 10 seconds timeout
      });

      const transformedData = {
        data: response.data.data,
        meta: response.data.meta,
        timestamp: Date.now()
      };

      // Update cache
      factsCache.set(cacheKey, transformedData);
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching facts:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Using expired cache due to network error');
        return cached;
      }
      
      // Return empty data structure instead of throwing
      const fallbackData = {
        data: [],
        meta: { total: 0, page: 1, limit: 25 },
        timestamp: Date.now(),
        error: error.response?.status === 404 ? 'Endpoint não encontrado' : 'Erro de conexão'
      };
      
      // Cache the error response briefly to prevent repeated requests
      factsCache.set(cacheKey, fallbackData);
      return fallbackData;
    }
  },

  async getFactById(id: string | number) {
    const cacheKey = generateCacheKey(`facts/${id}`);
    const cached = factsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await axios.get<FactResponse>(`${BASE_URL}/facts/${id}`, {
        timeout: 10000
      });
      
      const transformedData = response.data.data[0] || response.data.data;
      
      factsCache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });
      
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching fact by id:', error);
      if (cached) {
        return cached.data;
      }
      
      return null;
    }
  },

  async getCategories(): Promise<FactCategory[]> {
    const cacheKey = generateCacheKey('facts/categories');
    const cached = factsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await axios.get<FactCategoriesResponse>(`${BASE_URL}/facts/categories`, {
        timeout: 10000
      });
      const categoriesData = response.data.data;
      
      factsCache.set(cacheKey, {
        data: categoriesData,
        timestamp: Date.now()
      });
      
      return categoriesData;
    } catch (error: any) {
      console.error('Error fetching fact categories:', error);
      if (cached) {
        return cached.data;
      }
      
      // Return default categories to prevent UI breaks
      return [
        { id: 1, name: 'Geral', icon: 'fa-solid fa-circle-info' }
      ];
    }
  },

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${BASE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}; 