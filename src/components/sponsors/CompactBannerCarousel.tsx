import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Banner } from '@/types/sponsors';
import { cn } from '@/lib/utils';

interface CompactBannerCarouselProps {
  banners: Banner[];
  autoplayDelay?: number;
  className?: string;
  showControls?: boolean;
  showDots?: boolean;
  onBannerClick?: (banner: Banner) => void;
}

export function CompactBannerCarousel({
  banners,
  autoplayDelay = 4000,
  className,
  showControls = false,
  showDots = true,
  onBannerClick
}: CompactBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoplayRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Navigation functions
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 3000);
  }, [banners.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 3000);
  }, [banners.length]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsAutoplayActive(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setTimeout(() => setIsAutoplayActive(true), 3000);
  };

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
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-muted/20",
        className
      )}
      onMouseEnter={() => setIsAutoplayActive(false)}
      onMouseLeave={() => setIsAutoplayActive(true)}
    >
      {/* Banner Container */}
      <div 
        className="relative w-full aspect-[3/1]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
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
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1080px"
              />
              
              {/* Overlay on hover/active */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 group-active:bg-black/20 transition-all duration-200 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-80 group-active:opacity-100 transition-all duration-200" />
              </div>

              {/* Banner info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-3">
                <h3 className="text-white font-semibold text-sm truncate">
                  {banners[currentIndex].title}
                </h3>
              </div>
            </TouchFeedback>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      {showControls && banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && banners.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoplayActive(false);
                setTimeout(() => setIsAutoplayActive(true), 3000);
              }}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-white w-3"
                  : "bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}