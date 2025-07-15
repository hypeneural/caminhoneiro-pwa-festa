import axios from '@/lib/axios';
import { PodcastResponse, PodcastFilters } from '@/types/podcast';

const podcastService = {
  getPodcasts: async (filters: PodcastFilters = {}) => {
    try {
      const response = await axios.get<PodcastResponse>('/podcast', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      throw error;
    }
  }
};

export default podcastService;