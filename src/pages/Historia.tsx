import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { ParallaxHero } from "@/components/history/ParallaxHero";
import { SaintChristopherSection } from "@/components/history/SaintChristopherSection";
import { HistoricalTimeline } from "@/components/history/HistoricalTimeline";
import { TestimonialsSection } from "@/components/history/TestimonialCard";
import { HistoricalGallery } from "@/components/history/HistoricalGallery";
import { StatisticsSection } from "@/components/history/StatisticsSection";
import { TraditionsSection } from "@/components/history/TraditionsSection";
import { LegacySection } from "@/components/history/LegacySection";

const Historia = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Parallax Hero Section */}
      <ParallaxHero />
      
      {/* Main Content */}
      <main id="historia-content" className="relative z-10">
        {/* São Cristóvão Section */}
        <SaintChristopherSection />
        
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