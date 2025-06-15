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

const Historia = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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