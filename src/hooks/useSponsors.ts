import { useState, useEffect, useCallback, useMemo } from 'react';
import { Banner, SponsorLogo, SponsorsData } from '@/types/sponsors';
import { advertisementService } from '@/services/api/advertisementService';
import { API } from '@/constants/api';
import axios from '@/lib/axios';

// Utility function to shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Utility function to chunk array into groups
const chunkArray = <T>(array: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
};

export const useSponsors = () => {
  const [sponsorsData, setSponsorsData] = useState<SponsorsData>({
    banners: [],
    sponsors: [],
    positions: [],
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastShuffleTime, setLastShuffleTime] = useState(Date.now());

  // Separate banners by package type
  const bannersByCategory = useMemo(() => {
    return {
      destaque: sponsorsData.banners.filter(banner => banner.priority === 1),
      apoio: sponsorsData.banners.filter(banner => banner.priority === 2)
    };
  }, [sponsorsData.banners, lastShuffleTime]);

  // Memoized shuffled banners that only change when data changes or manually refreshed
  const shuffledBanners = useMemo(() => {
    return shuffleArray(bannersByCategory.destaque);
  }, [bannersByCategory.destaque, lastShuffleTime]);

  // Memoized sponsor logos (combining all support categories for carousel display)
  const supportSponsors = useMemo(() => {
    return sponsorsData.sponsors.filter(s => s.packageType === 2);
  }, [sponsorsData.sponsors]);

  // Distribute 15 banners across 4 strategic positions
  const distributedBanners = useMemo(() => {
    const totalBanners = shuffledBanners.length;
    
    if (totalBanners === 0) return {};
    
    // Define fixed distribution for 4 strategic positions
    const positions = [
      { id: 'pos-1', name: 'after-stories', maxBanners: 4 },      // Após Stories - alta visibilidade
      { id: 'pos-2', name: 'tracker-news', maxBanners: 4 },       // Entre Tracker e News - meio do feed
      { id: 'pos-3', name: 'photo-quick', maxBanners: 4 },        // Entre Photo e Quick Access - final conteúdo
      { id: 'pos-4', name: 'before-credits', maxBanners: 3 }      // Antes dos créditos - última impressão
    ];
    
    const distribution: Record<string, Banner[]> = {};
    let bannerIndex = 0;
    
    // Distribute banners across positions
    positions.forEach(position => {
      const bannersForPosition = [];
      
      for (let i = 0; i < position.maxBanners && bannerIndex < totalBanners; i++) {
        bannersForPosition.push(shuffledBanners[bannerIndex]);
        bannerIndex++;
      }
      
      if (bannersForPosition.length > 0) {
        distribution[position.id] = bannersForPosition;
      }
    });
    
    console.log('Banner distribution (15 banners in 4 positions):', distribution);
    return distribution;
  }, [shuffledBanners]);

  // Function to manually shuffle banners
  const reshuffleBanners = useCallback(() => {
    setLastShuffleTime(Date.now());
  }, []);

  // Function to fetch sponsors data from API
  const fetchSponsorsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [bannersResponse, sponsorsResponse] = await Promise.all([
        advertisementService.getBanners({
          position_group: API.POSITION_GROUPS.HOME,
          limit: API.DEFAULTS.BANNERS_LIMIT
        }),
        advertisementService.getSponsors({
          active: true,
          limit: API.DEFAULTS.SPONSORS_LIMIT
        })
      ]);

      setSponsorsData({
        banners: bannersResponse.data.map(banner => ({
          id: banner.id,
          title: banner.title,
          description: banner.description,
          imageUrl: banner.imageUrl,
          imageUrlWebp: banner.imageUrlWebp,
          linkUrl: banner.linkUrl,
          target: banner.target,
          priority: banner.priority,
          altText: banner.altText
        })),
        sponsors: sponsorsResponse.data.map(sponsor => ({
          id: sponsor.id,
          companyName: sponsor.companyName,
          logoUrl: sponsor.logoUrl,
          logoUrlWebp: sponsor.logoUrlWebp,
          websiteUrl: sponsor.websiteUrl,
          packageType: sponsor.packageType,
          priority: sponsor.priority,
          altText: sponsor.altText
        })),
        positions: [], // Will be populated when positions API is available
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados dos patrocinadores');
      console.error('Error fetching sponsors data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to track banner click for analytics
  const trackBannerClick = useCallback(async (banner: Banner, position: string) => {
    console.log(`Banner clicked: ${banner.id} at position: ${position}`);
    try {
      // Track click event through API
      await axios.post(API.ENDPOINTS.ANALYTICS.BANNER_CLICK, {
        banner_id: banner.id,
        position,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Error tracking banner click:', err);
    }
  }, []);

  // Function to track sponsor click for analytics
  const trackSponsorClick = useCallback(async (sponsorId: string, category: string) => {
    console.log(`Sponsor clicked: ${sponsorId} category: ${category}`);
    try {
      // Track click event through API
      await axios.post(API.ENDPOINTS.ANALYTICS.SPONSOR_CLICK, {
        sponsor_id: sponsorId,
        category,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Error tracking sponsor click:', err);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchSponsorsData();
  }, [fetchSponsorsData]);

  return {
    // Data
    sponsorsData,
    shuffledBanners,
    distributedBanners,
    supportSponsors,
    bannersByCategory,
    
    // State
    loading,
    error,
    
    // Actions
    fetchSponsorsData,
    reshuffleBanners,
    trackBannerClick,
    trackSponsorClick,
    
    // Utilities
    getBannersForPosition: (positionId: string) => distributedBanners[positionId] || [],
    getActiveBannersCount: () => shuffledBanners.length,
    getActiveSponsorsCount: () => supportSponsors.length,
    getTotalPositions: () => Object.keys(distributedBanners).length,
  };
};
