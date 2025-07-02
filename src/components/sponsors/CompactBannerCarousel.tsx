import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Banner } from '@/types/sponsors';
import { cn } from '@/lib/utils';

interface CompactBannerCarouselProps {
  banners: Banner[];
  autoplayDelay?: number;
  className?: string;
  onBannerClick?: (banner: Banner) => void;
}

export function CompactBannerCarousel({
  banners,
  autoplayDelay = 4000,
  className,
  onBannerClick
}: CompactBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);
  const autoplayRef = useRef<NodeJS.Timeout>();

  // Autoplay logic
  useEffect(() => {
    if (!isAutoplayActive || banners.length <= 1) return;

    autoplayRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, autoplayDelay);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isAutoplayActive, banners.length, autoplayDelay]);

  // Handle banner click
  const handleBannerClick = (banner: Banner) => {
    if (banner.linkUrl) {
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
    }
    onBannerClick?.(banner);
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-muted/20",
        className
      )}
      onMouseEnter={() => setIsAutoplayActive(false)}
      onMouseLeave={() => setIsAutoplayActive(true)}
    >
      {/* Compact Banner Container */}
      <div className="relative w-full aspect-[4/1] sm:aspect-[6/1]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <TouchFeedback
              onClick={() => handleBannerClick(banners[currentIndex])}
              className="relative w-full h-full group cursor-pointer"
              scale={0.98}
            >
              <OptimizedImage
                src={banners[currentIndex].imageUrlWebp || banners[currentIndex].imageUrl}
                alt={banners[currentIndex].altText || banners[currentIndex].title}
                fallbackSrc={banners[currentIndex].imageUrl}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Click indicator */}
              <div className="absolute inset-0 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-80 group-active:opacity-100 transition-all duration-200" />
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <h4 className="text-white font-medium text-xs truncate">
                  {banners[currentIndex].title}
                </h4>
              </div>
            </TouchFeedback>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots - only show if multiple banners */}
      {banners.length > 1 && (
        <div className="absolute bottom-1 right-2 flex gap-1">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto progress indicator */}
      {isAutoplayActive && banners.length > 1 && (
        <div className="absolute top-1 right-1">
          <div className="w-0.5 h-6 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="w-full bg-white/60 rounded-full"
              initial={{ height: "0%" }}
              animate={{ height: "100%" }}
              transition={{ duration: autoplayDelay / 1000, ease: "linear" }}
              key={currentIndex}
            />
          </div>
        </div>
      )}
    </div>
  );
}