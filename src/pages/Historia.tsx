import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { ParallaxHero } from "@/components/history/ParallaxHero";
import { MobileHero } from "@/components/history/MobileHero";
import { SaintChristopherSection } from "@/components/history/SaintChristopherSection";
import { MobileSaintChristopher } from "@/components/history/MobileSaintChristopher";
import { HistoricalTimeline } from "@/components/history/HistoricalTimeline";
import { TestimonialsSection } from "@/components/history/TestimonialCard";
import { HistoricalGallery } from "@/components/history/HistoricalGallery";
import { StatisticsSection } from "@/components/history/StatisticsSection";
import { TraditionsSection } from "@/components/history/TraditionsSection";
import { LegacySection } from "@/components/history/LegacySection";
import { useIsMobile } from "@/hooks/use-mobile";
import { BannerCarousel } from "@/components/sponsors/BannerCarousel";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import { LiveRouteBanner } from "@/components/tracker/LiveRouteBanner";

const Historia = () => {
  const isMobile = useIsMobile();
  const { banners } = useAdvertisements({ position: 'home' });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <LiveRouteBanner />
      {banners.length > 0 && (
        <div className="px-4 py-2 bg-muted/20">
          <BannerCarousel
            banners={banners}
            showControls={true}
            showDots={true}
            className="rounded-lg shadow-md"
            autoplayDelay={5000}
            compact={true}
          />
        </div>
      )}
      
      {/* Hero Section - Mobile or Desktop */}
      {isMobile ? <MobileHero /> : <ParallaxHero />}
      
      {/* Main Content */}
      <main id="historia-content" className="relative z-10">
        {/* São Cristóvão Section - Mobile or Desktop */}
        {isMobile ? <MobileSaintChristopher /> : <SaintChristopherSection />}
        
        {/* Historical Timeline */}
        <HistoricalTimeline />
        
        {/* Testimonials */}
        <TestimonialsSection />
        
        {/* Historical Gallery */}
        <HistoricalGallery />
        
        
        {/* Statistics */}
        <StatisticsSection />
        
        {/* Traditions */}
        <TraditionsSection />
        
        {/* Legacy and Future */}
        <LegacySection />
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Historia;