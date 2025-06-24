
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

  // Memoized sponsor logos (only apoio category for 1x1 grid)
  const supportSponsors = useMemo(() => {
    const activeSponsors = sponsorsData.sponsors.filter(sponsor => sponsor.isActive);
    return activeSponsors.filter(s => s.category === 'apoiador' || s.category === 'bronze');
  }, [sponsorsData.sponsors]);

  // Distribute banners across multiple positions in the home page
  const distributedBanners = useMemo(() => {
    const totalBanners = shuffledBanners.length;
    
    // Define number of positions based on total banners
    let positions: number;
    if (totalBanners <= 5) positions = 2;
    else if (totalBanners <= 10) positions = 4;
    else if (totalBanners <= 15) positions = 6;
    else positions = 8;
    
    // Calculate banners per position
    const bannersPerPosition = Math.ceil(totalBanners / positions);
    const distribution: Record<string, Banner[]> = {};
    
    for (let i = 0; i < positions; i++) {
      const start = i * bannersPerPosition;
      const end = Math.min(start + bannersPerPosition, totalBanners);
      const positionBanners = shuffledBanners.slice(start, end);
      
      if (positionBanners.length > 0) {
        distribution[`pos-${i + 1}`] = positionBanners;
      }
    }
    
    console.log('Banner distribution:', distribution);
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
