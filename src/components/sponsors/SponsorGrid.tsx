import { useState, useCallback, useEffect, useMemo } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { SponsorLogo } from '@/types/sponsors';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

interface SponsorGridProps {
  sponsors: SponsorLogo[];
  onSponsorClick?: (sponsor: SponsorLogo) => void;
  className?: string;
  autoplayDelay?: number;
  hasMoreSponsors?: boolean;
  loadMoreSponsors?: () => Promise<void>;
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
  autoplayDelay = 4000, // 4 segundos por padrão para um ritmo mais dinâmico
  hasMoreSponsors = false,
  loadMoreSponsors
}: SponsorGridProps) {
  // Randomiza os patrocinadores apenas uma vez na montagem do componente
  const randomizedSponsors = useMemo(() => shuffleArray(sponsors), [sponsors]);
  
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Setup intersection observer for the loading element
  const { ref: loadMoreTriggerRef, isIntersecting: shouldLoadMore } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '200px'
  });

  // Handle loading more sponsors when the trigger element is visible
  useEffect(() => {
    if (shouldLoadMore && hasMoreSponsors && !isLoadingMore && loadMoreSponsors) {
      setIsLoadingMore(true);
      loadMoreSponsors()
        .then(() => {
          setIsLoadingMore(false);
        })
        .catch((error) => {
          console.error('Error loading more sponsors:', error);
          setIsLoadingMore(false);
        });
    }
  }, [shouldLoadMore, hasMoreSponsors, isLoadingMore, loadMoreSponsors]);

  const handleSponsorClick = (sponsor: SponsorLogo) => {
    if (sponsor.websiteUrl) {
      window.open(sponsor.websiteUrl, '_blank', 'noopener,noreferrer');
    }
    onSponsorClick?.(sponsor);
  };

  if (randomizedSponsors.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Nossos Apoiadores
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-trucker-blue to-trucker-yellow mx-auto rounded-full" />
      </motion.div>

      {/* Sponsors Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
        {randomizedSponsors.map((sponsor, index) => (
          <motion.div
            key={sponsor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 1) }}
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
      </div>

      {/* Loading More Trigger & Indicator */}
      {hasMoreSponsors && (
        <div 
          ref={loadMoreTriggerRef}
          className="flex justify-center items-center mt-6 h-16"
        >
          {isLoadingMore ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <div className="w-5 h-5 border-2 border-trucker-blue/30 border-t-trucker-blue rounded-full animate-spin" />
              <span className="text-sm">Carregando mais apoiadores...</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground"
            >
              Role para ver mais apoiadores
            </motion.div>
          )}
        </div>
      )}

      {/* End indicator when no more sponsors */}
      {!hasMoreSponsors && randomizedSponsors.length > 10 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center mt-6 py-4"
        >
          <div className="text-center">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Todos os apoiadores foram carregados
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
} 