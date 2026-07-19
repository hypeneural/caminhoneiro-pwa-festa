import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';
import type { SponsorPhotoBrand } from '@/types/sponsorGallery';

interface SponsorPhotoMarkProps {
  brand: SponsorPhotoBrand;
  variant?: 'thumbnail' | 'lightbox';
  aspectRatio?: number;
}

const getLightboxMarkSize = (aspectRatio: number): string => {
  const safeAspectRatio = aspectRatio > 0 ? aspectRatio : 1;

  return safeAspectRatio >= 1
    ? `min(18vh, ${18 / safeAspectRatio}vw)`
    : `min(18vw, ${18 * safeAspectRatio}vh)`;
};

export const SponsorPhotoMark = ({
  brand,
  variant = 'thumbnail',
  aspectRatio = 1,
}: SponsorPhotoMarkProps) => (
  <div
    className={cn(
      'pointer-events-none absolute z-[2] aspect-square overflow-hidden rounded-lg bg-white/95 shadow-lg ring-1 ring-black/10',
      variant === 'thumbnail'
        ? 'bottom-2 right-2 w-[18%]'
        : 'bottom-4 right-4 sm:bottom-6 sm:right-6',
    )}
    style={
      variant === 'lightbox'
        ? {
            width: getLightboxMarkSize(aspectRatio),
            height: getLightboxMarkSize(aspectRatio),
          }
        : undefined
    }
    aria-label={`Apoio ${brand.name}`}
  >
    <OptimizedImage
      src={brand.logoUrlWebp || brand.logoUrl}
      fallbackSrc={brand.logoUrl}
      alt={`Logo ${brand.name}`}
      className="h-full w-full object-contain p-[8%]"
      draggable={false}
    />
  </div>
);
