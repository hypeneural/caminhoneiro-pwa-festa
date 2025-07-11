import { Section } from "@/components/layout/Section";
import { CountdownTimer } from "@/components/mobile/CountdownTimer";
import { ProgramPreview } from "@/components/mobile/ProgramPreview";
import { WeatherSection } from "@/components/weather/WeatherSection";
import { PollCard } from "@/components/mobile/PollCard";
import { SaoCristovaoTracker } from "@/components/mobile/SaoCristovaoTracker";
import { NewsCarousel } from "@/components/mobile/NewsCarousel";
import { PhotoCarousel } from "@/components/mobile/PhotoCarousel";
import { QuickAccess } from "@/components/mobile/QuickAccess";
import { ShortsCarousel } from "@/components/shorts/ShortsCarousel";

export const ContentSections = () => {
  return (
    <>
      {/* Seção 1: Countdown e Programação */}
      <Section delay={0.2} className="px-4 mb-6">
        <CountdownTimer />
      </Section>
      
      <Section delay={0.25} className="px-4 mb-6">
        <ProgramPreview />
      </Section>

      {/* Seção 2: Shorts do YouTube */}
      <Section delay={0.29} className="mb-6">
        <ShortsCarousel />
      </Section>

      {/* Seção 3: Previsão do Tempo */}
      <Section delay={0.33} className="px-4 mb-6">
        <WeatherSection />
      </Section>

      {/* Seção 4: Enquete */}
      <Section delay={0.37} className="px-4 mb-6">
        <PollCard />
      </Section>

      {/* Seção 5: São Cristóvão Tracker */}
      <Section delay={0.45} className="px-4 mb-6">
        <SaoCristovaoTracker />
      </Section>

      {/* Seção 6: Notícias */}
      <Section delay={0.55} className="px-4 mb-6">
        <NewsCarousel />
      </Section>

      {/* Seção 7: Fotos */}
      <Section delay={0.6} className="px-4 mb-6">
        <PhotoCarousel />
      </Section>

      {/* Seção 8: Acesso Rápido */}
      <Section delay={0.65} className="px-4 mb-6">
        <QuickAccess />
      </Section>
    </>
  );
};