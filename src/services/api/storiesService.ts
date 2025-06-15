import api from '@/lib/axios';

export interface Story {
  id: string;
  title: string;
  thumbnail: string;
  media: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    duration?: number;
  }>;
  isViewed: boolean;
  isLive: boolean;
  category: 'chegada' | 'bencao' | 'shows' | 'bastidores' | 'publico' | 'procissao';
  createdAt: string;
  expiresAt: string;
  viewCount: number;
}

export const storiesService = {
  // Buscar todos os stories
  getStories: async (): Promise<Story[]> => {
    const response = await api.get('/stories');
    return response.data;
  },

  // Buscar story por ID
  getStoryById: async (id: string): Promise<Story> => {
    const response = await api.get(`/stories/${id}`);
    return response.data;
  },

  // Marcar story como visualizado
  markAsViewed: async (id: string): Promise<void> => {
    await api.post(`/stories/${id}/view`);
  },

  // Buscar stories ao vivo
  getLiveStories: async (): Promise<Story[]> => {
    const response = await api.get('/stories/live');
    return response.data;
  },

  // Buscar stories por categoria
  getStoriesByCategory: async (category: Story['category']): Promise<Story[]> => {
    const response = await api.get(`/stories/category/${category}`);
    return response.data;
  }
};