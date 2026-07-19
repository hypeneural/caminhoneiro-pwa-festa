import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { SponsorCarousel } from "@/components/sponsors/SponsorCarousel";
import { SponsorGrid } from "@/components/sponsors/SponsorGrid";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useEffect, useRef } from "react";
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Section } from "@/components/layout/Section";
import { ContentSections } from "@/components/home/ContentSections";
import { HomeHero } from "@/components/home/HomeHero";
import { LiveRouteBanner } from "@/components/tracker/LiveRouteBanner";

const Index = () => {
  const { recordVisit, prefetchPredicted } = usePrefetch();
  const hasRecorded = useRef(false);

  const {
    bannersByPosition = {},
    sponsors,
    isLoading,
    error,
    hasMoreSponsors,
    loadMoreSponsors
  } = useAdvertisements({
    position: 'home',
    bannersLimit: 12,
    sponsorsLimit: 16
  });

  // Record page visit and prefetch predicted routes
  useEffect(() => {
    if (!hasRecorded.current) {
      recordVisit('/');
      hasRecorded.current = true;
    }
    
    const timer = setTimeout(() => {
      prefetchPredicted();
    }, 2000);

    return () => clearTimeout(timer);
  }, [recordVisit, prefetchPredicted]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-app-header pb-app-nav">
        <LiveRouteBanner />

        <HomeHero />

        <ContentSections 
          bannersByPosition={bannersByPosition}
          isLoading={isLoading}
        />

        {/* Seção Final: Patrocinadores */}
        {!isLoading && sponsors.length > 0 && (
          <Section delay={0.7} className="px-4 mb-6">
            <SponsorCarousel sponsors={sponsors} />
          </Section>
        )}

        {/* Grid de Patrocinadores */}
        {!isLoading && sponsors.length > 0 && (
          <Section delay={0.75} className="px-4">
            <SponsorGrid 
              sponsors={sponsors} 
              hasMoreSponsors={hasMoreSponsors}
              loadMoreSponsors={loadMoreSponsors}
            />
          </Section>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Index;
