import { useState, useEffect } from 'react';
import { advertisementService } from '@/services/api/advertisementService';
import { Banner, SponsorLogo } from '@/types/sponsors';
import { API } from '@/constants/api';
import { mockSponsorsData } from '@/data/sponsorsData';
import { selectSafeImageSrc } from '@/lib/image-safety';

interface UseAdvertisementsOptions {
  enabled?: boolean;
  position?: string;
  bannersLimit?: number;
  sponsorsLimit?: number;
}

interface UseAdvertisementsReturn {
  banners: Banner[];
  activeBanners: Banner[];
  bannersByPosition: Record<number, Banner[]>;
  sponsors: SponsorLogo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMoreBanners: boolean;
  hasMoreSponsors: boolean;
  loadMoreBanners: () => Promise<void>;
  loadMoreSponsors: () => Promise<void>;
}

// Mock banners usando dados reais da API
const createMockBanners = (position: string): Banner[] => {
  const realBanners = [
    {
      id: 11,
      title: "Tyuco Imóveis",
      description: "",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/tyuco-banner.webp",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/tyuco-banner.jpg",
      linkUrl: "https://www.instagram.com/tyucoimoveis/",
      target: "_blank" as const,
      priority: 1,
      position: 1,
      altText: "Banner Tyuco Imóveis",
      isActive: true
    },
    {
      id: 26,
      title: "Altos de Santa Helena - Terraza",
      description: null,
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/terraza-banner.webp",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/terraza-banner.jpg",
      linkUrl: "https://www.instagram.com/terrazaurbanismo/",
      target: "_blank" as const,
      priority: 1,
      position: 2,
      altText: "Banner Terraza",
      isActive: true
    },
    {
      id: 51,
      title: "CC Seguros",
      description: null,
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/cc-banner.webp",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/cc-banner.jpg",
      linkUrl: "https://www.instagram.com/ccsegurosoficial/",
      target: "_blank" as const,
      priority: 1,
      position: 3,
      altText: "Banner CC Seguros",
      isActive: true
    },
    {
      id: 14,
      title: "Lupel",
      description: "",
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/lupel-banner.webp",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/lupel-banner.jpg",
      linkUrl: "https://www.instagram.com/lupel.com.br/",
      target: "_blank" as const,
      priority: 1,
      position: 4,
      altText: "Banner Lupel",
      isActive: true
    },
    {
      id: 33,
      title: "Mais Net",
      description: null,
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/mais-net-banner.webp",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/mais-net-banner.jpg",
      linkUrl: "https://www.instagram.com/internetmaisnet/",
      target: "_blank" as const,
      priority: 1,
      position: 5,
      altText: "Banner Mais Net",
      isActive: true
    },
    {
      id: 40,
      title: "R&S TELECOM | Unifique",
      description: null,
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/res-banner.webp",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/res-banner.jpg",
      linkUrl: "https://www.instagram.com/rstelecom.unif/",
      target: "_blank" as const,
      priority: 1,
      position: 6,
      altText: "Banner R&S TELECOM",
      isActive: true
    },
    {
      id: 48,
      title: "Ação Logistica",
      description: null,
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/acao-banner.webp",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/acao-banner.jpg",
      linkUrl: "https://www.instagram.com/acao_logistica/",
      target: "_blank" as const,
      priority: 1,
      position: 7,
      altText: "Banner Ação Logística",
      isActive: true
    },
    {
      id: 20,
      title: "BST Caminhões",
      description: null,
      imageUrlWebp: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/webp/bst-banner.webp",
      imageUrl: "https://festadoscaminhoneiros.com.br/assets/images/advertisers/banner/fallback/bst-banner.jpg",
      linkUrl: "https://www.instagram.com/bstcaminhoes/",
      target: "_blank" as const,
      priority: 1,
      position: 8,
      altText: "Banner BST Caminhões",
      isActive: true
    }
  ];

  // Retorna os banners sem personalização por posição (usando dados reais)
  return realBanners.map(banner => ({
    ...banner,
    isActive: true
  }));
};

export function useAdvertisements({
  enabled = true,
  position = 'home',
  bannersLimit = API.DEFAULTS.BANNERS_LIMIT || 10,
  sponsorsLimit = API.DEFAULTS.SPONSORS_LIMIT || 10
}: UseAdvertisementsOptions = {}): UseAdvertisementsReturn {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersByPosition, setBannersByPosition] = useState<Record<number, Banner[]>>({});
  const [sponsors, setSponsors] = useState<SponsorLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBannerPage, setCurrentBannerPage] = useState(1);
  const [currentSponsorPage, setCurrentSponsorPage] = useState(1);
  const [hasMoreBanners, setHasMoreBanners] = useState(true);
  const [hasMoreSponsors, setHasMoreSponsors] = useState(true);

  const fetchAdvertisements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Tenta buscar da API primeiro
      const [bannersResponse, sponsorsResponse] = await Promise.all([
        advertisementService.getBanners({
          position_group: position,
          limit: bannersLimit,
          page: 1
        }),
        advertisementService.getSponsors({
          active: true,
          limit: sponsorsLimit,
          page: 1
        })
      ]);

      // Verifica se temos dados válidos da API
      if (bannersResponse.data && Array.isArray(bannersResponse.data)) {
        const bannersByPos: Record<number, Banner[]> = {};
        for (let i = 1; i <= 12; i++) {
          bannersByPos[i] = [];
        }

        if (bannersResponse.data.length > 0) {
          // Processa banners da API com validação
          const processedBanners = bannersResponse.data.map((apiItem, index): Banner | null => {
            const safeImageUrl = selectSafeImageSrc(apiItem.imageUrl, apiItem.imageUrlWebp);
            const safeImageUrlWebp = selectSafeImageSrc(apiItem.imageUrlWebp, apiItem.imageUrl);

            if (!safeImageUrl && !safeImageUrlWebp) {
              return null;
            }

            const banner: Banner = {
              id: apiItem.id || (index + 1),
              title: apiItem.title || 'Banner sem título',
              description: apiItem.description || '',
              imageUrlWebp: safeImageUrlWebp || safeImageUrl || '',
              imageUrl: safeImageUrl || safeImageUrlWebp || '',
              linkUrl: apiItem.linkUrl || '#',
              target: apiItem.target || '_blank',
              priority: apiItem.priority || 1,
              position: apiItem.position || (index + 1),
              altText: apiItem.altText || apiItem.title || 'Banner',
              isActive: true
            };
            
            // Distribui nas posições
            const pos = banner.position >= 1 && banner.position <= 12 ? banner.position : 1;
            bannersByPos[pos].push(banner);
            
            return banner;
          }).filter((banner): banner is Banner => Boolean(banner));

          setBanners(processedBanners);
          setBannersByPosition(bannersByPos);
        } else {
          setBanners([]);
          setBannersByPosition(bannersByPos);
        }
      } else {
        throw new Error('API response invalid');
      }

      // Processa sponsors da API
      if (sponsorsResponse.data && Array.isArray(sponsorsResponse.data) && sponsorsResponse.data.length > 0) {
        const processedSponsors = sponsorsResponse.data.map(sponsor => {
          const safeLogoUrl = selectSafeImageSrc(sponsor.logoUrl, sponsor.logoUrlWebp);
          const safeLogoUrlWebp = selectSafeImageSrc(sponsor.logoUrlWebp, sponsor.logoUrl);

          return {
            id: sponsor.id,
            companyName: sponsor.companyName,
            logoUrlWebp: safeLogoUrlWebp || safeLogoUrl || '',
            logoUrl: safeLogoUrl || safeLogoUrlWebp || '',
            websiteUrl: sponsor.websiteUrl,
            packageType: sponsor.packageType,
            priority: sponsor.priority,
            isActive: true,
            altText: sponsor.altText || sponsor.companyName
          };
        });

        setSponsors(processedSponsors);
      }

      setHasMoreBanners(currentBannerPage < (bannersResponse.meta?.total_paginas || 1));
      setHasMoreSponsors(currentSponsorPage < (sponsorsResponse.meta?.total_paginas || 1));

    } catch (apiError) {
      // Fallback para dados mock apenas quando API falha
      const mockBanners = createMockBanners(position);
      const bannersByPos: Record<number, Banner[]> = {};
      
      for (let i = 1; i <= 12; i++) {
        bannersByPos[i] = [];
      }

      mockBanners.forEach((banner, index) => {
        const pos = banner.position || calculateBannerPosition(index, mockBanners.length);
        bannersByPos[pos].push({
          ...banner,
          position: pos
        });
      });

      setBanners(mockBanners);
      setBannersByPosition(bannersByPos);
      setSponsors(mockSponsorsData.sponsors.map(sponsor => ({
        ...sponsor,
        isActive: true
      })));
      
      setHasMoreBanners(false);
      setHasMoreSponsors(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreBanners = async () => {
    if (!hasMoreBanners || isLoading) return;

    try {
      const nextPage = currentBannerPage + 1;
      const response = await advertisementService.getBanners({
        position_group: position,
        limit: bannersLimit,
        page: nextPage
      });

      const safeBanners = response.data.map((banner): Banner | null => {
        const safeImageUrl = selectSafeImageSrc(banner.imageUrl, banner.imageUrlWebp);
        const safeImageUrlWebp = selectSafeImageSrc(banner.imageUrlWebp, banner.imageUrl);

        if (!safeImageUrl && !safeImageUrlWebp) {
          return null;
        }

        return {
          ...banner,
          imageUrlWebp: safeImageUrlWebp || safeImageUrl || '',
          imageUrl: safeImageUrl || safeImageUrlWebp || ''
        };
      }).filter((banner): banner is Banner => Boolean(banner));

      const newBannersByPos = { ...bannersByPosition };
      safeBanners.forEach(banner => {
        const pos = banner.position || 1;
        if (!newBannersByPos[pos]) {
          newBannersByPos[pos] = [];
        }
        newBannersByPos[pos].push(banner);
      });

      setBanners(prev => [...prev, ...safeBanners]);
      setBannersByPosition(newBannersByPos);
      setCurrentBannerPage(nextPage);
      setHasMoreBanners(nextPage < response.meta.total_paginas);
    } catch (err) {
      console.error('Error loading more banners:', err);
    }
  };

  const loadMoreSponsors = async () => {
    if (!hasMoreSponsors || isLoading) return;

    try {
      const nextPage = currentSponsorPage + 1;
      const response = await advertisementService.getSponsors({
        active: true,
        limit: sponsorsLimit,
        page: nextPage
      });

      const mappedSponsors = response.data.map(sponsor => {
        const safeLogoUrl = selectSafeImageSrc(sponsor.logoUrl, sponsor.logoUrlWebp);
        const safeLogoUrlWebp = selectSafeImageSrc(sponsor.logoUrlWebp, sponsor.logoUrl);

        return {
          id: sponsor.id,
          companyName: sponsor.companyName,
          logoUrlWebp: safeLogoUrlWebp || safeLogoUrl || '',
          logoUrl: safeLogoUrl || safeLogoUrlWebp || '',
          websiteUrl: sponsor.websiteUrl,
          packageType: sponsor.packageType,
          priority: sponsor.priority,
          isActive: true
        };
      });

      setSponsors(prev => [...prev, ...mappedSponsors]);
      setCurrentSponsorPage(nextPage);
      setHasMoreSponsors(nextPage < response.meta.total_paginas);
    } catch (err) {
      console.error('❌ Error loading more sponsors:', err);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchAdvertisements();
      return;
    }

    setBanners([]);
    setSponsors([]);
    setIsLoading(false);
    setError(null);
  }, [position, enabled]);

  return {
    banners,
    activeBanners: banners.filter(banner => banner.isActive).slice(0, 4),
    bannersByPosition,
    sponsors,
    isLoading,
    error,
    refetch: fetchAdvertisements,
    hasMoreBanners,
    hasMoreSponsors,
    loadMoreBanners,
    loadMoreSponsors
  };
}

// Função auxiliar para calcular a posição ideal do banner
function calculateBannerPosition(index: number, totalBanners: number): number {
  if (index < 4) return index + 1;
  if (index < 8) return index + 5;
  return ((index - 8) % 2) + 5;
}
