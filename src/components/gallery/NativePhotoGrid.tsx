import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Heart, Share2, Download, MoreHorizontal } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Button } from '@/components/ui/button';
import { Photo } from '@/types/gallery';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';

interface NativePhotoGridProps {
  photos: Photo[];
  loading: boolean;
  hasMore: boolean;
  onPhotoClick: (photo: Photo) => void;
  onLoadMore: () => void;
  favorites: string[];
  onToggleFavorite: (photoId: string) => void;
  selectedPhotos?: string[];
  onToggleSelection?: (photoId: string) => void;
  isSelectionMode?: boolean;
}

interface PhotoItemProps {
  photo: Photo;
  style: React.CSSProperties;
  onPhotoClick: (photo: Photo) => void;
  isFavorite: boolean;
  onToggleFavorite: (photoId: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (photoId: string) => void;
  isSelectionMode?: boolean;
  itemIndex: number;
}

const PhotoItem = React.memo(({
  photo,
  style,
  onPhotoClick,
  isFavorite,
  onToggleFavorite,
  isSelected = false,
  onToggleSelection,
  isSelectionMode = false,
  itemIndex
}: PhotoItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isMobile = useIsMobile();
  
  // Motion values for advanced interactions
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);
  const springConfig = { damping: 20, stiffness: 300 };
  const scaleSpring = useSpring(scale, springConfig);

  const handlePress = useCallback(() => {
    setIsPressed(true);
    scale.set(0.95);
    
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [scale, isMobile]);

  const handleRelease = useCallback(() => {
    setIsPressed(false);
    scale.set(1);
  }, [scale]);

  const handleClick = useCallback(() => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(photo.id);
      
      // Stronger haptic for selection
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
    } else {
      onPhotoClick(photo);
    }
  }, [photo, onPhotoClick, isSelectionMode, onToggleSelection, isMobile]);

  const handleLongPress = useCallback(() => {
    if (onToggleSelection) {
      onToggleSelection(photo.id);
      
      // Strong haptic for long press
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    }
  }, [photo.id, onToggleSelection, isMobile]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(photo.id);
    
    // Heart animation haptic
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(isFavorite ? 15 : 25);
    }
  }, [photo.id, onToggleFavorite, isFavorite, isMobile]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.title || 'Foto da Procissão',
          text: `Confira esta foto da procissão! ${photo.vehiclePlate ? `Placa: ${photo.vehiclePlate}` : ''}`,
          url: photo.url
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  }, [photo]);

  return (
    <div style={style} className="p-1">
      <TouchFeedback
        scale={0.98}
        haptic
      >
        <motion.div
          className="relative bg-background rounded-2xl overflow-hidden shadow-sm h-full cursor-pointer group"
          style={{ scale: scaleSpring }}
          onTouchStart={handlePress}
          onTouchEnd={handleRelease}
          onTouchCancel={handleRelease}
          onMouseDown={handlePress}
          onMouseUp={handleRelease}
          onMouseLeave={() => {
            handleRelease();
            setShowActions(false);
          }}
          onClick={handleClick}
          onMouseEnter={() => setShowActions(true)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            borderColor: isSelected ? 'rgb(59, 130, 246)' : 'transparent'
          }}
          transition={{ 
            delay: itemIndex * 0.02,
            duration: 0.3,
            ease: "easeOut"
          }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Selection Indicator */}
          <AnimatePresence>
            {isSelectionMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-2 left-2 z-20"
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'bg-primary border-primary' 
                    : 'bg-background/80 border-white/50 backdrop-blur-sm'
                }`}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 bg-primary-foreground rounded-full"
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden">
            <OptimizedImage
              src={photo.thumbnailUrl}
              alt={photo.title || `Foto ${photo.id}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Action Buttons */}
            <AnimatePresence>
              {(showActions || isMobile) && !isSelectionMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-2 right-2 flex gap-1"
                >
                  <TouchFeedback>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-8 h-8 backdrop-blur-sm rounded-full transition-all ${
                        isFavorite 
                          ? 'bg-red-500/90 text-white hover:bg-red-600/90' 
                          : 'bg-black/30 text-white/90 hover:bg-black/50'
                      }`}
                      onClick={handleFavoriteClick}
                    >
                      <motion.div
                        animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                      </motion.div>
                    </Button>
                  </TouchFeedback>
                  
                  <TouchFeedback>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 bg-black/30 text-white/90 hover:bg-black/50 backdrop-blur-sm rounded-full"
                      onClick={handleShare}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                  </TouchFeedback>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading State */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Enhanced Selection Overlay */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-2xl"
              />
            )}
          </AnimatePresence>

          {/* Pressed State Overlay */}
          <AnimatePresence>
            {isPressed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/10 rounded-2xl"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </TouchFeedback>
    </div>
  );
});

PhotoItem.displayName = 'PhotoItem';

const LoadingItem = React.memo(({ style }: { style: React.CSSProperties }) => (
  <div style={style} className="p-1">
    <div className="bg-muted rounded-2xl overflow-hidden h-full animate-pulse">
      <div className="aspect-square bg-muted-foreground/10" />
    </div>
  </div>
));

LoadingItem.displayName = 'LoadingItem';

export function NativePhotoGrid({
  photos,
  loading,
  hasMore,
  onPhotoClick,
  onLoadMore,
  favorites,
  onToggleFavorite,
  selectedPhotos = [],
  onToggleSelection,
  isSelectionMode = false
}: NativePhotoGridProps) {
  const isMobile = useIsMobile();
  const gridRef = useRef<Grid>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Responsive grid calculations with better spacing
  const columnCount = useMemo(() => {
    if (isMobile) return 2;
    if (window.innerWidth < 1024) return 3;
    if (window.innerWidth < 1440) return 4;
    return 5;
  }, [isMobile]);

  const itemWidth = useMemo(() => 
    Math.floor((window.innerWidth - 24) / columnCount), [columnCount]);
  
  const itemHeight = useMemo(() => itemWidth, [itemWidth]);

  // Intersection observer for infinite loading
  const { isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px'
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, loading, onLoadMore]);

  // Grid cell renderer with enhanced performance
  const Cell = useCallback(({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    const photo = photos[index];

    if (!photo) {
      if (loading && index < photos.length + (columnCount * 2)) {
        return <LoadingItem style={style} />;
      }
      return null;
    }

    return (
      <PhotoItem
        photo={photo}
        style={style}
        onPhotoClick={onPhotoClick}
        isFavorite={favorites.includes(photo.id)}
        onToggleFavorite={onToggleFavorite}
        isSelected={selectedPhotos.includes(photo.id)}
        onToggleSelection={onToggleSelection}
        isSelectionMode={isSelectionMode}
        itemIndex={index}
      />
    );
  }, [
    photos, 
    columnCount, 
    loading, 
    onPhotoClick, 
    favorites, 
    onToggleFavorite,
    selectedPhotos,
    onToggleSelection,
    isSelectionMode
  ]);

  const rowCount = Math.ceil((photos.length + (loading ? columnCount * 2 : 0)) / columnCount);

  // Empty state
  if (photos.length === 0 && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6"
        >
          <span className="text-3xl">📷</span>
        </motion.div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nenhuma foto encontrada
        </h3>
        <p className="text-muted-foreground text-center max-w-sm leading-relaxed">
          Tente ajustar os filtros ou usar termos de busca diferentes para encontrar mais fotos da procissão.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="h-full">
      <Grid
        ref={gridRef}
        columnCount={columnCount}
        columnWidth={itemWidth}
        height={window.innerHeight - 180}
        rowCount={rowCount}
        rowHeight={itemHeight}
        width={window.innerWidth}
        className="scrollbar-hide"
        style={{ overflowX: 'hidden' }}
        overscanRowCount={2}
      >
        {Cell}
      </Grid>
      
      {/* Enhanced load more indicator */}
      <div ref={loadMoreRef} className="h-16 flex items-center justify-center">
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-3 text-muted-foreground"
            >
              <div className="relative">
                <div className="w-6 h-6 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <span className="text-sm font-medium">Carregando mais fotos...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}