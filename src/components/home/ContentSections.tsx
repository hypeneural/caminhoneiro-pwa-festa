import { Section } from "@/components/layout/Section";
import { ProgramPreview } from "@/components/mobile/ProgramPreview";
import { WeatherSection } from "@/components/weather/WeatherSection";
import { PollCard } from "@/components/mobile/PollCard";
import { SaoCristovaoTracker } from "@/components/mobile/SaoCristovaoTracker";
import { NewsCarousel } from "@/components/mobile/NewsCarousel";
import { PhotoCarousel } from "@/components/mobile/PhotoCarousel";
import { QuickAccess } from "@/components/mobile/QuickAccess";
import { ShortsCarousel } from "@/components/shorts/ShortsCarousel";
import { BannerCarousel } from "@/components/sponsors/BannerCarousel";
import { CompactBannerCarousel } from "@/components/sponsors/CompactBannerCarousel";
import { PodcastCarousel } from "@/components/podcast/PodcastCarousel";
import { CamerasCarousel } from "@/components/mobile/CamerasCarousel";
import { usePodcast } from "@/hooks/usePodcast";

interface ContentSectionsProps {
  bannersByPosition: Record<number, any[]>;
  isLoading: boolean;
}

export const ContentSections = ({ bannersByPosition, isLoading }: ContentSectionsProps) => {
  const hasBannersInPosition = (position: number) => {
    const hasBanners = Array.isArray(bannersByPosition[position]) && bannersByPosition[position].length > 0;
    console.log(`🎯 Position ${position} has banners:`, hasBanners, bannersByPosition[position]);
    return hasBanners;
  };

  // Fetch latest podcasts
  const { items: podcasts, loading: podcastsLoading } = usePodcast({
    filters: {
      limit: 5,
      page: 1,
      sort: 'created_at',
      order: 'DESC'
    },
    initialLoad: true
  });

  return (
    <>
      {/* Banner Carousel 1 - Início */}
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

      {/* Seção 1: Programação */}
      <Section delay={0.2} className="px-4 mb-6">
        <ProgramPreview />
      </Section>

      {/* Compact Banner 9 - Após Programação */}
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

      {/* Seção 2: Shorts do YouTube */}
      <Section delay={0.29} className="px-4 mb-6">
        <ShortsCarousel />
      </Section>

      {/* Seção 3: Podcast */}
      {!podcastsLoading && podcasts.length > 0 && (
        <Section delay={0.31} className="mb-6">
          <PodcastCarousel podcasts={podcasts} />
        </Section>
      )}

      {/* Banner Carousel 2 - Após Shorts */}
      {!isLoading && hasBannersInPosition(2) && (
        <Section delay={0.33} className="px-4 mb-6">
          <BannerCarousel 
            banners={bannersByPosition[2]} 
            autoplayDelay={4500}
            showControls={true}
            showDots={true}
          />
        </Section>
      )}

      {/* Seção 4: Previsão do Tempo */}
      <Section delay={0.35} className="px-4 mb-6">
        <WeatherSection />
      </Section>

      {/* Seção 5: Câmeras Ao Vivo */}
      <Section delay={0.37} className="px-4 mb-6">
        <CamerasCarousel />
      </Section>

      {/* Banner Carousel 3 - Após Enquete */}
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

      {/* Seção 6: São Cristóvão Tracker */}
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

      {/* Banner Carousel 4 - Meio da página */}
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

      {/* Seção 7: Notícias */}
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

      {/* Seção 8: Fotos */}
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

      {/* Seção 9: Acesso Rápido */}
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
    </>
  );
};