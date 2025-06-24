
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

  // Memoized shuffled banners that only change when data changes or manually refreshed
  const shuffledBanners = useMemo(() => {
    const activeBanners = sponsorsData.banners.filter(banner => banner.isActive);
    return shuffleArray(activeBanners);
  }, [sponsorsData.banners, lastShuffleTime]);

  // Memoized sponsor logos grouped by category
  const sponsorsByCategory = useMemo(() => {
    const activeSponsors = sponsorsData.sponsors.filter(sponsor => sponsor.isActive);
    return {
      diamante: activeSponsors.filter(s => s.category === 'diamante'),
      ouro: activeSponsors.filter(s => s.category === 'ouro'),
      prata: activeSponsors.filter(s => s.category === 'prata'),
      bronze: activeSponsors.filter(s => s.category === 'bronze'),
      apoiador: activeSponsors.filter(s => s.category === 'apoiador'),
    };
  }, [sponsorsData.sponsors]);

  // Memoized banner groups for different positions
  const bannerGroups = useMemo(() => {
    const positions = sponsorsData.positions.filter(p => p.isActive);
    const groups: Record<string, Banner[]> = {};

    let bannerIndex = 0;
    positions.forEach(position => {
      const bannersForPosition = shuffledBanners.slice(bannerIndex, bannerIndex + position.maxBanners);
      groups[position.id] = bannersForPosition;
      bannerIndex += position.maxBanners;
    });

    return groups;
  }, [shuffledBanners, sponsorsData.positions]);

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

  // Function to track banner click for analytics
  const trackBannerClick = useCallback((bannerId: string, position: string) => {
    // TODO: Implement analytics tracking
    console.log(`Banner clicked: ${bannerId} at position: ${position}`);
    
    // Future implementation could send to analytics service
    // analytics.track('banner_click', { bannerId, position, timestamp: Date.now() });
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
    sponsorsByCategory,
    bannerGroups,
    
    // State
    loading,
    error,
    
    // Actions
    fetchSponsorsData,
    reshuffleBanners,
    trackBannerClick,
    trackSponsorClick,
    
    // Utilities
    getBannersForPosition: (positionId: string) => bannerGroups[positionId] || [],
    getActiveBannersCount: () => shuffledBanners.length,
    getActiveSponsorsCount: () => sponsorsData.sponsors.filter(s => s.isActive).length,
  };
};
