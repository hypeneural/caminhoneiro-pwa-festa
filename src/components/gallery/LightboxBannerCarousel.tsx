import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, X, ChevronUp, ChevronDown } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Banner } from '@/types/sponsors';

interface LightboxBannerCarouselProps {
  banners: Banner[];
  autoplayDelay?: number;
  onBannerClick?: (banner: Banner) => void;
  onBannerImpression?: (banner: Banner) => void;
  className?: string;
  isVisible?: boolean;
}

export const LightboxBannerCarousel: React.FC<LightboxBannerCarouselProps> = ({
  banners,
  autoplayDelay = 6000,
  onBannerClick,
  onBannerImpression,
  className = '',
  isVisible = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const autoplayRef = useRef<NodeJS.Timeout>();
  const impressionSent = useRef(new Set<number>());

  // Filtra banners ativos
  const activeBanners = banners.filter(banner => banner.isActive !== false);

  // Autoplay logic
  useEffect(() => {
    if (!isAutoplayActive || activeBanners.length <= 1 || !isVisible) return;

    autoplayRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, autoplayDelay);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isAutoplayActive, activeBanners.length, autoplayDelay, isVisible]);

  // Track impressions
  useEffect(() => {
    if (!isVisible || activeBanners.length === 0) return;
    
    const currentBanner = activeBanners[currentIndex];
    if (currentBanner && !impressionSent.current.has(currentBanner.id)) {
      impressionSent.current.add(currentBanner.id);
      onBannerImpression?.(currentBanner);
    }
  }, [currentIndex, activeBanners, isVisible, onBannerImpression]);

  // Navigation
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 5000); // Resume autoplay after 5s
  }, [activeBanners.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 5000);
  }, [activeBanners.length]);

  // Click handler
  const handleBannerClick = useCallback((banner: Banner) => {
    onBannerClick?.(banner);
    
    if (banner.linkUrl) {
      window.open(banner.linkUrl, banner.target || '_blank');
    }
  }, [onBannerClick]);

  // Collapse/expand
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  if (!isVisible || activeBanners.length === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ 
        y: isCollapsed ? 80 : 0, 
        opacity: 1 
      }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className={`fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-white/10 ${className}`}
    >
      {/* Collapse/Expand button */}
      <button
        onClick={toggleCollapse}
        className="absolute -top-8 right-4 bg-black/80 text-white p-2 rounded-t-lg hover:bg-black transition-colors"
        aria-label={isCollapsed ? 'Expandir banner' : 'Recolher banner'}
      >
        {isCollapsed ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
      </button>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative h-24 md:h-32">
              {/* Banner Content */}
              <div 
                className="flex items-center h-full px-4 cursor-pointer group"
                onClick={() => handleBannerClick(currentBanner)}
              >
                {/* Banner Image */}
                <div className="relative w-32 md:w-48 h-16 md:h-24 rounded-lg overflow-hidden flex-shrink-0 mr-4">
                  <OptimizedImage
                    src={currentBanner.imageUrlWebp || currentBanner.imageUrl}
                    fallbackSrc={currentBanner.imageUrl}
                    alt={currentBanner.altText || currentBanner.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    sizes="(max-width: 768px) 128px, 192px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Banner Text */}
                <div className="flex-1 text-white min-w-0">
                  <h3 className="font-medium text-sm md:text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {currentBanner.title}
                  </h3>
                  {currentBanner.description && (
                    <p className="text-xs md:text-sm text-white/80 line-clamp-2 mb-2">
                      {currentBanner.description}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-white/60">
                    <span className="bg-white/20 px-2 py-1 rounded-full mr-2">Publicidade</span>
                    <ExternalLink size={12} className="mr-1" />
                    <span>Clique para saber mais</span>
                  </div>
                </div>

                {/* External link icon */}
                <div className="flex-shrink-0 text-white/60 group-hover:text-white transition-colors">
                  <ExternalLink size={20} />
                </div>
              </div>

              {/* Navigation controls */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrev();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                    aria-label="Banner anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                    aria-label="Próximo banner"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* Progress indicators */}
              {activeBanners.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                  {activeBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(index);
                        setIsAutoplayActive(false);
                        setTimeout(() => setIsAutoplayActive(true), 5000);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? 'bg-white scale-125'
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Ir para banner ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Autoplay progress bar */}
              {isAutoplayActive && activeBanners.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ 
                      duration: autoplayDelay / 1000,
                      ease: "linear",
                      repeat: Infinity 
                    }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 