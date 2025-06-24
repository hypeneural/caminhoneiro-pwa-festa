
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Banner, SponsorLogo, SponsorsData } from '@/types/sponsors';
import { mockSponsorsData } from '@/data/sponsorsData';

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
  const [sponsorsData, setSponsorsData] = useState<SponsorsData>(mockSponsorsData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastShuffleTime, setLastShuffleTime] = useState(Date.now());

  // Separate banners by category
  const bannersByCategory = useMemo(() => {
    const activeBanners = sponsorsData.banners.filter(banner => banner.isActive);
    
    return {
      destaque: activeBanners.filter(banner => banner.category === 'patrocinador'),
      apoio: activeBanners.filter(banner => banner.category === 'apoiador' || banner.category === 'promocional')
    };
  }, [sponsorsData.banners, lastShuffleTime]);

  // Memoized shuffled banners that only change when data changes or manually refreshed
  const shuffledBanners = useMemo(() => {
    return shuffleArray(bannersByCategory.destaque);
  }, [bannersByCategory.destaque, lastShuffleTime]);

  // Memoized sponsor logos (combining all support categories for carousel display)
  const supportSponsors = useMemo(() => {
    const activeSponsors = sponsorsData.sponsors.filter(sponsor => sponsor.isActive);
    return activeSponsors.filter(s => s.category === 'apoiador' || s.category === 'bronze');
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

  // Function to fetch sponsors data from API (future implementation)
  const fetchSponsorsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/sponsors');
      // const data = await response.json();
      // setSponsorsData(data);
      
      // For now, simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSponsorsData(mockSponsorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados dos patrocinadores');
      console.error('Error fetching sponsors data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to track banner click for analytics - FIXED SIGNATURE
  const trackBannerClick = useCallback((banner: Banner, position: string) => {
    console.log(`Banner clicked: ${banner.id} at position: ${position}`);
    
    // Future implementation could send to analytics service
    // analytics.track('banner_click', { bannerId: banner.id, position, timestamp: Date.now() });
  }, []);

  // Function to track sponsor click for analytics
  const trackSponsorClick = useCallback((sponsorId: string, category: string) => {
    console.log(`Sponsor clicked: ${sponsorId} category: ${category}`);
    
    // Future implementation
    // analytics.track('sponsor_click', { sponsorId, category, timestamp: Date.now() });
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
