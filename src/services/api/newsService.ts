import axios from '@/lib/axios';
import { NewsItem, NewsResponse, NewsFilters, NewsCategory, NewsCategoriesResponse } from '@/types/news';
import { API } from '@/constants/api';

const BASE_URL = API.BASE_URL;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Separate cache for different endpoints
let newsCache: Map<string, {
  data: any;
  meta?: any;
  timestamp: number;
}> = new Map();

const generateCacheKey = (endpoint: string, params?: any): string => {
  if (!params) return endpoint;
  const sortedParams = Object.keys(params).sort().reduce((result, key) => {
    result[key] = params[key];
    return result;
  }, {} as any);
  return `${endpoint}_${JSON.stringify(sortedParams)}`;
};

export const newsService = {
  async getNews(filters: NewsFilters = {}) {
    const cacheKey = generateCacheKey('news', filters);
    const cached = newsCache.get(cacheKey);
    
    // Check cache first
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached;
    }

    try {
      // Set default values
      const params = {
        status: 'published',
        limit: 10,
        page: 1,
        sort: 'published_at',
        order: 'DESC',
        ...filters
      };

      const response = await axios.get<NewsResponse>(`${BASE_URL}/v1/news`, {
        params
      });

      const transformedData = {
        data: response.data.data.map(transformNewsItem),
        meta: response.data.meta,
        timestamp: Date.now()
      };

      // Update cache
      newsCache.set(cacheKey, transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching news:', error);
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Using expired cache due to network error');
        return cached;
      }
      throw error;
    }
  },

  async getNewsById(id: string) {
    const cacheKey = generateCacheKey(`news/${id}`);
    const cached = newsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await axios.get<NewsResponse>(`${BASE_URL}/v1/news/${id}`);
      const transformedData = transformNewsItem(response.data.data[0]);
      
      newsCache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching news by id:', error);
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  },

  async getFeaturedNews(): Promise<NewsItem[]> {
    const cacheKey = generateCacheKey('news/featured');
    const cached = newsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await axios.get<NewsResponse>(`${BASE_URL}/v1/news/featured`);
      const transformedData = response.data.data.map(transformNewsItem);
      
      newsCache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching featured news:', error);
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  },

  async getCategories(): Promise<NewsCategory[]> {
    const cacheKey = generateCacheKey('news/categories');
    const cached = newsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await axios.get<NewsCategoriesResponse>(`${BASE_URL}/v1/news/categories`);
      const categoriesData = response.data.data;
      
      newsCache.set(cacheKey, {
        data: categoriesData,
        timestamp: Date.now()
      });
      
      return categoriesData;
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  },

  clearCache() {
    newsCache.clear();
  },

  clearCacheByKey(key: string) {
    newsCache.delete(key);
  }
};

// Transform API response to match our UI model
const transformNewsItem = (item: any): NewsItem => ({
  id: item.id,
  title: item.title,
  slug: item.slug,
  summary: item.summary,
  content: item.content?.trim(),
  imageUrl: item.image_url,
  publishedAt: new Date(item.published_at),
  category: item.category_name,
  categoryColor: item.category_color,
  categoryId: item.category_id,
  author: item.author,
  featured: item.featured === 1,
  status: item.status,
  createdAt: new Date(item.created_at),
  updatedAt: new Date(item.updated_at),
  // Default UI values that might be added later from the API
  views: Math.floor(Math.random() * 1000),
  likes: Math.floor(Math.random() * 100),
  comments: 0,
  tags: [],
  breaking: false,
  trending: false,
  hot: false
});

export default newsService;