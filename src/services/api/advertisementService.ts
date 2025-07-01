import axios from '@/lib/axios';
import { API } from '@/constants/api';
import { BannerResponse, SponsorResponse } from '@/types/sponsors';

interface BannerParams {
  position_group?: string;
  limit?: number;
  page?: number;
}

interface SponsorParams {
  active?: boolean;
  limit?: number;
  page?: number;
}

export const advertisementService = {
  async getBanners(params: BannerParams = {}): Promise<BannerResponse> {
    console.log('📢 getBanners: Requesting banners with params:', params);
    
    try {
      const response = await axios.get(API.ENDPOINTS.BANNERS, {
        params: {
          position_group: params.position_group || API.POSITION_GROUPS.HOME,
          limit: params.limit || API.DEFAULTS.BANNERS_LIMIT,
          page: params.page || API.DEFAULTS.PAGE
        }
      });

      console.log('✅ getBanners: Received', response.data.data?.length || 0, 'banners');
      
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.error('❌ getBanners: Invalid response format:', response.data);
        throw new Error('Invalid banner response format');
      }

      // Valida e ajusta as posições dos banners
      response.data.data = response.data.data.map(banner => ({
        ...banner,
        position: banner.position || 1,
        priority: banner.priority || 0
      })).filter(banner => banner.position >= 1 && banner.position <= 8);

      return response.data;
    } catch (error) {
      console.error('❌ getBanners: Error fetching banners:', error);
      throw error;
    }
  },

  async getSponsors(params: SponsorParams = {}): Promise<SponsorResponse> {
    console.log('📞 getSponsors: Making API request with params:', params);
    
    try {
      const response = await axios.get(API.ENDPOINTS.SPONSORS, {
        params: {
          active: 1,
          limit: params.limit || API.DEFAULTS.SPONSORS_LIMIT,
          page: params.page || API.DEFAULTS.PAGE
        }
      });
      
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.error('❌ getSponsors: Invalid response format:', response.data);
        throw new Error('Invalid sponsor response format');
      }
      
      console.log('✅ getSponsors: Received', response.data.data.length, 'sponsors');
      return response.data;
    } catch (error) {
      console.error('❌ getSponsors: Error fetching sponsors:', error);
      throw error;
    }
  }
}; 