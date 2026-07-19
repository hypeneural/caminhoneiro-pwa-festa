import { useState, useEffect, useCallback, useRef } from 'react';
import { Banner } from '@/types/sponsors';
import { bannerService, ApiBanner, ApiSponsor } from '@/services/api/bannerService';

interface BannerAnalytics {
  impressions: Map<number, number>;
  clicks: Map<number, number>;
  dismissals: Set<number>;
}

interface UseBannersConfig {
  enabled?: boolean;
  enableRandomRotation?: boolean;
  maxImpressionsPerBanner?: number;
  analyticsEnabled?: boolean;
  galleryInsertionInterval?: number; // A cada quantas linhas inserir banner
}

export const useBanners = (config: UseBannersConfig = {}) => {
  const {
    enabled = true,
    enableRandomRotation = true,
    maxImpressionsPerBanner = 10,
    analyticsEnabled = true,
    galleryInsertionInterval = 3
  } = config;

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Analytics state
  const analytics = useRef<BannerAnalytics>({
    impressions: new Map(),
    clicks: new Map(),
    dismissals: new Set()
  });

  // Banner pools para diferentes contextos
  const [galleryBanners, setGalleryBanners] = useState<Banner[]>([]);
  const [lightboxBanners, setLightboxBanners] = useState<Banner[]>([]);
  
  // Cache de banners usados para evitar repetição
  const usedBannersCache = useRef<Set<number>>(new Set());

  // Carrega banners da API real
  const loadBanners = useCallback(async () => {
    if (!enabled) return;

    // Evita carregamentos duplicados
    if (loading || isInitialized) return;
    
    setLoading(true);
    setError(null);

    try {
      
      // Carrega banners e sponsors em paralelo
      const [bannersResponse, sponsorsResponse] = await Promise.all([
        bannerService.getAllBanners('home'),
        bannerService.getAllSponsors()
      ]);

      // Converte banners da API para formato interno
      const apiBanners: Banner[] = bannersResponse.map((banner: ApiBanner) => ({
        id: banner.id,
        title: banner.title,
        description: banner.description,
        imageUrlWebp: banner.imageUrlWebp,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        target: banner.target,
        priority: banner.priority,
        position: banner.priority,
        category: 'banner',
        isActive: true,
        altText: banner.title
      }));

      // Converte sponsors para formato de banner (para uso na galeria como squares)
      const sponsorBanners: Banner[] = sponsorsResponse.map((sponsor: ApiSponsor) => ({
        id: sponsor.id + 1000, // Offset para evitar conflito com IDs de banners
        title: sponsor.companyName,
        description: null,
        imageUrlWebp: sponsor.logoUrlWebp,
        imageUrl: sponsor.logoUrl,
        linkUrl: sponsor.websiteUrl,
        target: '_blank',
        priority: sponsor.priority + 100, // Prioridade menor que banners
        position: sponsor.priority + 100,
        category: 'sponsor',
        isActive: true,
        altText: `Logo ${sponsor.companyName}`
      }));

      const allBanners = [...apiBanners, ...sponsorBanners];
      setBanners(allBanners);

      // Separa por contexto
      // Galeria: APENAS sponsors 1x1 (300x300px) como solicitado
      setGalleryBanners(sponsorBanners);

      // Lightbox: apenas banners horizontais (limitado a 5 por foto como solicitado)
      setLightboxBanners(apiBanners.slice(0, 5));

      console.log(`🎯 Banners carregados: ${apiBanners.length} banners + ${sponsorBanners.length} sponsors`);
      setIsInitialized(true);

    } catch (err) {
      console.error('❌ Erro ao carregar banners:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar banners');
      
      // Fallback: mantém arrays vazios para não quebrar a UI
      setBanners([]);
      setGalleryBanners([]);
      setLightboxBanners([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, loading, isInitialized]);

  // Seleciona banner aleatório evitando repetições
  const selectRandomBanner = useCallback((pool: Banner[], excludeIds: number[] = []) => {
    const availableBanners = pool.filter(banner => 
      banner.isActive && 
      !excludeIds.includes(banner.id) &&
      !analytics.current.dismissals.has(banner.id) &&
      (analytics.current.impressions.get(banner.id) || 0) < maxImpressionsPerBanner
    );

    if (availableBanners.length === 0) {
      // Reset cache se não há banners disponíveis
      usedBannersCache.current.clear();
      return pool.find(b => b.isActive) || null;
    }

    if (enableRandomRotation) {
      const randomIndex = Math.floor(Math.random() * availableBanners.length);
      return availableBanners[randomIndex];
    }

    // Retorna por prioridade se não é aleatório
    return availableBanners.sort((a, b) => a.priority - b.priority)[0];
  }, [enableRandomRotation, maxImpressionsPerBanner]);

  // Calcula posições de banners na galeria
  const calculateBannerPositions = useCallback((
    totalPhotos: number, 
    photosPerRow: number
  ): number[] => {
    const positions: number[] = [];
    const totalRows = Math.ceil(totalPhotos / photosPerRow);
    
    for (let row = galleryInsertionInterval; row <= totalRows; row += galleryInsertionInterval) {
      const position = row * photosPerRow;
      if (position < totalPhotos) {
        positions.push(position);
      }
    }
    
    return positions;
  }, [galleryInsertionInterval]);

  // Cria grid mesclado com fotos e banners
  const createMixedGalleryGrid = useCallback((photos: any[], photosPerRow: number = 2) => {
    const bannerPositions = calculateBannerPositions(photos.length, photosPerRow);
    const mixedGrid: Array<{ type: 'photo' | 'banner', data: any, position: number }> = [];
    
    let photoIndex = 0;
    let bannerIndex = 0;
    
    for (let i = 0; i < photos.length + bannerPositions.length; i++) {
      const shouldInsertBanner = bannerPositions.includes(photoIndex);
      
      if (shouldInsertBanner && bannerIndex < galleryBanners.length) {
        const banner = selectRandomBanner(
          galleryBanners, 
          Array.from(usedBannersCache.current)
        );
        
        if (banner) {
          mixedGrid.push({
            type: 'banner',
            data: banner,
            position: i
          });
          usedBannersCache.current.add(banner.id);
          bannerIndex++;
        }
      }
      
      if (photoIndex < photos.length) {
        mixedGrid.push({
          type: 'photo',
          data: photos[photoIndex],
          position: i
        });
        photoIndex++;
      }
    }
    
    return mixedGrid;
  }, [calculateBannerPositions, galleryBanners, selectRandomBanner]);

  // Analytics handlers
  const trackBannerImpression = useCallback((banner: Banner, position?: number) => {
    if (!analyticsEnabled) return;
    
    const currentImpressions = analytics.current.impressions.get(banner.id) || 0;
    analytics.current.impressions.set(banner.id, currentImpressions + 1);
    
    // Log apenas na primeira impressão
    if (currentImpressions === 0) {
      console.log(`👁️ Banner: ${banner.title}`);
    }
  }, [analyticsEnabled]);

  const trackBannerClick = useCallback((banner: Banner, position?: number) => {
    if (!analyticsEnabled) return;
    
    const currentClicks = analytics.current.clicks.get(banner.id) || 0;
    analytics.current.clicks.set(banner.id, currentClicks + 1);
    
    console.log(`🔗 Click: ${banner.title}`);
  }, [analyticsEnabled]);

  const dismissBanner = useCallback((bannerId: number) => {
    analytics.current.dismissals.add(bannerId);
    console.log(`❌ Dispensado: ${bannerId}`);
  }, []);

  // Estatísticas dos banners
  const getBannerStats = useCallback(() => {
    if (!analyticsEnabled) return null;
    
    return {
      totalImpressions: Array.from(analytics.current.impressions.values()).reduce((a, b) => a + b, 0),
      totalClicks: Array.from(analytics.current.clicks.values()).reduce((a, b) => a + b, 0),
      totalDismissals: analytics.current.dismissals.size,
      clickThroughRate: (() => {
        const totalImpressions = Array.from(analytics.current.impressions.values()).reduce((a, b) => a + b, 0);
        const totalClicks = Array.from(analytics.current.clicks.values()).reduce((a, b) => a + b, 0);
        return totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      })(),
      bannerPerformance: banners.map(banner => ({
        id: banner.id,
        title: banner.title,
        impressions: analytics.current.impressions.get(banner.id) || 0,
        clicks: analytics.current.clicks.get(banner.id) || 0,
        dismissed: analytics.current.dismissals.has(banner.id)
      }))
    };
  }, [analyticsEnabled, banners]);

  // Carregamento inicial
  useEffect(() => {
    if (!enabled) return;
    loadBanners();
  }, [enabled, loadBanners]);

  return {
    // Estado
    banners,
    galleryBanners,
    lightboxBanners,
    loading,
    error,
    
    // Funções utilitárias
    selectRandomBanner,
    createMixedGalleryGrid,
    calculateBannerPositions,
    
    // Analytics
    trackBannerImpression,
    trackBannerClick,
    dismissBanner,
    getBannerStats,
    
    // Controles
    reloadBanners: loadBanners
  };
}; 
