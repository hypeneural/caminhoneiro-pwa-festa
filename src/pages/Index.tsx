import { motion } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { Stories } from "@/components/mobile/Stories";
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
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { useNavigate } from 'react-router-dom';

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
        {/* Seção 1: Stories */}
        <Section delay={0.1} className="mb-4">
          <Stories />
        </Section>

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

        {/* Seção 3: Enquete */}
        <Section delay={0.35} className="px-4 mb-6">
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

        {/* Banner Carousel 5 */}
        {!isLoading && hasBannersInPosition(5) && (
          <Section delay={0.6} className="px-4 mb-6">
            <BannerCarousel 
              banners={bannersByPosition[5]} 
              autoplayDelay={4200}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 6: Fotos */}
        <Section delay={0.65} className="mb-6">
          <PhotoCarousel />
        </Section>

        {/* Compact Banner 11 - Após Fotos */}
        {!isLoading && hasBannersInPosition(11) && (
          <Section delay={0.67} className="px-4 mb-4">
            <CompactBannerCarousel 
              banners={bannersByPosition[11]} 
              autoplayDelay={4100}
            />
          </Section>
        )}

        {/* Banner Carousel 6 */}
        {!isLoading && hasBannersInPosition(6) && (
          <Section delay={0.7} className="px-4 mb-6">
            <BannerCarousel 
              banners={bannersByPosition[6]} 
              autoplayDelay={4800}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 7: Acesso Rápido */}
        <Section delay={0.75} className="px-4 mb-6">
          <QuickAccess />
        </Section>

        {/* Compact Banner 12 - Após Acesso Rápido */}
        {!isLoading && hasBannersInPosition(12) && (
          <Section delay={0.77} className="px-4 mb-4">
            <CompactBannerCarousel 
              banners={bannersByPosition[12]} 
              autoplayDelay={3600}
            />
          </Section>
        )}

        {/* Banner Carousel 7 */}
        {!isLoading && hasBannersInPosition(7) && (
          <Section delay={0.8} className="px-4 mb-6">
            <BannerCarousel 
              banners={bannersByPosition[7]} 
              autoplayDelay={5200}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        {/* Seção 8: Patrocinadores */}
        {!isLoading && sponsors.length > 0 && (
          <Section delay={0.85} className="mt-8 mb-6">
            <SponsorCarousel sponsors={sponsors} autoplayDelay={3000} />
          </Section>
        )}

        {/* Banner Carousel 8 (Final) */}
        {!isLoading && hasBannersInPosition(8) && (
          <Section delay={0.9} className="px-4 mb-8">
            <BannerCarousel 
              banners={bannersByPosition[8]} 
              autoplayDelay={4600}
              showControls={true}
              showDots={true}
            />
          </Section>
        )}

        <BottomNavigation />
        <PWAInstaller />
      </main>
    </div>
  );
}

export default Index;
