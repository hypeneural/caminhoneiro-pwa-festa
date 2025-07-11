import { motion } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { SaoCristovaoTracker } from "@/components/mobile/SaoCristovaoTracker";
import { CountdownTimer } from "@/components/mobile/CountdownTimer";
import { NewsCarousel } from "@/components/mobile/NewsCarousel";
import { PhotoCarousel } from "@/components/mobile/PhotoCarousel";
import { QuickAccess } from "@/components/mobile/QuickAccess";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { PWAInstaller } from "@/components/PWAInstaller";
import { ProgramPreview } from "@/components/mobile/ProgramPreview";
import { BannerCarousel } from "@/components/sponsors/BannerCarousel";
import { CompactBannerCarousel } from "@/components/sponsors/CompactBannerCarousel";
import { SponsorCarousel } from "@/components/sponsors/SponsorCarousel";
import { SponsorGrid } from "@/components/sponsors/SponsorGrid";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useEffect, useRef } from "react";
import { PollCard } from "@/components/mobile/PollCard";
import { WeatherSection } from "@/components/weather/WeatherSection";
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { useNavigate } from 'react-router-dom';
import { ShortsCarousel } from "@/components/shorts/ShortsCarousel";

// Interface para as props das seções
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

// Componente de seção reutilizável com animação e espaçamento padrão
const Section = ({ children, className = "", delay = 0 }: SectionProps) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`mb-6 ${className}`}
  >
    {children}
  </motion.section>
);

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

  const hasBannersInPosition = (position: number) => {
    const hasbanners = Array.isArray(bannersByPosition[position]) && bannersByPosition[position].length > 0;
    console.log(`🎯 Index: Position ${position} has banners:`, hasbanners, bannersByPosition[position]);
    return hasbanners;
  };

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
        {/* Banner Carousel 1 */}
        {!isLoading && hasBannersInPosition(1) && (
          <Section delay={0.15} className="px-4 mb-6">
            <BannerCarousel 
              banners={bannersByPosition[1]} 
              autoplayDelay={5000}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 2: Countdown e Programação */}
        <Section delay={0.2} className="px-4 mb-6">
          <CountdownTimer />
        </Section>
        
        <Section delay={0.25} className="px-4 mb-6">
          <ProgramPreview />
        </Section>

        {/* Compact Banner 9 - Entre Programação e Enquete */}
        {!isLoading && hasBannersInPosition(9) && (
          <Section delay={0.27} className="px-4 mb-4">
            <CompactBannerCarousel 
              banners={bannersByPosition[9]} 
              autoplayDelay={3500}
              showControls={false}
              showDots={true}
            />
          </Section>
        )}

        {/* Banner Carousel 2 */}
        {!isLoading && hasBannersInPosition(2) && (
          <Section delay={0.3} className="px-4 mb-6">
            <BannerCarousel 
              banners={bannersByPosition[2]} 
              autoplayDelay={4500}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 3: Shorts do YouTube */}
        <Section delay={0.3} className="mb-6">
          <ShortsCarousel />
        </Section>

        {/* Seção 4: Previsão do Tempo */}
        <Section delay={0.33} className="px-4 mb-6">
          <WeatherSection />
        </Section>

        {/* Seção 5: Enquete */}
        <Section delay={0.37} className="px-4 mb-6">
          <PollCard />
        </Section>

        {/* Banner Carousel 3 */}
        {!isLoading && hasBannersInPosition(3) && (
          <Section delay={0.4} className="px-4 mb-6">
            <BannerCarousel 
              banners={bannersByPosition[3]} 
              autoplayDelay={4000}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 4: São Cristóvão Tracker */}
        <Section delay={0.45} className="px-4 mb-6">
          <SaoCristovaoTracker />
        </Section>

        {/* Compact Banner 10 - Após São Cristóvão Tracker */}
        {!isLoading && hasBannersInPosition(10) && (
          <Section delay={0.47} className="px-4 mb-4">
            <CompactBannerCarousel 
              banners={bannersByPosition[10]} 
              autoplayDelay={3800}
              showControls={false}
              showDots={true}
            />
          </Section>
        )}

        {/* Banner Carousel 4 */}
        {!isLoading && hasBannersInPosition(4) && (
          <Section delay={0.5} className="px-4 mb-6">
            <BannerCarousel 
              banners={bannersByPosition[4]} 
              autoplayDelay={5500}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 5: Notícias */}
        <Section delay={0.55} className="px-4 mb-6">
          <NewsCarousel />
        </Section>

        {/* Banner Carousel 5 - Após Notícias */}
        {!isLoading && hasBannersInPosition(5) && (
          <Section delay={0.57} className="px-4 mb-6">
            <BannerCarousel 
              banners={bannersByPosition[5]} 
              autoplayDelay={4200}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 6: Fotos */}
        <Section delay={0.6} className="px-4 mb-6">
          <PhotoCarousel />
        </Section>

        {/* Compact Banner 11 - Entre Fotos e Acesso Rápido */}
        {!isLoading && hasBannersInPosition(11) && (
          <Section delay={0.62} className="px-4 mb-4">
            <CompactBannerCarousel 
              banners={bannersByPosition[11]} 
              autoplayDelay={3600}
              showControls={false}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 7: Acesso Rápido */}
        <Section delay={0.65} className="px-4 mb-6">
          <QuickAccess />
        </Section>

        {/* Banner Carousel 6 - Após Acesso Rápido */}
        {!isLoading && hasBannersInPosition(6) && (
          <Section delay={0.67} className="px-4 mb-6">
            <BannerCarousel 
              banners={bannersByPosition[6]} 
              autoplayDelay={4800}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 8: Patrocinadores */}
        {!isLoading && sponsors.length > 0 && (
          <Section delay={0.7} className="px-4 mb-6">
            <SponsorCarousel sponsors={sponsors} />
          </Section>
        )}

        {/* Compact Banner 12 - Final da Página */}
        {!isLoading && hasBannersInPosition(12) && (
          <Section delay={0.72} className="px-4 mb-4">
            <CompactBannerCarousel 
              banners={bannersByPosition[12]} 
              autoplayDelay={4000}
              showControls={false}
              showDots={true}
            />
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
