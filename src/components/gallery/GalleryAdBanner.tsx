import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Banner } from '@/types/sponsors';

interface GalleryAdBannerProps {
  banner: Banner;
  position: number; // Posição na grid para analytics
  onBannerClick?: (banner: Banner, position: number) => void;
  onBannerImpression?: (banner: Banner, position: number) => void;
  onBannerDismiss?: (bannerId: number) => void;
  className?: string;
  variant?: 'horizontal' | 'square' | 'vertical';
}

export const GalleryAdBanner: React.FC<GalleryAdBannerProps> = ({
  banner,
  position,
  onBannerClick,
  onBannerImpression,
  onBannerDismiss,
  className = '',
  variant = 'horizontal'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const impressionSent = useRef(false);

  // Intersection Observer para tracking de impressão
  useEffect(() => {
    if (!bannerRef.current || impressionSent.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressionSent.current) {
          setIsVisible(true);
          impressionSent.current = true;
          onBannerImpression?.(banner, position);
        }
      },
      {
        threshold: 0.5, // 50% visible
        rootMargin: '50px'
      }
    );

    observer.observe(bannerRef.current);

    return () => observer.disconnect();
  }, [banner, position, onBannerImpression]);

  // Handler de clique no banner
  const handleBannerClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    onBannerClick?.(banner, position);
    
    if (banner.linkUrl) {
      window.open(banner.linkUrl, banner.target || '_blank');
    }
  }, [banner, position, onBannerClick]);

  // Handler para dispensar banner
  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDismissed(true);
    onBannerDismiss?.(banner.id);
  }, [banner.id, onBannerDismiss]);

  // Se foi dispensado, não renderiza
  if (isDismissed) {
    return null;
  }

  // Configurações por variante
  const getVariantClasses = () => {
    switch (variant) {
      case 'square':
        return 'aspect-square'; // Para sponsors 1:1 (300x300)
      case 'vertical':
        return 'aspect-[3/4]';
      case 'horizontal':
      default:
        return 'aspect-[3/1]'; // Para banners da API 3:1 (1080x360)
    }
  };

  const getContainerClasses = () => {
    const base = 'relative group cursor-pointer overflow-hidden rounded-xl bg-muted/20 border-2 border-dashed border-muted/30';
    
    switch (variant) {
      case 'square':
        return `${base} col-span-1`;
      case 'vertical':
        return `${base} col-span-1`;
      case 'horizontal':
      default:
        return `${base} col-span-2`; // Ocupa 2 colunas na grid
    }
  };

  return (
    <motion.div
      ref={bannerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`${getContainerClasses()} ${className}`}
      onClick={handleBannerClick}
    >
      {/* Indicador de publicidade */}
      <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
        Publicidade
      </div>

      {/* Botão de dispensar */}
      {onBannerDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 z-10 bg-black/70 text-white p-1 rounded-full hover:bg-black/90 transition-colors"
          aria-label="Dispensar anúncio"
        >
          <X size={12} />
        </button>
      )}

      {/* Container da imagem */}
      <div className={`${getVariantClasses()} relative overflow-hidden`}>
        {/* Placeholder/Loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Banner Image */}
        {!imageError && (
          <OptimizedImage
            src={banner.imageUrlWebp || banner.imageUrl}
            fallbackSrc={banner.imageUrl}
            alt={banner.altText || banner.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}

        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20 text-muted-foreground">
            <div className="text-center p-4">
              <ExternalLink size={24} className="mx-auto mb-2" />
              <p className="text-sm">Banner indisponível</p>
            </div>
          </div>
        )}

        {/* Overlay com hover effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Conteúdo do banner */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-medium text-sm mb-1 line-clamp-2">
            {banner.title}
          </h3>
          {banner.description && (
            <p className="text-xs opacity-90 line-clamp-2">
              {banner.description}
            </p>
          )}
          <div className="flex items-center mt-2 text-xs">
            <ExternalLink size={12} className="mr-1" />
            <span>Clique para saber mais</span>
          </div>
        </div>
      </div>

      {/* Indicador de carregamento na parte inferior */}
      {imageLoaded && isVisible && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
          <div className="h-full bg-primary w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </div>
      )}
    </motion.div>
  );
}; 