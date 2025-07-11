import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ExternalLink, Share2 } from "lucide-react";
import { Short } from "@/types/shorts";

interface ShortsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shorts: Short[];
  initialIndex: number;
}

export const ShortsModal = ({ isOpen, onClose, shorts, initialIndex }: ShortsModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const currentShort = shorts[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : shorts.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < shorts.length - 1 ? prev + 1 : 0));
  };

  const handleShare = async () => {
    const url = `https://youtube.com/shorts/${currentShort.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentShort.title,
          url: url,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback: copiar para clipboard
      try {
        await navigator.clipboard.writeText(url);
        // Aqui você pode adicionar um toast de sucesso
      } catch (error) {
        console.log('Erro ao copiar:', error);
      }
    }
  };

  const openInYouTube = () => {
    window.open(`https://youtube.com/shorts/${currentShort.id}`, '_blank');
  };

  if (!isOpen || !currentShort) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>

          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              {currentIndex + 1} de {shorts.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Share2 className="w-5 h-5 text-white" />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={openInYouTube}
              className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center"
            >
              <ExternalLink className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Navegação esquerda */}
          {shorts.length > 1 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToPrevious}
              className="absolute left-4 z-10 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
          )}

          {/* Player de vídeo */}
          <motion.div
            key={currentShort.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-sm mx-auto aspect-[9/16] bg-black rounded-lg overflow-hidden"
          >
            <iframe
              src={`https://www.youtube.com/embed/${currentShort.id}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&showinfo=0`}
              title={currentShort.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </motion.div>

          {/* Navegação direita */}
          {shorts.length > 1 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToNext}
              className="absolute right-4 z-10 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </div>

        {/* Footer com título */}
        <div className="p-4 bg-black/80 backdrop-blur-sm">
          <h2 className="text-white font-medium text-center leading-tight">
            {currentShort.title}
          </h2>
        </div>

        {/* Indicadores */}
        {shorts.length > 1 && (
          <div className="flex justify-center gap-2 pb-4">
            {shorts.map((_, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.8 }}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};