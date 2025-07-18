import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ExternalLink, Share2, Volume2, VolumeX } from "lucide-react";
import { Short } from "@/types/shorts";

interface ShortsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shorts: Short[];
  initialIndex: number;
}

export const ShortsModal = ({ isOpen, onClose, shorts, initialIndex }: ShortsModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for swipe animations
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5]);
  const dragScale = useTransform(dragX, [-200, 0, 200], [0.9, 1, 0.9]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Prevent touch events on body when modal is open
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    };
  }, [isOpen]);

  const currentShort = shorts[currentIndex];

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const goToNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const handleShare = async () => {
    const url = `https://youtube.com/shorts/${currentShort.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentShort.title,
          url: url,
        });
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        if (navigator.vibrate) navigator.vibrate(50);
      } catch (error) {
        console.log('Erro ao copiar:', error);
      }
    }
  };

  const openInYouTube = () => {
    window.open(`https://youtube.com/shorts/${currentShort.id}`, '_blank');
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setDragDirection(null);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    const { offset } = info;
    dragX.set(offset.x);
    
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      setDragDirection(offset.x > 0 ? 'right' : 'left');
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    setIsDragging(false);
    dragX.set(0);
    
    const swipeThreshold = 100;
    const velocityThreshold = 500;
    
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
      if (offset.x > 0 && currentIndex > 0) {
        goToPrevious();
      } else if (offset.x < 0 && currentIndex < shorts.length - 1) {
        goToNext();
      }
    }
    
    setDragDirection(null);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  if (!isOpen || !currentShort) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-[9999] flex flex-col"
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTapHighlightColor: "transparent"
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-[9999]">
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
              onClick={toggleMute}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </motion.button>
            
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
        <div ref={containerRef} className="flex-1 relative flex items-center justify-center">
          {/* Navegação esquerda */}
          {currentIndex > 0 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToPrevious}
              className="absolute left-4 z-[9999] w-12 h-12 bg-black/50 rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
          )}

          {/* Player de vídeo */}
          <motion.div
            key={currentShort.id}
            drag="x"
            dragConstraints={containerRef}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{ 
              x: dragX,
              opacity: dragOpacity,
              scale: dragScale,
              touchAction: "none"
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-sm mx-auto aspect-[9/16] bg-black rounded-lg overflow-hidden touch-none select-none z-[9998]"
          >
            <iframe
              src={`https://www.youtube.com/embed/${currentShort.id}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&modestbranding=1&rel=0&showinfo=0&playsinline=1&enablejsapi=1`}
              title={currentShort.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full pointer-events-none"
            />
          </motion.div>

          {/* Navegação direita */}
          {currentIndex < shorts.length - 1 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToNext}
              className="absolute right-4 z-[9999] w-12 h-12 bg-black/50 rounded-full flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          )}

          {/* Swipe direction indicator */}
          <AnimatePresence>
            {dragDirection && isDragging && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center z-[9999] pointer-events-none"
              >
                <div className={`px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium`}>
                  {dragDirection === 'left' ? 'Próximo →' : '← Anterior'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer com título */}
        <div className="p-4 bg-black/80 backdrop-blur-sm z-[9999]">
          <h2 className="text-white font-medium text-center leading-tight">
            {currentShort.title}
          </h2>
        </div>

        {/* Indicadores de navegação */}
        {shorts.length > 1 && (
          <div className="flex justify-center gap-2 pb-4 z-[9999]">
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