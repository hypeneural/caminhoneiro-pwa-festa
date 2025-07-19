import api from '@/lib/axios';

export interface ApiBanner {
  id: number;
  title: string;
  description: string | null;
  imageUrlWebp: string;
  imageUrl: string;
  linkUrl: string;
  target: '_blank' | '_self';
  priority: number;
}

export interface ApiSponsor {
  id: number;
  companyName: string;
  logoUrlWebp: string;
  logoUrl: string;
  websiteUrl: string;
  packageType: 1 | 2;
  priority: number;
}

export interface BannerApiResponse {
  status: string;
  message: string;
  meta: {
    total_registros_filtrados: number;
    pagina_atual: number;
    registros_por_pagina: number;
    total_paginas: number;
    filtros_aplicados: Record<string, string>;
    links: {
      self: string;
      proxima_pagina?: string;
    };
  };
  data: ApiBanner[];
}

export interface SponsorApiResponse {
  status: string;
  message: string;
  meta: {
    total_registros_filtrados: number;
    pagina_atual: number;
    registros_por_pagina: number;
    total_paginas: number;
    filtros_aplicados: Record<string, string>;
    links: {
      self: string;
      proxima_pagina?: string;
    };
  };
  data: ApiSponsor[];
}

class BannerService {
  /**
   * Busca banners da API
   * @param positionGroup - Grupo de posição (home, gallery, lightbox)
   * @param limit - Limite de resultados
   * @param page - Página
   */
  async getBanners(
    positionGroup: string = 'home',
    limit: number = 30,
    page: number = 1
  ): Promise<BannerApiResponse> {
    try {
      const response = await api.get<BannerApiResponse>('/advertisements/banners', {
        params: {
          position_group: positionGroup,
          limit,
          page
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar banners:', error);
      throw error;
    }
  }

  /**
   * Busca sponsors da API
   * @param active - Filtrar apenas ativos
   * @param limit - Limite de resultados
   * @param page - Página
   */
  async getSponsors(
    active: boolean = true,
    limit: number = 50,
    page: number = 1
  ): Promise<SponsorApiResponse> {
    try {
      const response = await api.get<SponsorApiResponse>('/advertisements/sponsors', {
        params: {
          active: active ? 1 : 0,
          limit,
          page
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar sponsors:', error);
      throw error;
    }
  }

  /**
   * Busca todos os banners (todas as páginas)
   */
  async getAllBanners(positionGroup: string = 'home'): Promise<ApiBanner[]> {
    const allBanners: ApiBanner[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        const response = await this.getBanners(positionGroup, 30, currentPage);
        allBanners.push(...response.data);
        
        hasMorePages = response.meta.pagina_atual < response.meta.total_paginas;
        currentPage++;
      } catch (error) {
        console.error(`❌ Erro na página ${currentPage}:`, error);
        hasMorePages = false;
      }
    }

    return allBanners;
  }

  /**
   * Busca todos os sponsors (todas as páginas)
   */
  async getAllSponsors(): Promise<ApiSponsor[]> {
    const allSponsors: ApiSponsor[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        const response = await this.getSponsors(true, 50, currentPage);
        allSponsors.push(...response.data);
        
        hasMorePages = response.meta.pagina_atual < response.meta.total_paginas;
        currentPage++;
      } catch (error) {
        console.error(`❌ Erro na página ${currentPage}:`, error);
        hasMorePages = false;
      }
    }

    return allSponsors;
  }
}

export const bannerService = new BannerService(); 