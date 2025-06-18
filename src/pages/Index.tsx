import { motion } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { Stories } from "@/components/mobile/Stories";
import { SaoCristovaoTracker } from "@/components/mobile/SaoCristovaoTracker";
import { CountdownTimer } from "@/components/mobile/CountdownTimer";
import { NewsCarousel } from "@/components/mobile/NewsCarousel";
import { PhotoCarousel } from "@/components/mobile/PhotoCarousel";
import { QuickAccess } from "@/components/mobile/QuickAccess";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { PWAInstaller } from "@/components/PWAInstaller";
import { ProgramPreview } from "@/components/mobile/ProgramPreview";
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
  }, []); // Remove as dependências para evitar o loop


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

        {/* Countdown Timer - Second */}
        <Section delay={0.1} className="px-4">
          <div className="space-y-4">
            <CountdownTimer />
            <ProgramPreview />
          </div>
        </Section>

        {/* São Cristóvão Tracker */}
        <Section 
          delay={0.2} 
          className="px-4"
        >
          <SaoCristovaoTracker />
        </Section>

        {/* News Carousel */}
        <Section 
          delay={0.3} 
          className="px-4"
        >
          <NewsCarousel />
        </Section>

        {/* Photo Carousel */}
        <Section 
          delay={0.4}
        >
          <PhotoCarousel />
        </Section>

        {/* Quick Access Menu */}
        <Section 
          delay={0.5} 
          className="px-4"
        >
          <QuickAccess />
        </Section>

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
