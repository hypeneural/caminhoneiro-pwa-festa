import axios from '@/lib/axios';
import { PodcastItem, PodcastResponse, PodcastFilters } from '@/types/podcast';
import { API } from '@/constants/api';

const BASE_URL = API.BASE_URL;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

let podcastCache: Map<string, {
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

export const podcastService = {
  async getPodcasts(filters: PodcastFilters = {}) {
    const cacheKey = generateCacheKey('podcast', filters);
    const cached = podcastCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }

    try {
      const params = {
        limit: 10,
        page: 1,
        sort: 'created_at',
        order: 'DESC',
        ...filters
      };

      const response = await axios.get<PodcastResponse>(`${BASE_URL}/podcast`, {
        params,
        timeout: 10000
      });

      const transformedData = {
        data: response.data.data.map(transformPodcastItem),
        meta: response.data.meta,
        timestamp: Date.now()
      };

      podcastCache.set(cacheKey, transformedData);
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching podcasts:', error);
      
      if (cached) {
        console.warn('Using expired cache due to network error');
        return cached;
      }
      
      const fallbackData = {
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
        timestamp: Date.now(),
        error: error.response?.status === 404 ? 'Endpoint não encontrado' : 'Erro de conexão'
      };
      
      podcastCache.set(cacheKey, fallbackData);
      return fallbackData;
    }
  },

  async getPodcastById(id: string) {
    const cacheKey = generateCacheKey(`podcast/${id}`);
    const cached = podcastCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await axios.get<PodcastResponse>(`${BASE_URL}/podcast/${id}`, {
        timeout: 10000
      });
      
      const transformedData = transformPodcastItem(response.data.data[0]);
      
      podcastCache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });
      
      return transformedData;
    } catch (error: any) {
      console.error('Error fetching podcast by id:', error);
      if (cached) {
        return cached.data;
      }
      return null;
    }
  },

  clearCache() {
    podcastCache.clear();
  }
};

const transformPodcastItem = (item: any): PodcastItem => ({
  id: item.id,
  title: item.title,
  description: item.description,
  thumb_url: item.thumb_url,
  created_at: item.created_at
});

export default podcastService;