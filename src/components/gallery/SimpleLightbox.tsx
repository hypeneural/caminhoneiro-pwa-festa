import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Photo } from '@/types/gallery';

interface SimpleLightboxProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToggleFavorite: (photoId: string) => void;
  favorites: string[];
  totalPhotos: number;
  currentIndex: number;
}

export const SimpleLightbox: React.FC<SimpleLightboxProps> = ({
  photo,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  favorites,
  totalPhotos,
  currentIndex
}) => {
  // Navegação por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) onNavigate('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < totalPhotos - 1) onNavigate('next');
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate, onClose, currentIndex, totalPhotos]);

  // Previne scroll do body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isFavorite = photo ? favorites.includes(photo.id) : false;

  if (!isOpen || !photo) return null;

  // Seleciona melhor variante da imagem
  const getImageUrl = () => {
    if (photo.variants?.full_1x?.webp) return photo.variants.full_1x.webp;
    if (photo.variants?.full_1x?.jpg) return photo.variants.full_1x.jpg;
    if (photo.variants?.preview?.webp) return photo.variants.preview.webp;
    if (photo.variants?.preview?.jpg) return photo.variants.preview.jpg;
    return photo.url;
  };

  const lightboxContent = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
              
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} de {totalPhotos}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(photo.id);
              }}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart 
                className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </button>
          </div>
        </div>

        {/* Área da imagem */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          <motion.img
            src={getImageUrl()}
            alt={photo.title || `Foto ${photo.id_foto}`}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ backgroundColor: photo.dominant_color }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            loading="eager"
          />

          {/* Controles de navegação */}
          {totalPhotos > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('prev');
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 flex items-center justify-center transition-colors"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              
              {currentIndex < totalPhotos - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('next');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 flex items-center justify-center transition-colors"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Indicadores */}
        {totalPhotos > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
            {Array.from({ length: Math.min(totalPhotos, 5) }, (_, i) => {
              let index = i;
              if (totalPhotos > 5) {
                const start = Math.max(0, currentIndex - 2);
                index = start + i;
                if (index >= totalPhotos) return null;
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
    </AnimatePresence>
  );

  return createPortal(lightboxContent, document.body);
};

export default SimpleLightbox; 