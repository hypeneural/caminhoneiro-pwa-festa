import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Share2, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Photo } from '@/types/gallery';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { LightboxBannerCarousel } from './LightboxBannerCarousel';
import { useBanners } from '@/hooks/useBanners';
import { SponsorPhotoMark } from './SponsorPhotoMark';
import type { SponsorPhotoBrand } from '@/types/sponsorGallery';
import { downloadBrandedPhoto } from '@/utils/brandedPhotoDownload';
import { toast } from 'sonner';

interface TouchFriendlyLightboxProps {
  photoBrand?: SponsorPhotoBrand;
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToggleFavorite: (photoId: string) => void;
  favorites: string[];
  totalPhotos: number;
  currentIndex: number;
  allPhotos?: Photo[]; // Para preload das próximas fotos
  enableBanners?: boolean; // Controle para mostrar/ocultar banners
}

export const TouchFriendlyLightbox: React.FC<TouchFriendlyLightboxProps> = ({
  photo,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  favorites,
  totalPhotos,
  currentIndex,
  allPhotos,
  enableBanners = true,
  photoBrand
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const shouldEnableBanners = enableBanners && !photoBrand;
  
  // Hook para preload de imagens
  const { preloadNext, getCacheStats, isPreloaded } = useImagePreloader();
  const [imageError, setImageError] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Hook para banners do lightbox
  const {
    lightboxBanners,
    trackBannerImpression,
    trackBannerClick
  } = useBanners({
    enabled: shouldEnableBanners,
    enableRandomRotation: true,
    analyticsEnabled: true
  });

  // Reset states when photo changes
  useEffect(() => {
    if (photo) {
      setIsZoomed(false);
      setImageLoaded(false);
      setImageError(false);
      setDragOffset(0);
    }
  }, [photo?.id]);

  // Preload próximas fotos para navegação instant 
  useEffect(() => {
    if (isOpen && allPhotos && allPhotos.length > 1 && currentIndex >= 0) {
      // Extrai URLs das fotos para preload (usa preview ou url principal)
      const photoUrls = allPhotos.map(p => {
        // Prioriza preview, depois thumbnail, depois URL principal
        return p.variants?.preview?.webp || 
               p.variants?.preview?.jpg || 
               p.variants?.thumbnail?.webp || 
               p.variants?.thumbnail?.jpg || 
               p.url;
      }).filter(Boolean);

      // Faz preload das próximas 3 fotos + 2 anteriores
      preloadNext(currentIndex, photoUrls, 3, { priority: 'high' })
        .then((results) => {
          const successful = results.filter(r => r.loaded).length;
          console.log(`📸 Preloaded ${successful}/${results.length} images for lightbox navigation`);
        })
        .catch((error) => {
          console.warn('⚠️ Error preloading images:', error);
        });
    }
  }, [isOpen, currentIndex, allPhotos, preloadNext]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (isOpen && !isZoomed) {
      resetControlsTimer();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen, isZoomed, resetControlsTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onNavigate('prev');
          break;
        case 'ArrowRight':
          onNavigate('next');
          break;
        case ' ':
          e.preventDefault();
          setIsZoomed(!isZoomed);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isZoomed, onClose, onNavigate]);

  // Pan gesture handling
  const handlePanEnd = useCallback((event: PointerEvent, info: PanInfo) => {
    if (!info || !info.offset || !info.velocity) {
      setDragOffset(0);
      return;
    }

    const { offset, velocity } = info;
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
      if (offset.x > 0) {
        onNavigate('prev');
      } else {
        onNavigate('next');
      }
    } else if (Math.abs(offset.y) > 150 || velocity.y > 300) {
      // Swipe down to close
      onClose();
    }
    
    setDragOffset(0);
  }, [onNavigate, onClose]);

  const handlePan = useCallback((event: PointerEvent, info: PanInfo) => {
    if (!info || !info.offset || isZoomed) {
      return;
    }
    setDragOffset(info.offset.x || 0);
  }, [isZoomed]);

  // Double tap to zoom
  const handleDoubleTap = useCallback(() => {
    setIsZoomed(!isZoomed);
    resetControlsTimer();
  }, [isZoomed, resetControlsTimer]);

  const handleSingleTap = useCallback(() => {
    if (!isZoomed) {
      resetControlsTimer();
    }
  }, [isZoomed, resetControlsTimer]);

  const handleBrandedDownload = useCallback(async () => {
    if (!photo || !photoBrand || isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadBrandedPhoto(photo, photoBrand);
      toast.success('Foto com a logo pronta para download.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível baixar a foto com a logo.',
      );
    } finally {
      setIsDownloading(false);
    }
  }, [photo, photoBrand, isDownloading]);

  const isFavorite = photo ? favorites.includes(photo.id) : false;
  const isVertical = photo && photo.aspect_ratio < 1;

  if (!isOpen || !photo) return null;

  const imageUrl = photo.variants?.full_1x?.webp || photo.variants?.preview?.webp || photo.url;
  const fallbackUrl = photo.variants?.full_1x?.jpg || photo.variants?.preview?.jpg || photo.thumbnailUrl;

  return (
    <AnimatePresence>
      <motion.div
        key={photo.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        onClick={(e) => {
          // Only close if clicking on backdrop, not on image
          if (e.target === e.currentTarget && !isZoomed) {
            onClose();
          }
        }}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black" />

        {/* Image container */}
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          onTap={handleSingleTap}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          drag={!isZoomed}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.2}
        >
          <motion.div
            className={`relative max-w-full max-h-full ${
              isVertical ? 'w-auto h-full' : 'w-full h-auto'
            }`}
            style={{
              x: dragOffset,
              scale: isZoomed ? 1.5 : 1,
            }}
            animate={{
              scale: isZoomed ? (isVertical ? 1.8 : 1.5) : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            onDoubleClick={handleDoubleTap}
            onTouchEnd={(e) => {
              // Handle double tap on mobile
              const now = Date.now();
              const lastTap = (e.target as any).lastTap || 0;
              if (now - lastTap < 300) {
                handleDoubleTap();
              }
              (e.target as any).lastTap = now;
            }}
          >
            {/* Loading placeholder */}
            {!imageLoaded && !imageError && (
              <div 
                className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center"
                style={{
                  aspectRatio: photo.aspect_ratio,
                  width: isVertical ? 'auto' : '100vw',
                  height: isVertical ? '100vh' : 'auto',
                  maxWidth: isVertical ? '100vw' : undefined,
                  maxHeight: isVertical ? undefined : '100vh',
                }}
              >
                <div className="text-white text-sm">Carregando...</div>
              </div>
            )}

            {/* Main image */}
            <img
              src={imageUrl}
              alt={photo.title || `Foto ${currentIndex + 1}`}
              className={`
                object-contain transition-opacity duration-300
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                ${isVertical ? 'h-full w-auto' : 'w-full h-auto'}
                max-w-full max-h-full
              `}
              style={{
                aspectRatio: photo.aspect_ratio,
                maxWidth: '100vw',
                maxHeight: '100vh',
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                if (fallbackUrl && fallbackUrl !== imageUrl) {
                  (event?.target as HTMLImageElement).src = fallbackUrl;
                }
              }}
              draggable={false}
            />

            {photoBrand && (
              <SponsorPhotoMark
                brand={photoBrand}
                variant='lightbox'
                aspectRatio={photo.aspect_ratio}
              />
            )}

            {/* Error state */}
            {imageError && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <div>Erro ao carregar imagem</div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Controls overlay */}
        <AnimatePresence>
          {showControls && (
            <>
              {/* Top controls */}
              <motion.div
                key="top-controls"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-10"
              >
                <div className="flex items-center justify-between text-white">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors touch-feedback"
                    aria-label="Fechar lightbox"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  
                  <div className="text-sm text-center">
                    <div className="font-medium">
                      {currentIndex + 1} de {totalPhotos}
                    </div>
                    {photo.group && (
                      <div className="text-xs opacity-75">
                        {photo.group.nome}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors touch-feedback"
                      aria-label={isZoomed ? "Diminuir zoom" : "Aumentar zoom"}
                    >
                      {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={() => onToggleFavorite(photo.id)}
                      className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors touch-feedback"
                      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <Heart 
                        className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Navigation arrows */}
              {totalPhotos > 1 && (
                <>
                  <motion.button
                    key="nav-prev"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => onNavigate('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-white z-10 touch-feedback"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>

                  <motion.button
                    key="nav-next"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => onNavigate('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-white z-10 touch-feedback"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </motion.button>
                </>
              )}

              {/* Bottom info */}
              <motion.div
                key="bottom-info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 z-10"
              >
                <div className="text-white">
                  {photo.description && (
                    <p className="text-sm mb-2 line-clamp-2">
                      {photo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs opacity-75">
                    <div>
                      {new Date(photo.timestamp).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    
                    {photo.vehiclePlate && (
                      <div className="bg-black/30 px-2 py-1 rounded">
                        {photo.vehiclePlate}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Swipe indicator */}
              {totalPhotos > 1 && (
                <motion.div
                  key="swipe-indicator"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center z-10"
                >
                  <div className="flex items-center space-x-2">
                    <ChevronLeft className="w-4 h-4" />
                    <span>Deslize para navegar</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {photoBrand && showControls && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={handleBrandedDownload}
            disabled={isDownloading}
            className='absolute right-4 top-20 z-20 flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75 disabled:cursor-wait disabled:opacity-70'
            aria-label='Baixar foto'
          >
            {isDownloading ? (
              <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white' />
            ) : (
              <Download className='h-4 w-4' />
            )}
            <span className='hidden sm:inline'>Baixar</span>
          </motion.button>
        )}

        {/* Zoom indicator */}
        {isZoomed && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 text-white/75 text-xs bg-black/30 px-3 py-1 rounded-full z-10">
            Modo zoom ativo
          </div>
        )}
      </motion.div>

      {/* Banner Carousel no rodapé do lightbox */}
      {shouldEnableBanners && isOpen && lightboxBanners.length > 0 && (
        <LightboxBannerCarousel
          banners={lightboxBanners}
          onBannerClick={trackBannerClick}
          onBannerImpression={trackBannerImpression}
          isVisible={isOpen && !isZoomed} // Oculta se zoom ativo
          autoplayDelay={8000} // Mais lento no lightbox
        />
      )}
    </AnimatePresence>
  );
};

export default TouchFriendlyLightbox; 
