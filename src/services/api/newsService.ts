import api from '@/lib/axios';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: string;
  publishedAt: string;
  author: string;
  featured: boolean;
}

export const newsService = {
  // Buscar todas as notícias
  getNews: async (params?: { 
    page?: number; 
    limit?: number; 
    category?: string; 
    featured?: boolean 
  }): Promise<{ data: NewsItem[]; total: number }> => {
    const response = await api.get('/news', { params });
    return response.data;
  },

  // Buscar notícia por ID
  getNewsById: async (id: string): Promise<NewsItem> => {
    const response = await api.get(`/news/${id}`);
    return response.data;
  },

  // Buscar notícias em destaque
  getFeaturedNews: async (): Promise<NewsItem[]> => {
    const response = await api.get('/news/featured');
    return response.data;
  },

  // Buscar notícias por categoria
  getNewsByCategory: async (category: string): Promise<NewsItem[]> => {
    const response = await api.get(`/news/category/${category}`);
    return response.data;
  }
};