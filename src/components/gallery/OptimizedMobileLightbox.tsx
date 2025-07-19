import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Share, Download, Info } from 'lucide-react';
import { Photo } from '@/types/gallery';
import { ProgressiveImage } from '@/components/ui/progressive-image';

interface OptimizedMobileLightboxProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToggleFavorite: (photoId: string) => void;
  favorites: string[];
  totalPhotos: number;
  currentIndex: number;
}

const SWIPE_CONFIDENCE_THRESHOLD = 10000;

export const OptimizedMobileLightbox: React.FC<OptimizedMobileLightboxProps> = ({
  photo,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  favorites,
  totalPhotos,
  currentIndex
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  // Motion values para gestos suaves
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useTransform(y, [-300, 0, 300], [0, 1, 0]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset quando muda foto
  useEffect(() => {
    if (isOpen && photo) {
      setImageLoaded(false);
      setShowDetails(false);
      x.set(0);
      y.set(0);
      scale.set(1);
    }
  }, [photo?.id, isOpen, x, y, scale]);

  // Navegação por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onNavigate('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNavigate('next');
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case ' ':
          e.preventDefault();
          setShowDetails(!showDetails);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate, onClose, showDetails]);

  // Previne scroll do body quando lightbox está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  // Swipe para navegação e fechar
  const handleDragEnd = useCallback((
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeX = info.offset.x;
    const swipeY = info.offset.y;
    const velocityX = info.velocity.x;
    const velocityY = info.velocity.y;

    // Swipe vertical para fechar
    if (Math.abs(swipeY) > Math.abs(swipeX) && Math.abs(swipeY) > 50) {
      if (Math.abs(velocityY) > 500 || Math.abs(swipeY) > 150) {
        onClose();
        return;
      }
    }

    // Swipe horizontal para navegação
    if (Math.abs(swipeX) > Math.abs(swipeY) && Math.abs(swipeX) > 50) {
      const confidence = Math.abs(velocityX) * Math.abs(swipeX);
      
      if (confidence > SWIPE_CONFIDENCE_THRESHOLD || Math.abs(swipeX) > 150) {
        if (swipeX > 0 && currentIndex > 0) {
          onNavigate('prev');
        } else if (swipeX < 0 && currentIndex < totalPhotos - 1) {
          onNavigate('next');
        }
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }

    // Reset position
    x.set(0);
    y.set(0);
  }, [onClose, onNavigate, currentIndex, totalPhotos, x, y]);

  // Double tap para zoom
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - toggle zoom
      const currentScale = scale.get();
      if (currentScale > 1) {
        scale.set(1);
      } else {
        scale.set(2);
      }
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
    
    setLastTap(now);
  }, [lastTap, scale]);

  const handleShare = useCallback(async () => {
    if (!photo) return;

    const shareData = {
      title: photo.title || 'Foto da Festa dos Caminhoneiros',
      text: `Confira esta foto incrível! ${photo.vehicle?.plate ? `Placa: ${photo.vehicle.plate}` : ''}`,
      url: photo.url
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback para clipboard
        await navigator.clipboard.writeText(photo.url);
      }
    } catch (error) {
      console.warn('Erro ao compartilhar:', error);
    }
  }, [photo]);

  const handleDownload = useCallback(async () => {
    if (!photo) return;

    try {
      const imageUrl = photo.variants?.full_1x?.webp || photo.variants?.full_1x?.jpg || photo.url;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `festa-caminhoneiros-${photo.id_foto}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch (error) {
      console.warn('Erro ao baixar imagem:', error);
    }
  }, [photo]);

  const isFavorite = photo ? favorites.includes(photo.id) : false;

  // Memoiza dados da foto para performance
  const photoData = useMemo(() => {
    if (!photo) return null;

    return {
      title: photo.title || photo.description || `Foto ${photo.id_foto}`,
      description: photo.description,
      timestamp: new Date(photo.data_envio),
      stats: {
        views: photo.visualizacoes,
        likes: photo.likes || 0
      },
      vehicle: photo.vehicle,
      group: photo.group
    };
  }, [photo]);

  if (!isOpen || !photo || !photoData) return null;

  const lightboxContent = (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header com controles */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors touch-feedback"
              aria-label="Fechar lightbox"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-white">
              <span className="text-sm font-medium">
                {currentIndex + 1} de {totalPhotos}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onToggleFavorite(photo.id)}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors touch-feedback"
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart 
                className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </button>
            
            <button
              onClick={handleShare}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors touch-feedback"
              aria-label="Compartilhar foto"
            >
              <Share className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleDownload}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors touch-feedback"
              aria-label="Baixar foto"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors touch-feedback"
              aria-label={showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Área principal da imagem */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div
          className="w-full h-full flex items-center justify-center"
          style={{ x, y, scale, opacity }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onTap={handleTap}
          whileTap={{ scale: scale.get() > 1 ? scale.get() : 0.98 }}
        >
          <ProgressiveImage
            variants={photo.variants}
            alt={photoData.title}
            className="max-w-full max-h-full object-contain will-change-transform"
            dominantColor={photo.dominant_color}
            aspectRatio={photo.aspect_ratio}
            priority={true}
            onLoad={() => setImageLoaded(true)}
          />
        </motion.div>

        {/* Controles de navegação */}
        {totalPhotos > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={() => onNavigate('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full w-12 h-12 flex items-center justify-center transition-colors touch-feedback"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {currentIndex < totalPhotos - 1 && (
              <button
                onClick={() => onNavigate('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full w-12 h-12 flex items-center justify-center transition-colors touch-feedback"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </>
        )}

        {/* Indicador de zoom */}
        {scale.get() > 1.1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            200%
          </div>
        )}
      </div>

      {/* Painel de detalhes */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm text-white max-h-[60vh] overflow-auto pb-safe"
          >
            <div className="p-4 space-y-4">
              {/* Título e descrição */}
              <div>
                <h3 className="text-lg font-semibold mb-2">{photoData.title}</h3>
                {photoData.description && (
                  <p className="text-sm text-gray-300">{photoData.description}</p>
                )}
              </div>

              {/* Informações do grupo */}
              {photo.group && (
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: photo.group.cor }}
                  >
                    <i className={`${photo.group.icone} mr-1`} />
                    {photo.group.nome}
                  </div>
                  <span className="text-xs text-gray-400">
                    {photo.periodo_dia}
                  </span>
                </div>
              )}

              {/* Informações do veículo */}
              {photo.vehicle?.plate && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Informações do Veículo</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Placa:</span>
                      <span className="ml-2 font-mono">{photo.vehicle.plate}</span>
                    </div>
                    {photo.vehicle.brand && (
                      <div>
                        <span className="text-gray-400">Marca:</span>
                        <span className="ml-2">{photo.vehicle.brand}</span>
                      </div>
                    )}
                    {photo.vehicle.model && (
                      <div>
                        <span className="text-gray-400">Modelo:</span>
                        <span className="ml-2">{photo.vehicle.model}</span>
                      </div>
                    )}
                    {photo.vehicle.year && (
                      <div>
                        <span className="text-gray-400">Ano:</span>
                        <span className="ml-2">{photo.vehicle.year}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-lg font-semibold">{photoData.stats.views}</div>
                  <div className="text-gray-400">Visualizações</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{photoData.stats.likes}</div>
                  <div className="text-gray-400">Curtidas</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {photoData.timestamp.toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-gray-400">Data</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicadores de posição */}
      {totalPhotos > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1 pb-safe">
          {Array.from({ length: Math.min(totalPhotos, 5) }, (_, i) => {
            let index = i;
            if (totalPhotos > 5) {
              const start = Math.max(0, currentIndex - 2);
              index = start + i;
            }
            
            return (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );

  // Usa portal para renderizar fora da árvore de componentes
  return createPortal(lightboxContent, document.body);
};

export default OptimizedMobileLightbox; 