
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Banner } from '@/types/sponsors';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  banner: Banner;
  position: string;
  className?: string;
  variant?: 'horizontal' | 'square' | 'vertical';
  showLabel?: boolean;
  onClick?: (banner: Banner, position: string) => void;
}

const variantStyles = {
  horizontal: "aspect-[3/1] sm:aspect-[4/1]",
  square: "aspect-square",
  vertical: "aspect-[2/3]"
};

export function AdBanner({
  banner,
  position,
  className,
  variant = 'horizontal',
  showLabel = false,
  onClick
}: AdBannerProps) {
  const handleClick = () => {
    if (banner.linkUrl) {
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
    }
    onClick?.(banner, position);
  };

  if (!banner || !banner.isActive) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      {showLabel && (
        <div className="text-center mb-2">
          <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted/50 rounded-full">
            Publicidade
          </span>
        </div>
      )}
      
      <TouchFeedback
        onClick={handleClick}
        scale={0.98}
        haptic={true}
        className="relative group cursor-pointer overflow-hidden rounded-lg border border-border/30 hover:border-trucker-blue/50 transition-all duration-300"
      >
        <div className={cn("relative w-full", variantStyles[variant])}>
          <OptimizedImage
            src={banner.imageUrlWebp || banner.imageUrl}
            alt={banner.altText}
            fallbackSrc={banner.imageUrl}
            className="w-full h-full object-cover"
            priority={banner.priority === 'high'}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 group-active:bg-black/20 transition-all duration-200 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
            >
              <ExternalLink className="w-5 h-5 text-trucker-blue" />
            </motion.div>
          </div>

          {/* Banner info overlay */}
          {banner.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <h3 className="text-white font-medium text-sm truncate">
                {banner.title}
              </h3>
            </div>
          )}

          {/* Priority indicator */}
          {banner.priority === 'high' && (
            <div className="absolute top-2 left-2">
              <div className="w-2 h-2 bg-trucker-yellow rounded-full animate-pulse" />
            </div>
          )}

          {/* Category badge */}
          <div className={cn(
            "absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
            banner.category === 'patrocinador' && "bg-blue-500/80 text-white",
            banner.category === 'apoiador' && "bg-green-500/80 text-white",
            banner.category === 'promocional' && "bg-orange-500/80 text-white"
          )}>
            {banner.category}
          </div>
        </div>
      </TouchFeedback>
    </motion.div>
  );
}

// Component for multiple banners in a position
interface AdBannerGroupProps {
  banners: Banner[];
  position: string;
  className?: string;
  layout?: 'carousel' | 'grid' | 'stack';
  onBannerClick?: (banner: Banner, position: string) => void;
}

export function AdBannerGroup({
  banners,
  position,
  className,
  layout = 'carousel',
  onBannerClick
}: AdBannerGroupProps) {
  if (banners.length === 0) {
    return null;
  }

  // Single banner
  if (banners.length === 1) {
    return (
      <AdBanner
        banner={banners[0]}
        position={position}
        className={className}
        onClick={onBannerClick}
      />
    );
  }

  // Multiple banners
  switch (layout) {
    case 'grid':
      return (
        <div className={cn("grid gap-3", className)}>
          {banners.length === 2 && "grid-cols-1 sm:grid-cols-2"}
          {banners.length >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}
          {banners.map((banner, index) => (
            <AdBanner
              key={banner.id}
              banner={banner}
              position={`${position}-${index}`}
              onClick={onBannerClick}
            />
          ))}
        </div>
      );

    case 'stack':
      return (
        <div className={cn("space-y-3", className)}>
          {banners.map((banner, index) => (
            <AdBanner
              key={banner.id}
              banner={banner}
              position={`${position}-${index}`}
              onClick={onBannerClick}
            />
          ))}
        </div>
      );

    case 'carousel':
    default:
      // For carousel, we'll use the first banner and rotate through them
      return (
        <AdBanner
          banner={banners[0]}
          position={position}
          className={className}
          onClick={onBannerClick}
        />
      );
  }
}
