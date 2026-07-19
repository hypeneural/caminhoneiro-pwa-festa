import { BannerCarousel } from '@/components/sponsors/BannerCarousel';
import { OptimizedImage } from '@/components/ui/optimized-image';
import type { SponsorGalleryBranding } from '@/types/sponsorGallery';

interface SponsorGalleryHeaderProps {
  branding: SponsorGalleryBranding | null;
  isLoading: boolean;
  error: string | null;
}

export const SponsorGalleryHeader = ({
  branding,
  isLoading,
  error,
}: SponsorGalleryHeaderProps) => {
  if (isLoading) {
    return (
      <div className="px-4 py-2 bg-muted/20">
        <div className="w-full aspect-[3/1] animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 my-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center">
        <h2 className="font-semibold text-foreground">Galeria indisponível</h2>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <a
          href="/galeria"
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Abrir galeria principal
        </a>
      </div>
    );
  }

  if (!branding) return null;

  return (
    <div className="px-4 py-2 bg-muted/20">
      {branding.banner ? (
        <BannerCarousel
          banners={[branding.banner]}
          showControls={false}
          showDots={false}
          className="rounded-lg shadow-md"
          compact
        />
      ) : (
        <a
          href={branding.websiteUrl || undefined}
          target={branding.websiteUrl ? '_blank' : undefined}
          rel={branding.websiteUrl ? 'noopener noreferrer' : undefined}
          className="flex aspect-[3/1] w-full items-center justify-center gap-4 overflow-hidden rounded-lg bg-white px-6 shadow-md"
        >
          <OptimizedImage
            src={branding.logoUrlWebp || branding.logoUrl}
            fallbackSrc={branding.logoUrl}
            alt={`Logo ${branding.name}`}
            className="h-[72%] w-auto max-w-[38%] object-contain"
            priority
          />
          <div className="text-left text-foreground">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Galeria com apoio de
            </span>
            <strong className="line-clamp-2 text-base sm:text-xl">{branding.name}</strong>
          </div>
        </a>
      )}
    </div>
  );
};
