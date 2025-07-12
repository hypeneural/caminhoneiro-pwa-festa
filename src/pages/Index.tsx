import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { PWAInstaller } from "@/components/PWAInstaller";
import { SponsorCarousel } from "@/components/sponsors/SponsorCarousel";
import { SponsorGrid } from "@/components/sponsors/SponsorGrid";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useEffect, useRef } from "react";
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { useNavigate } from 'react-router-dom';
import { Section } from "@/components/layout/Section";
import { ContentSections } from "@/components/home/ContentSections";

const Index = () => {
  const { recordVisit, prefetchPredicted } = usePrefetch();
  const hasRecorded = useRef(false);
  const navigate = useNavigate();

  const {
    bannersByPosition = {},
    sponsors,
    isLoading,
    error
  } = useAdvertisements({
    position: 'home',
    bannersLimit: 25,
    sponsorsLimit: 6
  });

  console.log('🏠 Index: bannersByPosition =', bannersByPosition);
  console.log('🏠 Index: isLoading =', isLoading);
  console.log('🏠 Index: error =', error);

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

  useEffect(() => {
    const isFirstVisit = !localStorage.getItem('visited');
    if (isFirstVisit) {
      navigate('/historia');
      localStorage.setItem('visited', 'true');
    }
  }, [navigate]);

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
      
      <main className="pt-16 pb-20">
        {/* Main Content com banners distribuídos */}
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
            <SponsorGrid sponsors={sponsors} />
          </Section>
        )}
      </main>

      <BottomNavigation />
      <PWAInstaller />
    </div>
  );
};

export default Index;
