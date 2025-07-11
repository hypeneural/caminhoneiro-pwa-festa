import axios from '@/lib/axios';
import { ShortsResponse, ShortsQueryParams } from '@/types/shorts';
import { API } from '@/constants/api';

const BASE_URL = API.BASE_URL;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

let shortsCache: Map<string, {
  data: any;
  meta?: any;
  timestamp: number;
  error?: string;
}> = new Map();

export const shortsService = {
  /**
   * Lista todos os shorts com parâmetros opcionais
   */
  getShorts: async (params?: ShortsQueryParams): Promise<ShortsResponse> => {
    const cacheKey = `shorts-${JSON.stringify(params || {})}`;
    const cached = shortsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (cached.error) {
        throw new Error(cached.error);
      }
      return { 
        status: 'success', 
        message: 'Shorts listados com sucesso.',
        data: cached.data,
        meta: cached.meta || { total: cached.data.length, page: 1, limit: 25 }
      };
    }

    try {
      const searchParams = new URLSearchParams();
      
      if (params?.search) searchParams.append('search', params.search);
      if (params?.date_from) searchParams.append('date_from', params.date_from);
      if (params?.date_to) searchParams.append('date_to', params.date_to);
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.sort) searchParams.append('sort', params.sort);
      if (params?.order) searchParams.append('order', params.order);

      const url = `${BASE_URL}/v1/shorts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      
      const response = await axios.get<ShortsResponse>(url);
      
      shortsCache.set(cacheKey, {
        data: response.data.data,
        meta: response.data.meta,
        timestamp: Date.now()
      });
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar shorts';
      
      shortsCache.set(cacheKey, {
        data: [],
        timestamp: Date.now(),
        error: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Busca um short específico pelo ID
   */
  getShortById: async (id: string): Promise<ShortsResponse> => {
    const cacheKey = `short-${id}`;
    const cached = shortsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (cached.error) {
        throw new Error(cached.error);
      }
      return { 
        status: 'success', 
        message: 'Short encontrado com sucesso.',
        data: cached.data,
        meta: { total: 1, page: 1, limit: 1 }
      };
    }

    try {
      const response = await axios.get<ShortsResponse>(`${BASE_URL}/v1/shorts/${id}`);
      
      shortsCache.set(cacheKey, {
        data: response.data.data,
        meta: response.data.meta,
        timestamp: Date.now()
      });
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar short';
      
      shortsCache.set(cacheKey, {
        data: [],
        timestamp: Date.now(),
        error: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  }
};