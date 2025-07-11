import { Section } from "@/components/layout/Section";
import { BannerCarousel } from "@/components/sponsors/BannerCarousel";
import { CompactBannerCarousel } from "@/components/sponsors/CompactBannerCarousel";

interface BannerSectionsProps {
  bannersByPosition: Record<number, any[]>;
  isLoading: boolean;
}

export const BannerSections = ({ bannersByPosition, isLoading }: BannerSectionsProps) => {
  const hasBannersInPosition = (position: number) => {
    const hasbanners = Array.isArray(bannersByPosition[position]) && bannersByPosition[position].length > 0;
    console.log(`🎯 Position ${position} has banners:`, hasbanners, bannersByPosition[position]);
    return hasbanners;
  };

  return (
    <>
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

      {/* Compact Banner 9 - Entre Programação e Enquete */}
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