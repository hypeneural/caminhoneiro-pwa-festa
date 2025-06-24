
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { SponsorLogo } from '@/types/sponsors';
import { cn } from '@/lib/utils';

interface SponsorCarouselProps {
  sponsors: SponsorLogo[];
  title?: string;
  className?: string;
  itemsPerPage?: number;
  autoplayDelay?: number;
  onSponsorClick?: (sponsor: SponsorLogo) => void;
}

export function SponsorCarousel({
  sponsors,
  title = "Nossos Apoiadores",
  className,
  itemsPerPage = 6, // 3x2 grid para 6 itens por página
  autoplayDelay = 4000,
  onSponsorClick
}: SponsorCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);

  // Calculate total pages
  const totalPages = Math.ceil(sponsors.length / itemsPerPage);
  const currentSponsors = sponsors.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Autoplay logic
  useEffect(() => {
    if (!isAutoplayActive || totalPages <= 1) return;

    const interval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [isAutoplayActive, totalPages, autoplayDelay]);

  // Navigation functions
  const goToNext = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 3000);
  };

  const goToPrev = () => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
    setIsAutoplayActive(false);
    setTimeout(() => setIsAutoplayActive(true), 3000);
  };

  // Handle sponsor click
  const handleSponsorClick = (sponsor: SponsorLogo) => {
    if (sponsor.websiteUrl) {
      window.open(sponsor.websiteUrl, '_blank', 'noopener,noreferrer');
    }
    onSponsorClick?.(sponsor);
  };

  if (sponsors.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            {title}
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-trucker-blue to-trucker-yellow mx-auto rounded-full" />
        </motion.div>
      )}

      <div 
        className="relative"
        onMouseEnter={() => setIsAutoplayActive(false)}
        onMouseLeave={() => setIsAutoplayActive(true)}
      >
        {/* Sponsors Grid - 3x2 Layout */}
        <div className="relative overflow-hidden rounded-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-3 grid-rows-2 gap-2 sm:gap-3"
            >
              {currentSponsors.map((sponsor, index) => (
                <motion.div
                  key={sponsor.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <TouchFeedback
                    onClick={() => handleSponsorClick(sponsor)}
                    scale={0.95}
                    haptic={true}
                    className="relative bg-background border border-border/50 rounded-xl p-2 sm:p-3 hover:border-trucker-blue/50 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Logo Container */}
                    <div className="relative aspect-square mb-1 overflow-hidden rounded-lg bg-white/5">
                      <OptimizedImage
                        src={sponsor.logoUrlWebp || sponsor.logoUrl}
                        alt={sponsor.altText}
                        fallbackSrc={sponsor.logoUrl}
                        className="w-full h-full object-contain p-1"
                        sizes="120px"
                      />
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-trucker-blue/0 group-hover:bg-trucker-blue/10 transition-all duration-300 flex items-center justify-center">
                        <ExternalLink className="w-3 h-3 text-trucker-blue opacity-0 group-hover:opacity-70 transition-all duration-300" />
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="text-center">
                      <h4 className="font-medium text-xs text-foreground group-hover:text-trucker-blue transition-colors duration-300 line-clamp-1">
                        {sponsor.companyName}
                      </h4>
                    </div>
                  </TouchFeedback>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        {totalPages > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm z-10"
              aria-label="Apoiadores anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm z-10"
              aria-label="Próximos apoiadores"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Page Indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentPage
                    ? "bg-trucker-blue w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Ir para página ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
