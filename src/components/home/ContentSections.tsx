import { lazy, Suspense } from "react";
import { Section } from "@/components/layout/Section";
import { ProgramPreview } from "@/components/mobile/ProgramPreview";
import { QuickAccess } from "@/components/mobile/QuickAccess";
import { BannerCarousel } from "@/components/sponsors/BannerCarousel";
import { CompactBannerCarousel } from "@/components/sponsors/CompactBannerCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyHomeSection } from "./LazyHomeSection";
import { HomeProcessionCard } from "./HomeProcessionCard";

const LazyShortsCarousel = lazy(() =>
  import("@/components/shorts/ShortsCarousel").then((module) => ({ default: module.ShortsCarousel }))
);
const LazyHomePodcastSection = lazy(() =>
  import("./HomePodcastSection").then((module) => ({ default: module.HomePodcastSection }))
);
const LazyWeatherSection = lazy(() =>
  import("@/components/weather/WeatherSection").then((module) => ({ default: module.WeatherSection }))
);
const LazyPhotoCarousel = lazy(() =>
  import("@/components/mobile/PhotoCarousel").then((module) => ({ default: module.PhotoCarousel }))
);
const LazyPollCard = lazy(() =>
  import("@/components/mobile/PollCard").then((module) => ({ default: module.PollCard }))
);

interface ContentSectionsProps {
  bannersByPosition: Record<number, any[]>;
  isLoading: boolean;
}

const SectionFallback = ({ className = "min-h-52" }: { className?: string }) => (
  <Skeleton className={`${className} w-full rounded-2xl`} />
);

export const ContentSections = ({ bannersByPosition, isLoading }: ContentSectionsProps) => {
  const hasBannersInPosition = (position: number) =>
    Array.isArray(bannersByPosition[position]) && bannersByPosition[position].length > 0;

  const renderBanner = (position: number, delay: number, compact = false) => {
    if (isLoading || !hasBannersInPosition(position)) return null;

    const Carousel = compact ? CompactBannerCarousel : BannerCarousel;

    return (
      <Section delay={delay} className="px-4 mb-4">
        <Carousel
          banners={bannersByPosition[position]}
          autoplayDelay={compact ? 3800 : 5000}
          showControls={!compact}
          showDots={true}
        />
      </Section>
    );
  };

  return (
    <>
      <Section delay={0.05} className="px-4 mt-4 mb-4">
        <ProgramPreview />
      </Section>

      <Section delay={0.08} className="mb-2">
        <QuickAccess />
      </Section>

      {renderBanner(1, 0.12)}
      {renderBanner(9, 0.14, true)}

      <Section delay={0.16} className="px-4 mb-6">
        <LazyHomeSection minHeight="min-h-44">
          <Suspense fallback={<SectionFallback className="min-h-44" />}>
            <LazyPollCard />
          </Suspense>
        </LazyHomeSection>
      </Section>

      <Section delay={0.18} className="px-4 mb-6">
        <LazyHomeSection minHeight="min-h-48">
          <Suspense fallback={<SectionFallback className="min-h-48" />}>
            <LazyShortsCarousel />
          </Suspense>
        </LazyHomeSection>
      </Section>

      <Section delay={0.2} className="mb-6">
        <LazyHomeSection minHeight="min-h-44">
          <Suspense fallback={<SectionFallback className="min-h-44" />}>
            <LazyHomePodcastSection />
          </Suspense>
        </LazyHomeSection>
      </Section>

      {renderBanner(2, 0.22)}

      <Section delay={0.24} className="px-4 mb-6">
        <LazyHomeSection minHeight="min-h-44">
          <Suspense fallback={<SectionFallback className="min-h-44" />}>
            <LazyWeatherSection />
          </Suspense>
        </LazyHomeSection>
      </Section>

      {renderBanner(3, 0.26)}

      <Section delay={0.28} className="px-4 mb-6">
        <HomeProcessionCard />
      </Section>

      {renderBanner(10, 0.3, true)}
      {renderBanner(4, 0.32)}

      {renderBanner(5, 0.36)}

      <Suspense fallback={null}>
        <LazyPhotoCarousel />
      </Suspense>

      {renderBanner(11, 0.4, true)}
      {renderBanner(6, 0.42)}
      {renderBanner(12, 0.44, true)}
    </>
  );
};
