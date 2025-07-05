import axios from '@/lib/axios';
import { NewsItem, NewsResponse } from '@/types/news';
import { API } from '@/constants/api';

const BASE_URL = API.BASE_URL;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

let newsCache: {
  data: NewsItem[];
  meta: any;
  timestamp: number;
} | null = null;

export const newsService = {
  async getNews(limit: number = 5) {
    // Check cache first
    if (newsCache && Date.now() - newsCache.timestamp < CACHE_DURATION) {
      return newsCache;
    }

    try {
      const response = await axios.get<NewsResponse>(`${BASE_URL}/news`, {
        params: { limit }
      });

      const transformedData = {
        data: response.data.data.map(transformNewsItem),
        meta: response.data.meta,
        timestamp: Date.now()
      };

      // Update cache
      newsCache = transformedData;
      return transformedData;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  },

  clearCache() {
    newsCache = null;
  },

  async getNewsById(id: string) {
    try {
      const response = await axios.get<NewsResponse>(`${BASE_URL}/news/${id}`);
      return transformNewsItem(response.data.data[0]);
    } catch (error) {
      console.error('Error fetching news by id:', error);
      throw error;
    }
  },

  // Buscar notícias em destaque
  getFeaturedNews: async (): Promise<NewsItem[]> => {
    const response = await axios.get('/news/featured');
    return response.data;
  },

  // Buscar notícias por categoria
  getNewsByCategory: async (category: string): Promise<NewsItem[]> => {
    const response = await axios.get(`/news/category/${category}`);
    return response.data;
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