import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Heart, Share2, Eye, Star } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary, CarouselErrorFallback } from "@/components/ui/error-boundary";
import { CarouselSkeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { TouchFeedback, RippleEffect } from "@/components/ui/touch-feedback";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { usePhotos } from "@/hooks/usePhotos";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES, THEME_COLORS, APP_TEXTS } from "@/constants";

const PhotoCard = React.memo(({ photo, index, scrollX, userInteracted }: { photo: any; index: number; scrollX: any; userInteracted: boolean }) => {
  const { toggleFavorite, isFavorite } = usePhotos();
  const { navigateTo } = useNavigation();
  const [isPressed, setIsPressed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const isPhotoLiked = isFavorite(photo.id);
  
  // Responsive card width based on screen size
  const cardWidth = 280; // Base width for mobile
  
  // Parallax effect based on scroll position
  const x = useTransform(scrollX, [index * cardWidth - 150, index * cardWidth + 150], [-30, 30]);
  const scale = useTransform(scrollX, [index * cardWidth - 100, index * cardWidth, index * cardWidth + 100], [0.95, 1, 0.95]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(photo.id);
    
    // Haptic feedback only after user interaction
    if (userInteracted && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }, [photo.id, toggleFavorite, userInteracted]);

  const handleDoubleTap = useCallback(() => {
    if (!isPhotoLiked) {
      toggleFavorite(photo.id);
      // Stronger haptic for double tap (only after user interaction)
      if (userInteracted && 'vibrate' in navigator) {
        navigator.vibrate([30, 10, 30]);
      }
    }
  }, [photo.id, toggleFavorite, isPhotoLiked, userInteracted]);

  const handleLongPress = useCallback(() => {
    setShowPreview(true);
    // Long press haptic (only after user interaction)
    if (userInteracted && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Auto close preview after 2s
    setTimeout(() => setShowPreview(false), 2000);
  }, [userInteracted]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `Foto: ${photo.category}`,
        text: `Confira esta foto incrível da ${photo.category}!`,
        url: photo.imageUrl
      });
    }
  }, [photo]);

  return (
    <motion.div
      className="flex-shrink-0 w-72 sm:w-80 px-2"
      style={{ x, scale }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <TouchFeedback scale={0.95} haptic>
        <motion.div
          className="relative"
          whileTap={{ scale: 0.98 }}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onTouchCancel={() => setIsPressed(false)}
        >
          <RippleEffect rippleColor="rgba(255,255,255,0.3)">
            <Card className={`
              overflow-hidden relative group cursor-pointer
              bg-gradient-to-br from-background/95 to-background/90
              backdrop-blur-md border border-border/20
              shadow-2xl hover:shadow-3xl transition-all duration-300
              ${isPressed ? 'shadow-lg' : 'shadow-2xl'}
            `}>
              {/* Main Image with aspect ratio optimized for horizontal photos */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  animate={{ 
                    scale: isPressed ? 1.05 : 1,
                    rotateY: showPreview ? 5 : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <OptimizedImage
                    src={photo.imageUrl}
                    alt={`Momento especial: ${photo.category}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* Premium gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />

                {/* Interactive elements */}
                <div className="absolute inset-0 flex flex-col justify-between p-4">
                  {/* Top bar with stats */}
                  <div className="flex justify-between items-start">
                    <motion.div 
                      className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <Eye className="w-3 h-3 text-white/90" />
                      <span className="text-xs font-medium text-white/90">{photo.views}</span>
                    </motion.div>

                    <motion.div 
                      className="flex items-center gap-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.4 }}
                    >
                      {/* Share button */}
                      <AccessibleButton
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full text-white/90 hover:bg-black/60 transition-all"
                        onClick={handleShare}
                        aria-label="Compartilhar foto"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </AccessibleButton>

                      {/* Like button with animation */}
                      <motion.div
                        whileTap={{ scale: 0.8 }}
                        animate={{ scale: isPhotoLiked ? [1, 1.3, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <AccessibleButton
                          variant="ghost"
                          size="sm"
                          className={`w-8 h-8 backdrop-blur-sm rounded-full transition-all ${
                            isPhotoLiked 
                              ? 'bg-red-500/90 text-white hover:bg-red-600/90' 
                              : 'bg-black/40 text-white/90 hover:bg-black/60'
                          }`}
                          onClick={handleLikeClick}
                          aria-label={isPhotoLiked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isPhotoLiked ? 'fill-current' : ''}`} />
                        </AccessibleButton>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Bottom info */}
                  <div className="space-y-3">
                    {/* Category and likes */}
                    <div className="flex items-center justify-between">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.5 }}
                      >
                        <Badge 
                          className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs font-medium px-3 py-1"
                        >
                          {photo.category}
                        </Badge>
                      </motion.div>

                      <motion.div 
                        className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.6 }}
                      >
                        <Heart className="w-3 h-3 text-red-400 fill-current" />
                        <span className="text-xs font-medium text-white/90">{photo.likes}</span>
                      </motion.div>
                    </div>

                    {/* Title or description */}
                    <motion.h3 
                      className="text-sm font-semibold text-white leading-tight"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.7 }}
                    >
                      {photo.title || `Momento especial da ${photo.category}`}
                    </motion.h3>
                  </div>
                </div>

                {/* Featured star for special photos */}
                {photo.featured && (
                  <motion.div 
                    className="absolute top-4 left-4"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 + 0.8, type: "spring" }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                  </motion.div>
                )}

                {/* Preview overlay */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="text-center text-white"
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 20 }}
                      >
                        <Eye className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Visualização rápida</p>
                        <p className="text-xs opacity-80">Toque para ver na galeria</p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Glassmorphism shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            </Card>
          </RippleEffect>
        </motion.div>
      </TouchFeedback>
    </motion.div>
  );
});

// Mobile-optimized carousel with smart touch handling
const MobileCarousel = React.memo(({ photos }: { photos: any[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollX = useMotionValue(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mark user interaction for haptic feedback
  const handleUserInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
    }
  }, [userInteracted]);

  // Smart auto-scroll with better mobile performance
  useEffect(() => {
    if (!containerRef.current || isPaused || userInteracted) return;

    const container = containerRef.current;
    const cardWidth = 300; // Mobile-optimized width
    const totalWidth = photos.length * cardWidth;
    let animationId: number;

    const animate = () => {
      const currentScroll = container.scrollLeft;
      
      // Slower, smoother movement for mobile
      if (currentScroll >= totalWidth - cardWidth) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += 0.3;
      }
      
      scrollX.set(container.scrollLeft);
      
      // Update current index for indicators
      const newIndex = Math.round(container.scrollLeft / cardWidth);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex % photos.length);
      }
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationId);
  }, [photos.length, isPaused, userInteracted, scrollX, currentIndex]);

  // Create infinite loop with optimized duplicates
  const infinitePhotos = [...photos, ...photos];

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onTouchStart={() => {
          setIsPaused(true);
          handleUserInteraction();
        }}
        onTouchEnd={() => setIsPaused(false)}
        onMouseDown={() => {
          setIsPaused(true);
          handleUserInteraction();
        }}
        onMouseUp={() => setIsPaused(false)}
      >
        {infinitePhotos.map((photo, index) => (
          <div key={`${photo.id}-${index}`} className="snap-center">
            <PhotoCard 
              photo={photo} 
              index={index}
              scrollX={scrollX}
              userInteracted={userInteracted}
            />
          </div>
        ))}
      </div>

      {/* Progress indicators - only show if not auto-scrolling */}
      {userInteracted && (
        <div className="flex justify-center gap-1 mt-4">
          {photos.map((_, index) => (
            <motion.div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-primary scale-125' : 'bg-muted'
              }`}
              animate={{ 
                scale: index === currentIndex ? 1.25 : 1,
                opacity: index === currentIndex ? 1 : 0.5
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Premium loading component
const PremiumLoadingState = React.memo(() => (
  <div className="mb-6" aria-label="Carregando momentos especiais">
    {/* Header skeleton */}
    <div className="flex items-center justify-between px-4 mb-6">
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="space-y-2">
          <motion.div 
            className="w-40 h-5 bg-gradient-to-r from-muted/50 to-muted/30 rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div 
            className="w-32 h-3 bg-gradient-to-r from-muted/30 to-muted/20 rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
      <motion.div 
        className="w-24 h-8 bg-gradient-to-r from-muted/50 to-muted/30 rounded-full"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
      />
    </div>

    {/* Cards skeleton */}
    <div className="flex gap-4 px-4 overflow-x-hidden">
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.div
          key={index}
          className="flex-shrink-0 w-80 h-60 bg-gradient-to-br from-muted/30 to-muted/20 rounded-2xl"
          animate={{ 
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            delay: index * 0.3
          }}
        />
      ))}
    </div>
  </div>
));

export const PhotoCarousel = React.memo(() => {
  const { latestPhotos, loading } = usePhotos();
  const { navigateTo } = useNavigation();

  if (loading) {
    return <PremiumLoadingState />;
  }

  return (
    <ErrorBoundary fallback={CarouselErrorFallback}>
      <motion.section 
        className="mb-8" 
        aria-labelledby="photos-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Premium Header */}
        <motion.div 
          className="flex items-center justify-between px-4 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Camera className="w-5 h-5 text-white" aria-hidden="true" />
            </motion.div>
            <div>
              <h2 id="photos-section" className="text-xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Momentos Especiais
              </h2>
              <p className="text-sm text-muted-foreground">Reviva os melhores momentos</p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AccessibleButton 
              variant="ghost" 
              size="sm" 
              className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-200/30 rounded-full px-4 py-2 font-medium"
              onClick={() => navigateTo(ROUTES.GALLERY)}
              aria-label="Ver galeria completa"
            >
              Ver Galeria
            </AccessibleButton>
          </motion.div>
        </motion.div>

        {/* Mobile Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <MobileCarousel photos={latestPhotos} />
        </motion.div>

        {/* Simplified Bottom stats */}
        <motion.div 
          className="flex justify-center mt-6 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-center gap-3 px-6 py-3 bg-background/60 backdrop-blur-md rounded-full border border-border/30 shadow-lg">
            <div className="flex items-center gap-2">
              <Camera className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {latestPhotos.length} fotos na galeria
              </span>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </ErrorBoundary>
  );
});