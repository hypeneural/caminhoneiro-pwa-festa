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
import { SponsorCarousel } from "@/components/sponsors/SponsorCarousel";
import { AdBannerGroup } from "@/components/sponsors/AdBanner";
import { useSponsors } from "@/hooks/useSponsors";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useEffect, useRef } from "react";

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
  const {
    shuffledBanners,
    distributedBanners,
    supportSponsors,
    getBannersForPosition,
    trackBannerClick,
    trackSponsorClick,
    loading: sponsorsLoading,
    getTotalPositions
  } = useSponsors();
  const hasRecorded = useRef(false);

  // Record page visit and prefetch predicted routes
  useEffect(() => {
    if (!hasRecorded.current) {
      recordVisit('/');
      hasRecorded.current = true;
    }
    
    // Prefetch likely next routes after a delay
    const timer = setTimeout(() => {
      prefetchPredicted();
    }, 2000);

    return () => clearTimeout(timer);
  }, [recordVisit, prefetchPredicted]);

  // Get total number of positions with banners
  const totalPositions = getTotalPositions();

  console.log('Total banner positions:', totalPositions);
  console.log('Distributed banners:', distributedBanners);
  console.log('Support sponsors count:', supportSponsors.length);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Main content with proper spacing for fixed elements */}
      <main className="pt-16 pb-20">
        {/* Stories Section - First */}
        <Section delay={0} className="mb-4">
          <Stories />
        </Section>

        {/* POSIÇÃO 1: Após Stories - Alta Visibilidade (4 banners) */}
        {getBannersForPosition('pos-1').length > 0 && (
          <Section delay={0.05} className="px-4">
            <BannerCarousel
              banners={getBannersForPosition('pos-1')}
              onBannerClick={(banner) => trackBannerClick(banner, 'after-stories')}
              className="mb-4"
              autoplayDelay={6000}
            />
          </Section>
        )}

        {/* Countdown Timer + Program Preview */}
        <Section delay={0.1} className="px-4">
          <div className="space-y-4">
            <CountdownTimer />
            <ProgramPreview />
          </div>
        </Section>

        {/* São Cristóvão Tracker */}
        <Section delay={0.15} className="px-4">
          <SaoCristovaoTracker />
        </Section>

        {/* POSIÇÃO 2: Entre Tracker e News - Meio do Feed (4 banners)  */}
        {getBannersForPosition('pos-2').length > 0 && (
          <Section delay={0.2} className="px-4">
            <BannerCarousel
              banners={getBannersForPosition('pos-2')}
              onBannerClick={(banner) => trackBannerClick(banner, 'tracker-news')}
              className="mb-4"
              autoplayDelay={5500}
            />
          </Section>
        )}

        {/* News Carousel */}
        <Section delay={0.25} className="px-4">
          <NewsCarousel />
        </Section>

        {/* Photo Carousel */}
        <Section delay={0.3}>
          <PhotoCarousel />
        </Section>

        {/* POSIÇÃO 3: Entre Photo e Quick Access - Final do Conteúdo (4 banners) */}
        {getBannersForPosition('pos-3').length > 0 && (
          <Section delay={0.35} className="px-4">
            <BannerCarousel
              banners={getBannersForPosition('pos-3')}
              onBannerClick={(banner) => trackBannerClick(banner, 'photo-quick')}
              className="mb-4"
              autoplayDelay={5000}
            />
          </Section>
        )}

        {/* Quick Access Menu */}
        <Section delay={0.4} className="px-4">
          <QuickAccess />
        </Section>

        {/* POSIÇÃO 4: Antes dos Créditos - Última Impressão (3 banners) */}
        {getBannersForPosition('pos-4').length > 0 && (
          <Section delay={0.45} className="px-4">
            <BannerCarousel
              banners={getBannersForPosition('pos-4')}
              onBannerClick={(banner) => trackBannerClick(banner, 'before-credits')}
              className="mb-4"
              autoplayDelay={4500}
            />
          </Section>
        )}

        {/* Support Sponsors Carousel - 2x2 Grid com 15 logos */}
        {!sponsorsLoading && supportSponsors.length > 0 && (
          <Section delay={0.5} className="px-4">
            <SponsorCarousel
              sponsors={supportSponsors}
              title="Nossos Apoiadores"
              onSponsorClick={(sponsor) => trackSponsorClick(sponsor.id, sponsor.category)}
              itemsPerPage={6} // 3x2 grid para mostrar 6 por página
              autoplayDelay={4000}
            />
          </Section>
        )}

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Section delay={0.55} className="px-4">
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <p>Debug: {totalPositions} posições com banners ativos</p>
              <p>Total banners: {shuffledBanners.length}</p>
              <p>Apoiadores: {supportSponsors.length}</p>
              <p>Posição 1: {getBannersForPosition('pos-1').length} banners</p>
              <p>Posição 2: {getBannersForPosition('pos-2').length} banners</p>
              <p>Posição 3: {getBannersForPosition('pos-3').length} banners</p>
              <p>Posição 4: {getBannersForPosition('pos-4').length} banners</p>
            </div>
          </Section>
        )}

        {/* Créditos */}
        <Section delay={0.6} className="px-4 text-center text-sm text-foreground/70">
          <div className="space-y-1">
            <p>Tecnologia criada por: Anderson Marques Vieira (Hype Neural)</p>
            <p>Fotografias e Vídeos por: Estúdio Evydência</p>
          </div>
        </Section>

        {/* Bottom spacing for safe area */}
        <div className="h-8" />
      </main>

      {/* Fixed Navigation Elements */}
      <BottomNavigation />
      
      {/* PWA Features */}
      <PWAInstaller />
    </div>
  );
};

export default Index;
