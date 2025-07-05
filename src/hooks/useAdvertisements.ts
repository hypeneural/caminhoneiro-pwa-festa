import { useState, useEffect } from 'react';
import { advertisementService } from '@/services/api/advertisementService';
import { Banner, SponsorLogo } from '@/types/sponsors';
import { API } from '@/constants/api';

interface UseAdvertisementsOptions {
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

export function useAdvertisements({
  position = 'home',
  bannersLimit = API.DEFAULTS.BANNERS_LIMIT,
  sponsorsLimit = API.DEFAULTS.SPONSORS_LIMIT
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

      // Aumenta o limite para garantir que temos banners suficientes para todas as posições
      const [bannersResponse, sponsorsResponse] = await Promise.all([
        advertisementService.getBanners({
          position_group: position,
          limit: Math.max(bannersLimit, 25), // Garante pelo menos 25 banners para cobrir 12 posições
          page: 1
        }),
        advertisementService.getSponsors({
          active: true,
          limit: sponsorsLimit,
          page: 1
        })
      ]);

      console.log('📢 useAdvertisements: Resposta API Banners:', bannersResponse);
      console.log('📢 useAdvertisements: Resposta API Sponsors:', sponsorsResponse);

      // Organiza os banners por posição
      const bannersByPos: Record<number, Banner[]> = {};
      
      // Inicializa todas as posições possíveis com arrays vazios
      for (let i = 1; i <= 12; i++) {
        bannersByPos[i] = [];
      }

      console.log('📢 useAdvertisements: Total banners recebidos:', bannersResponse.data.length);

      // Distribui os banners nas posições de forma inteligente
      if (bannersResponse.data.length > 0) {
        // Ordena os banners por prioridade primeiro
        const sortedBanners = [...bannersResponse.data].sort((a, b) => (b.priority || 0) - (a.priority || 0));
        
        // Distribui os banners em posições estratégicas
        sortedBanners.forEach((banner, index) => {
          // Se o banner já tem uma posição definida, respeita
          if (banner.position && banner.position >= 1 && banner.position <= 12) {
            bannersByPos[banner.position].push(banner);
          } else {
            // Distribui os banners de forma equilibrada
            // Posições principais: 1, 2, 3, 4 (banners grandes)
            // Posições secundárias: 9, 10, 11, 12 (banners compactos)
            // Posições complementares: 5, 6 (banners grandes após conteúdo)
            const position = calculateBannerPosition(index, sortedBanners.length);
            bannersByPos[position].push({
              ...banner,
              position
            });
          }
        });

        // Garante que cada posição tenha pelo menos um banner
        for (let pos = 1; pos <= 12; pos++) {
          if (bannersByPos[pos].length === 0) {
            // Pega um banner de uma posição que tenha mais de um
            const positionWithExtraBanner = Object.entries(bannersByPos)
              .find(([_, banners]) => banners.length > 1);
            
            if (positionWithExtraBanner) {
              const [_, banners] = positionWithExtraBanner;
              const banner = banners.pop();
              if (banner) {
                bannersByPos[pos].push({
                  ...banner,
                  position: pos
                });
              }
            }
          }
        }
      }

      // Ordena os banners por prioridade em cada posição
      Object.keys(bannersByPos).forEach(pos => {
        bannersByPos[Number(pos)].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      });

      // Mapeia os dados da API para o formato esperado pelos componentes
      const mappedSponsors = sponsorsResponse.data.map(sponsor => ({
        id: sponsor.id,
        companyName: sponsor.companyName,
        logoUrlWebp: sponsor.logoUrlWebp,
        logoUrl: sponsor.logoUrl,
        websiteUrl: sponsor.websiteUrl,
        packageType: sponsor.packageType,
        priority: sponsor.priority
      }));

      setBanners(bannersResponse.data);
      setBannersByPosition(bannersByPos);
      setSponsors(mappedSponsors);
      
      // Atualiza estados de paginação
      setHasMoreBanners(currentBannerPage < (bannersResponse.meta?.total_paginas || 1));
      setHasMoreSponsors(currentSponsorPage < (sponsorsResponse.meta?.total_paginas || 1));
      setCurrentBannerPage(1);
      setCurrentSponsorPage(1);

      // Log para debug
      console.log('📢 Banners por posição FINAL:', bannersByPos);
      console.log('🎯 Total de banners:', bannersResponse.data.length);
      console.log('👥 Total de sponsors:', sponsorsResponse.data.length);

    } catch (err) {
      console.error('❌ Error fetching advertisements:', err);
      setError('Erro ao carregar anúncios');
      // Initialize empty state on error
      setBanners([]);
      setBannersByPosition({});
      setSponsors([]);
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

      // Atualiza os banners por posição
      const newBannersByPos = { ...bannersByPosition };
      response.data.forEach(banner => {
        const pos = banner.position || 1; // Default to position 1 if not specified
        if (!newBannersByPos[pos]) {
          newBannersByPos[pos] = [];
        }
        newBannersByPos[pos].push(banner);
      });

      setBanners(prev => [...prev, ...response.data]);
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

      const mappedSponsors = response.data.map(sponsor => ({
        id: sponsor.id,
        companyName: sponsor.companyName,
        logoUrlWebp: sponsor.logoUrlWebp,
        logoUrl: sponsor.logoUrl,
        websiteUrl: sponsor.websiteUrl,
        packageType: sponsor.packageType,
        priority: sponsor.priority
      }));

      setSponsors(prev => [...prev, ...mappedSponsors]);
      setCurrentSponsorPage(nextPage);
      setHasMoreSponsors(nextPage < response.meta.total_paginas);
    } catch (err) {
      console.error('❌ Error loading more sponsors:', err);
    }
  };

  useEffect(() => {
    fetchAdvertisements();
  }, [position, bannersLimit, sponsorsLimit]);

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
  // Posições principais (1-4) para os primeiros banners de alta prioridade
  if (index < 4) return index + 1;
  
  // Posições compactas (9-12) para banners de média prioridade
  if (index < 8) return index + 5;
  
  // Posições complementares (5-6) para os demais banners
  return ((index - 8) % 2) + 5;
} 