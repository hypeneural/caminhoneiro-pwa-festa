
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
    loading: sponsorsLoading
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

  // Get banners for distributed positions
  const bannerPositions = Object.keys(distributedBanners);

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

        {/* Banner Carousel - Hero Banners (Position 1) */}
        {getBannersForPosition('pos-1').length > 0 && (
          <Section delay={0.05} className="px-4">
            <BannerCarousel
              banners={getBannersForPosition('pos-1')}
              onBannerClick={(banner) => trackBannerClick(banner, 'hero-carousel')}
              className="mb-4"
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

        {/* Banner Position 2 */}
        {getBannersForPosition('pos-2').length > 0 && (
          <Section delay={0.15} className="px-4">
            <AdBannerGroup
              banners={getBannersForPosition('pos-2')}
              position="after-program"
              onBannerClick={trackBannerClick}
              layout="carousel"
            />
          </Section>
        )}

        {/* São Cristóvão Tracker */}
        <Section delay={0.2} className="px-4">
          <SaoCristovaoTracker />
        </Section>

        {/* Banner Position 3 */}
        {getBannersForPosition('pos-3').length > 0 && (
          <Section delay={0.25} className="px-4">
            <AdBannerGroup
              banners={getBannersForPosition('pos-3')}
              position="after-tracker"
              onBannerClick={trackBannerClick}
              layout="grid"
            />
          </Section>
        )}

        {/* News Carousel */}
        <Section delay={0.3} className="px-4">
          <NewsCarousel />
        </Section>

        {/* Banner Position 4 */}
        {getBannersForPosition('pos-4').length > 0 && (
          <Section delay={0.35} className="px-4">
            <AdBannerGroup
              banners={getBannersForPosition('pos-4')}
              position="after-news"
              onBannerClick={trackBannerClick}
              layout="carousel"
            />
          </Section>
        )}

        {/* Photo Carousel */}
        <Section delay={0.4}>
          <PhotoCarousel />
        </Section>

        {/* Banner Position 5 */}
        {getBannersForPosition('pos-5').length > 0 && (
          <Section delay={0.45} className="px-4">
            <AdBannerGroup
              banners={getBannersForPosition('pos-5')}
              position="after-photos"
              onBannerClick={trackBannerClick}
              layout="stack"
            />
          </Section>
        )}

        {/* Quick Access Menu */}
        <Section delay={0.5} className="px-4">
          <QuickAccess />
        </Section>

        {/* Banner Position 6 */}
        {getBannersForPosition('pos-6').length > 0 && (
          <Section delay={0.55} className="px-4">
            <AdBannerGroup
              banners={getBannersForPosition('pos-6')}
              position="after-quick-access"
              onBannerClick={trackBannerClick}
              layout="carousel"
            />
          </Section>
        )}

        {/* Banner Position 7 */}
        {getBannersForPosition('pos-7').length > 0 && (
          <Section delay={0.6} className="px-4">
            <AdBannerGroup
              banners={getBannersForPosition('pos-7')}
              position="mid-final"
              onBannerClick={trackBannerClick}
              layout="grid"
            />
          </Section>
        )}

        {/* Support Sponsors Carousel - 2x2 Grid */}
        {!sponsorsLoading && supportSponsors.length > 0 && (
          <Section delay={0.65} className="px-4">
            <SponsorCarousel
              sponsors={supportSponsors}
              title="Nossos Apoiadores"
              onSponsorClick={(sponsor) => trackSponsorClick(sponsor.id, sponsor.category)}
            />
          </Section>
        )}

        {/* Banner Position 8 - Final */}
        {getBannersForPosition('pos-8').length > 0 && (
          <Section delay={0.7} className="px-4">
            <AdBannerGroup
              banners={getBannersForPosition('pos-8')}
              position="before-credits"
              onBannerClick={trackBannerClick}
              layout="carousel"
            />
          </Section>
        )}

        {/* Créditos */}
        <Section delay={0.75} className="px-4 text-center text-sm text-foreground/70">
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
