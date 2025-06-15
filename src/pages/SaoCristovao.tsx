import { useRef } from "react";
import { motion } from "framer-motion";
import { HeroSaintChristopher } from "@/components/sao-cristovao/HeroSaintChristopher";
import { HistoryAndLegend } from "@/components/sao-cristovao/HistoryAndLegend";
import { PatronageEvolution } from "@/components/sao-cristovao/PatronageEvolution";
import { BrazilianDevotion } from "@/components/sao-cristovao/BrazilianDevotion";
import { ConclusionSection } from "@/components/sao-cristovao/ConclusionSection";
import { FloatingNavigation } from "@/components/sao-cristovao/FloatingNavigation";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";

const SaoCristovao = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToContent = () => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <div id="hero">
          <HeroSaintChristopher onScrollToContent={scrollToContent} />
        </div>

        {/* Introduction Quote */}
        <motion.section
          ref={contentRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 px-4 bg-gradient-to-b from-muted/30 to-background"
        >
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-2xl md:text-3xl font-light text-muted-foreground leading-relaxed mb-8" style={{ fontFamily: 'serif' }}>
              "Como o gigante que carregou o Cristo, os caminhoneiros modernos carregam sobre seus ombros 
              não apenas cargas, mas a responsabilidade de manter um país inteiro em movimento."
            </blockquote>
            <cite className="text-trucker-blue font-medium">
              — Reflexão sobre a devoção a São Cristóvão
            </cite>
          </div>
        </motion.section>

        {/* Content Sections */}
        <div id="history">
          <HistoryAndLegend />
        </div>

        <div id="patronage">
          <PatronageEvolution />
        </div>

        <div id="brazil">
          <BrazilianDevotion />
        </div>

        <div id="conclusion">
          <ConclusionSection />
        </div>

        {/* Floating Navigation */}
        <FloatingNavigation />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default SaoCristovao;