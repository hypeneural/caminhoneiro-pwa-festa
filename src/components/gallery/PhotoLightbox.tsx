import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Share, Download, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Photo } from '@/types/gallery';
// import { useNativeShare } from '@/hooks/useNativeShare';

interface PhotoLightboxProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToggleFavorite: (photoId: string) => void;
  favorites: string[];
  totalPhotos: number;
  currentIndex: number;
}

export function PhotoLightbox({
  photo,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  favorites,
  totalPhotos,
  currentIndex
}: PhotoLightboxProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image loaded state when photo changes
  useEffect(() => {
    setImageLoaded(false);
  }, [photo?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

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
        case 'f':
        case 'F':
          if (photo) {
            e.preventDefault();
            onToggleFavorite(photo.id);
          }
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setShowDetails(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate, onClose, onToggleFavorite, photo]);

  const handleShare = useCallback(async () => {
    if (!photo) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: photo.title || 'Foto da Festa do Caminhoneiro',
          text: photo.description || 'Confira esta foto da Festa do Caminhoneiro!',
          url: photo.url
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(photo.url);
        // Could show a toast here
      }
    } catch (error) {
      console.error('Error sharing photo:', error);
    }
  }, [photo]);

  const handleDownload = useCallback(async () => {
    if (!photo) return;

    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `festa-caminhoneiro-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  }, [photo]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (!photo) return null;

  const isFavorite = favorites.includes(photo.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95 border-0">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-white/80 text-sm">
              {currentIndex + 1} de {totalPhotos}
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-10 w-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Main Image */}
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Navigation Areas */}
          <button
            className="absolute left-0 top-0 w-1/3 h-full z-30 cursor-pointer"
            onClick={() => onNavigate('prev')}
            aria-label="Foto anterior"
          />
          <button
            className="absolute right-0 top-0 w-1/3 h-full z-30 cursor-pointer"
            onClick={() => onNavigate('next')}
            aria-label="Próxima foto"
          />

          {/* Navigation Arrows */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-black/40 hover:bg-black/60 text-white h-12 w-12"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-black/40 hover:bg-black/60 text-white h-12 w-12"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Image */}
          <div className="relative max-w-full max-h-full">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <OptimizedImage
              src={photo.url}
              alt={photo.title || `Foto ${photo.id}`}
              className={`max-h-[90vh] max-w-[90vw] object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              priority
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {photo.vehiclePlate && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {photo.vehiclePlate}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 capitalize">
                {photo.category.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`text-white hover:bg-white/20 h-10 w-10 ${
                  isFavorite ? 'text-red-400' : ''
                }`}
                onClick={() => onToggleFavorite(photo.id)}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-10 w-10"
                onClick={handleShare}
              >
                <Share className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-10 w-10"
                onClick={handleDownload}
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`text-white hover:bg-white/20 h-10 w-10 ${
                  showDetails ? 'bg-white/20' : ''
                }`}
                onClick={() => setShowDetails(prev => !prev)}
              >
                <Info className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Photo Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-black/60 rounded-lg p-4 text-white overflow-hidden"
              >
                <ScrollArea className="max-h-40">
                  <div className="space-y-2 text-sm">
                    {photo.title && (
                      <div>
                        <span className="text-white/60">Título:</span> {photo.title}
                      </div>
                    )}
                    {photo.description && (
                      <div>
                        <span className="text-white/60">Descrição:</span> {photo.description}
                      </div>
                    )}
                    <div>
                      <span className="text-white/60">Data:</span> {formatDate(photo.timestamp)}
                    </div>
                    {photo.photographer && (
                      <div>
                        <span className="text-white/60">Fotógrafo:</span> {photo.photographer}
                      </div>
                    )}
                    {photo.location?.address && (
                      <div>
                        <span className="text-white/60">Local:</span> {photo.location.address}
                      </div>
                    )}
                    <div className="flex gap-4">
                      <span><span className="text-white/60">Visualizações:</span> {photo.views}</span>
                      <span><span className="text-white/60">Curtidas:</span> {photo.likes}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Tamanho:</span> {formatFileSize(photo.fileSize)}
                    </div>
                    <div>
                      <span className="text-white/60">Dimensões:</span> {photo.dimensions.width}x{photo.dimensions.height}
                    </div>
                    {photo.tags.length > 0 && (
                      <div>
                        <span className="text-white/60">Tags:</span> {photo.tags.join(', ')}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}