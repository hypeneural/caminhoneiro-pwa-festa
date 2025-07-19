import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Share, Download, Info, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Photo } from '@/types/gallery';
import { ProgressiveImage } from '@/components/ui/progressive-image';

interface MobileLightboxProps {
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
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

export const MobileLightbox: React.FC<MobileLightboxProps> = ({
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
  const [isZoomed, setIsZoomed] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  // Motion values para gestos
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useTransform(y, [-300, 0, 300], [0, 1, 0]);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Reset quando muda foto
  useEffect(() => {
    setImageLoaded(false);
    setIsZoomed(false);
    setShowDetails(false);
    x.set(0);
    y.set(0);
    scale.set(1);
  }, [photo?.id, x, y, scale]);

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

  // Swipe para navegação
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
        if (swipeX > 0) {
          onNavigate('prev');
        } else {
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
  }, [onClose, onNavigate, x, y]);

  // Double tap para zoom
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (isZoomed) {
        scale.set(1);
        setIsZoomed(false);
      } else {
        scale.set(2);
        setIsZoomed(true);
      }
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
    
    setLastTap(now);
  }, [lastTap, isZoomed, scale]);

  // Pinch to zoom
  const handlePinch = useCallback((info: { scale: number; point: { x: number; y: number } }) => {
    const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, info.scale));
    scale.set(newScale);
    setIsZoomed(newScale > 1.1);
  }, [scale]);

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
        // Mostrar toast de confirmação aqui
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
      group: photo.group,
      technical: {
        dimensions: `${photo.variants?.full_1x?.w || 'N/A'} × ${photo.variants?.full_1x?.h || 'N/A'}`,
        size: photo.variants?.full_1x?.size ? `${(photo.variants.full_1x.size / 1024 / 1024).toFixed(1)} MB` : 'N/A',
        format: photo.mime_type || 'N/A'
      }
    };
  }, [photo]);

  if (!photo || !photoData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-full w-full h-full p-0 bg-black/95 border-none overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <motion.div
          ref={containerRef}
          className="relative w-full h-full flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header com controles */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
                
                <div className="text-white">
                  <span className="text-sm font-medium">
                    {currentIndex + 1} de {totalPhotos}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(photo.id)}
                  className="text-white hover:bg-white/20"
                >
                  <Heart 
                    className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-white hover:bg-white/20"
                >
                  <Share className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20"
                >
                  <Download className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-white hover:bg-white/20"
                >
                  <Info className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Área principal da imagem */}
          <div className="flex-1 relative overflow-hidden">
            <motion.div
              ref={imageRef}
              className="w-full h-full flex items-center justify-center"
              style={{ x, y, scale, opacity }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              onTap={handleTap}
              whileTap={{ scale: isZoomed ? scale.get() : 0.98 }}
            >
              <ProgressiveImage
                variants={photo.variants}
                alt={photoData.title}
                className="max-w-full max-h-full object-contain"
                dominantColor={photo.dominant_color}
                aspectRatio={photo.aspect_ratio}
                priority={true}
                onLoad={() => setImageLoaded(true)}
              />
            </motion.div>

            {/* Controles de navegação */}
            {totalPhotos > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => onNavigate('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full w-12 h-12"
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => onNavigate('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full w-12 h-12"
                  disabled={currentIndex === totalPhotos - 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Indicador de zoom */}
            {isZoomed && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {Math.round(scale.get() * 100)}%
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
                className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm text-white max-h-[60vh]"
              >
                <ScrollArea className="p-4">
                  <div className="space-y-4">
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
                        <Badge 
                          className="text-xs"
                          style={{ backgroundColor: photo.group.cor }}
                        >
                          <i className={`${photo.group.icone} mr-1`} />
                          {photo.group.nome}
                        </Badge>
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

                    {/* Informações técnicas */}
                    <div className="text-xs text-gray-400 space-y-1 border-t border-gray-700 pt-4">
                      <div>Dimensões: {photoData.technical.dimensions}</div>
                      <div>Tamanho: {photoData.technical.size}</div>
                      <div>Formato: {photoData.technical.format}</div>
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Indicadores de posição */}
          {totalPhotos > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
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
      </DialogContent>
    </Dialog>
  );
};

export default MobileLightbox; 