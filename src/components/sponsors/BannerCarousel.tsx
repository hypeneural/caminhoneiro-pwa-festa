
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Banner } from '@/types/sponsors';
import { cn } from '@/lib/utils';

interface BannerCarouselProps {
  banners: Banner[];
  autoplayDelay?: number;
  className?: string;
  showControls?: boolean;
  showDots?: boolean;
  onBannerClick?: (banner: Banner) => void;
}

export function BannerCarousel({
  banners,
  autoplayDelay = 5000,
  className,
  showControls = true,
  showDots = true,
  onBannerClick
}: BannerCarouselProps) {
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

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 3000);
  }, []);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

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
        className="relative w-full aspect-[3/1] sm:aspect-[16/5]"
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
                alt={banners[currentIndex].altText}
                fallbackSrc={banners[currentIndex].imageUrl}
                className="w-full h-full object-cover"
                priority={currentIndex === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
              
              {/* Overlay on hover/active */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 group-active:bg-black/20 transition-all duration-200 flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-80 group-active:opacity-100 transition-all duration-200" />
              </div>

              {/* Banner info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 sm:p-4">
                <h3 className="text-white font-semibold text-sm sm:text-base truncate">
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
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Loading indicator for current banner */}
      {isAutoplayActive && banners.length > 1 && (
        <div className="absolute top-2 right-2">
          <div className="w-1 h-8 bg-white/20 rounded-full overflow-hidden">
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
