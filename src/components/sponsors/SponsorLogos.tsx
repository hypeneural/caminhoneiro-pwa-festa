
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { SponsorLogo } from '@/types/sponsors';
import { cn } from '@/lib/utils';

interface SponsorLogosProps {
  sponsors: SponsorLogo[];
  title?: string;
  className?: string;
  maxVisible?: number;
  onSponsorClick?: (sponsor: SponsorLogo) => void;
}

const categoryLabels = {
  diamante: 'Patrocinadores Diamante',
  ouro: 'Patrocinadores Ouro',
  prata: 'Patrocinadores Prata',
  bronze: 'Patrocinadores Bronze',
  apoiador: 'Apoiadores'
};

const categoryColors = {
  diamante: 'from-blue-400 to-blue-600',
  ouro: 'from-yellow-400 to-yellow-600',
  prata: 'from-gray-300 to-gray-500',
  bronze: 'from-amber-600 to-amber-800',
  apoiador: 'from-green-400 to-green-600'
};

export function SponsorLogos({
  sponsors,
  title,
  className,
  maxVisible,
  onSponsorClick
}: SponsorLogosProps) {
  // Group sponsors by category
  const sponsorsByCategory = sponsors.reduce((acc, sponsor) => {
    if (!acc[sponsor.category]) {
      acc[sponsor.category] = [];
    }
    acc[sponsor.category].push(sponsor);
    return acc;
  }, {} as Record<string, SponsorLogo[]>);

  // Handle sponsor click
  const handleSponsorClick = (sponsor: SponsorLogo) => {
    if (sponsor.websiteUrl) {
      window.open(sponsor.websiteUrl, '_blank', 'noopener,noreferrer');
    }
    onSponsorClick?.(sponsor);
  };

  const visibleSponsors = maxVisible ? sponsors.slice(0, maxVisible) : sponsors;

  if (sponsors.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
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

      {/* Show by categories if sponsors are grouped */}
      {Object.keys(sponsorsByCategory).length > 1 ? (
        <div className="space-y-8">
          {Object.entries(sponsorsByCategory).map(([category, categorySponsors], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="space-y-4"
            >
              {/* Category Header */}
              <div className="text-center">
                <h3 className={cn(
                  "text-lg font-semibold bg-gradient-to-r bg-clip-text text-transparent",
                  categoryColors[category as keyof typeof categoryColors] || 'from-gray-600 to-gray-800'
                )}>
                  {categoryLabels[category as keyof typeof categoryLabels] || category}
                </h3>
              </div>

              {/* Sponsors Grid */}
              <div className={cn(
                "grid gap-4",
                categorySponsors.length >= 6 ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" :
                categorySponsors.length >= 4 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" :
                "grid-cols-2 sm:grid-cols-3"
              )}>
                {categorySponsors.map((sponsor, index) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    index={index}
                    onClick={() => handleSponsorClick(sponsor)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Simple grid layout for single category or mixed sponsors */
        <div className={cn(
          "grid gap-4",
          visibleSponsors.length >= 6 ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" :
          visibleSponsors.length >= 4 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" :
          "grid-cols-2 sm:grid-cols-3"
        )}>
          {visibleSponsors.map((sponsor, index) => (
            <SponsorCard
              key={sponsor.id}
              sponsor={sponsor}
              index={index}
              onClick={() => handleSponsorClick(sponsor)}
            />
          ))}
        </div>
      )}

      {/* Show more indicator */}
      {maxVisible && sponsors.length > maxVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground"
        >
          +{sponsors.length - maxVisible} patrocinadores
        </motion.div>
      )}
    </div>
  );
}

// Individual Sponsor Card Component
interface SponsorCardProps {
  sponsor: SponsorLogo;
  index: number;
  onClick: () => void;
}

function SponsorCard({ sponsor, index, onClick }: SponsorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <TouchFeedback
        onClick={onClick}
        scale={0.95}
        haptic={true}
        className="relative bg-background border border-border/50 rounded-xl p-3 sm:p-4 hover:border-trucker-blue/50 hover:shadow-lg transition-all duration-300"
      >
        {/* Logo Container */}
        <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-white/5">
          <OptimizedImage
            src={sponsor.logoUrlWebp || sponsor.logoUrl}
            alt={sponsor.altText}
            fallbackSrc={sponsor.logoUrl}
            className="w-full h-full object-contain p-2"
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-trucker-blue/0 group-hover:bg-trucker-blue/10 transition-all duration-300 flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-trucker-blue opacity-0 group-hover:opacity-70 transition-all duration-300" />
          </div>
        </div>

        {/* Company Name */}
        <div className="text-center">
          <h4 className="font-medium text-sm sm:text-base text-foreground group-hover:text-trucker-blue transition-colors duration-300 line-clamp-2">
            {sponsor.companyName}
          </h4>
          
          {/* Category badge */}
          <div className={cn(
            "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
            sponsor.category === 'diamante' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
            sponsor.category === 'ouro' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            sponsor.category === 'prata' && "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
            sponsor.category === 'bronze' && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
            sponsor.category === 'apoiador' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          )}>
            {categoryLabels[sponsor.category]}
          </div>
        </div>

        {/* Link indicator */}
        {sponsor.websiteUrl && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-6 h-6 bg-trucker-blue/20 rounded-full flex items-center justify-center">
              <ExternalLink className="w-3 h-3 text-trucker-blue" />
            </div>
          </div>
        )}
      </TouchFeedback>
    </motion.div>
  );
}
