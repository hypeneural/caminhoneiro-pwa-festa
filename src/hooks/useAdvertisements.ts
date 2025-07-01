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
          limit: Math.max(bannersLimit, 15), // Garante pelo menos 15 banners para a home
          page: 1
        }),
        advertisementService.getSponsors({
          active: true,
          limit: sponsorsLimit,
          page: 1
        })
      ]);

      // Organiza os banners por posição
      const bannersByPos: Record<number, Banner[]> = {};
      
      // Inicializa todas as posições possíveis com arrays vazios
      for (let i = 1; i <= 8; i++) {
        bannersByPos[i] = [];
      }

      // Distribui os banners nas posições
      bannersResponse.data.forEach(banner => {
        const pos = banner.position || 1;
        if (pos >= 1 && pos <= 8) { // Valida a posição
          bannersByPos[pos].push(banner);
        }
      });

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
      console.log('📢 Banners por posição:', bannersByPos);
      console.log('🎯 Total de banners:', bannersResponse.data.length);

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