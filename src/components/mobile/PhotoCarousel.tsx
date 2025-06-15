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
  
  const isPhotoLiked = isFavorite(photo.id);
  
  // Responsive card width - smaller for clean mobile design
  const cardWidth = 256; // Reduced from 280 for better mobile fit
  
  // Parallax effect based on scroll position
  const x = useTransform(scrollX, [index * cardWidth - 150, index * cardWidth + 150], [-20, 20]);
  const scale = useTransform(scrollX, [index * cardWidth - 100, index * cardWidth, index * cardWidth + 100], [0.96, 1, 0.96]);

  const handleCardClick = useCallback(() => {
    navigateTo('/galeria');
  }, [navigateTo]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(photo.id);
    
    // Haptic feedback only after user interaction
    if (userInteracted && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }, [photo.id, toggleFavorite, userInteracted]);

  return (
    <motion.div
      className="flex-shrink-0 w-64 sm:w-72 px-2"
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
          onClick={handleCardClick}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onTouchCancel={() => setIsPressed(false)}
        >
          <RippleEffect rippleColor="rgba(255,255,255,0.3)">
            <Card className={`
              overflow-hidden relative group cursor-pointer
              bg-gradient-to-br from-background/95 to-background/90
              backdrop-blur-md border border-border/20
              shadow-lg hover:shadow-xl transition-all duration-300
              ${isPressed ? 'shadow-sm' : 'shadow-lg'}
            `}>
              {/* Main Image with aspect ratio optimized for horizontal photos */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  animate={{ 
                    scale: isPressed ? 1.02 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <OptimizedImage
                    src={photo.imageUrl}
                    alt={`Momento especial: ${photo.category}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* Simplified gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Clean interactive elements */}
                <div className="absolute inset-0 flex flex-col justify-between p-3">
                  {/* Top bar - only favorite button */}
                  <div className="flex justify-end">
                    <motion.div
                      whileTap={{ scale: 0.8 }}
                      animate={{ scale: isPhotoLiked ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AccessibleButton
                        variant="ghost"
                        size="sm"
                        className={`w-8 h-8 backdrop-blur-sm rounded-full transition-all ${
                          isPhotoLiked 
                            ? 'bg-red-500/90 text-white hover:bg-red-600/90' 
                            : 'bg-black/30 text-white/90 hover:bg-black/50'
                        }`}
                        onClick={handleLikeClick}
                        aria-label={isPhotoLiked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isPhotoLiked ? 'fill-current' : ''}`} />
                      </AccessibleButton>
                    </motion.div>
                  </div>

                  {/* Bottom info - clean and minimal */}
                  <div className="flex items-center justify-between">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <Badge 
                        className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs font-medium px-2 py-1"
                      >
                        {photo.category}
                      </Badge>
                    </motion.div>
                  </div>
                </div>

                {/* Featured star for special photos */}
                {photo.featured && (
                  <motion.div 
                    className="absolute top-3 left-3"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                      <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                  </motion.div>
                )}
              </div>
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

      {/* Functional pagination dots */}
      <div className="flex justify-center gap-2 mt-4">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (containerRef.current) {
                const cardWidth = 300;
                containerRef.current.scrollTo({
                  left: index * cardWidth,
                  behavior: 'smooth'
                });
                setCurrentIndex(index);
                setUserInteracted(true);
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-primary scale-125' 
                : 'bg-muted hover:bg-muted-foreground/70'
            }`}
            aria-label={`Ir para foto ${index + 1}`}
          />
        ))}
      </div>
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