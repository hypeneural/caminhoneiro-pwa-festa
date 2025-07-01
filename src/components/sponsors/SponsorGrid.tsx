import { useState, useCallback, useEffect, useMemo } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { SponsorLogo } from '@/types/sponsors';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SponsorGridProps {
  sponsors: SponsorLogo[];
  onSponsorClick?: (sponsor: SponsorLogo) => void;
  className?: string;
  autoplayDelay?: number;
}

// Função para randomizar array usando Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function SponsorGrid({ 
  sponsors, 
  onSponsorClick, 
  className,
  autoplayDelay = 4000 // 4 segundos por padrão para um ritmo mais dinâmico
}: SponsorGridProps) {
  // Randomiza os patrocinadores apenas uma vez na montagem do componente
  const randomizedSponsors = useMemo(() => shuffleArray(sponsors), [sponsors]);
  
  const [currentPage, setCurrentPage] = useState(0);
  const sponsorsPerPage = 9; // 3x3 grid
  const totalPages = Math.ceil(randomizedSponsors.length / sponsorsPerPage);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>();

  // Auto-rotation
  useEffect(() => {
    if (totalPages <= 1 || autoplayPaused || !isVisible) return;

    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [totalPages, autoplayPaused, autoplayDelay, isVisible]);

  // Manipulação de gestos touch
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setAutoplayPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setAutoplayPaused(false);
    
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    } else if (isRightSwipe) {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleSponsorClick = (sponsor: SponsorLogo) => {
    if (sponsor.websiteUrl) {
      window.open(sponsor.websiteUrl, '_blank', 'noopener,noreferrer');
    }
    onSponsorClick?.(sponsor);
  };

  const currentSponsors = randomizedSponsors.slice(
    currentPage * sponsorsPerPage,
    (currentPage + 1) * sponsorsPerPage
  );

  if (randomizedSponsors.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full py-4 select-none touch-pan-y", className)}
      onMouseEnter={() => setAutoplayPaused(true)}
      onMouseLeave={() => setAutoplayPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative overflow-hidden px-2 sm:px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="grid grid-cols-3 gap-2 sm:gap-4"
          >
            {currentSponsors.map((sponsor, index) => (
              <motion.div
                key={sponsor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <TouchFeedback
                  onClick={() => handleSponsorClick(sponsor)}
                  className="aspect-square bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  scale={0.95}
                >
                  <div className="relative w-full h-full p-3 sm:p-4">
                    <OptimizedImage
                      src={sponsor.logoUrlWebp}
                      alt={sponsor.companyName}
                      fallbackSrc={sponsor.logoUrl}
                      className="w-full h-full object-contain filter drop-shadow-sm"
                      sizes="(max-width: 640px) 100px, (max-width: 1024px) 150px, 200px"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-2 backdrop-blur-[2px]">
                      <p className="text-white text-xs sm:text-sm text-center font-medium truncate">
                        {sponsor.companyName}
                      </p>
                    </div>
                  </div>
                </TouchFeedback>
              </motion.div>
            ))}
            {/* Preenche espaços vazios para manter o grid 3x3 */}
            {[...Array(Math.max(0, sponsorsPerPage - currentSponsors.length))].map((_, index) => (
              <div
                key={`empty-${index}`}
                className="aspect-square bg-transparent"
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls - Apenas para desktop */}
      {totalPages > 1 && (
        <>
          <button
            onClick={() => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-all duration-300 backdrop-blur-sm"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setCurrentPage((prev) => (prev + 1) % totalPages)}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full items-center justify-center text-white transition-all duration-300 backdrop-blur-sm"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Page Indicators - Otimizado para mobile */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: totalPages }).map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                currentPage === index 
                  ? "bg-primary w-6" 
                  : "bg-gray-300/50 w-1.5 hover:bg-gray-300"
              )}
              whileTap={{ scale: 0.95 }}
              aria-label={`Ir para página ${index + 1} de ${totalPages}`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 