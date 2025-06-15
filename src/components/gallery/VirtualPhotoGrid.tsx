import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Share2, MapPin, Calendar, Truck } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Photo } from '@/types/gallery';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';

interface VirtualPhotoGridProps {
  photos: Photo[];
  loading: boolean;
  hasMore: boolean;
  onPhotoClick: (photo: Photo) => void;
  onLoadMore: () => void;
  favorites: string[];
  onToggleFavorite: (photoId: string) => void;
}

const PhotoCard = React.memo(({ 
  photo, 
  style, 
  onPhotoClick, 
  isFavorite, 
  onToggleFavorite 
}: {
  photo: Photo;
  style: React.CSSProperties;
  onPhotoClick: (photo: Photo) => void;
  isFavorite: boolean;
  onToggleFavorite: (photoId: string) => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const isMobile = useIsMobile();

  const handleClick = useCallback(() => {
    onPhotoClick(photo);
  }, [photo, onPhotoClick]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(photo.id);
    
    // Haptic feedback on mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }, [photo.id, onToggleFavorite, isMobile]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.title || 'Foto da Procissão',
          text: `Confira esta foto incrível da procissão! ${photo.vehiclePlate ? `Placa: ${photo.vehiclePlate}` : ''}`,
          url: photo.url
        });
      } catch (error) {
        // Fallback para clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(photo.url);
        }
      }
    }
  }, [photo]);

  return (
    <div style={style} className="p-1">
      <TouchFeedback scale={0.98} haptic>
        <motion.div
          className="relative bg-background rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onTouchCancel={() => setIsPressed(false)}
        >
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden">
            <OptimizedImage
              src={photo.thumbnailUrl}
              alt={photo.title || `Foto ${photo.id}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              {/* Top Actions */}
              <div className="absolute top-2 right-2 flex gap-1">
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
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 bg-black/30 text-white/90 hover:bg-black/50 backdrop-blur-sm rounded-full"
                  onClick={handleShare}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    {photo.vehiclePlate && (
                      <Badge className="bg-trucker-blue/90 text-trucker-blue-foreground text-xs w-fit">
                        <Truck className="w-3 h-3 mr-1" />
                        {photo.vehiclePlate}
                      </Badge>
                    )}
                    
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs w-fit">
                      {photo.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{photo.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{photo.likes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading state */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
          </div>

          {/* Quick Info Bar */}
          <div className="p-2 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(photo.timestamp).toLocaleDateString('pt-BR')}</span>
              </div>
              
              {photo.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-20">Chapecó</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </TouchFeedback>
    </div>
  );
});

PhotoCard.displayName = 'PhotoCard';

const LoadingCard = React.memo(({ style }: { style: React.CSSProperties }) => (
  <div style={style} className="p-1">
    <div className="bg-muted rounded-xl overflow-hidden h-full animate-pulse">
      <div className="aspect-square bg-muted-foreground/10" />
      <div className="p-2 space-y-2">
        <div className="h-3 bg-muted-foreground/10 rounded w-3/4" />
        <div className="h-2 bg-muted-foreground/10 rounded w-1/2" />
      </div>
    </div>
  </div>
));

LoadingCard.displayName = 'LoadingCard';

export function VirtualPhotoGrid({
  photos,
  loading,
  hasMore,
  onPhotoClick,
  onLoadMore,
  favorites,
  onToggleFavorite
}: VirtualPhotoGridProps) {
  const isMobile = useIsMobile();
  const gridRef = useRef<Grid>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Responsive grid calculations
  const columnCount = isMobile ? 2 : window.innerWidth < 1024 ? 3 : 4;
  const itemWidth = Math.floor((window.innerWidth - 32) / columnCount); // 32px for padding
  const itemHeight = itemWidth + 60; // Extra height for info bar

  // Intersection observer for infinite loading
  const { isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, loading, onLoadMore]);

  useEffect(() => {
    if (loadMoreRef.current) {
      // This will trigger the intersection observer
    }
  }, []);

  const Cell = useCallback(({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    const photo = photos[index];

    if (!photo) {
      if (loading && index < photos.length + 6) {
        return <LoadingCard style={style} />;
      }
      return null;
    }

    return (
      <PhotoCard
        photo={photo}
        style={style}
        onPhotoClick={onPhotoClick}
        isFavorite={favorites.includes(photo.id)}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }, [photos, columnCount, loading, onPhotoClick, favorites, onToggleFavorite]);

  const rowCount = Math.ceil((photos.length + (loading ? 6 : 0)) / columnCount);

  if (photos.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📷</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma foto encontrada
        </h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Tente ajustar os filtros ou usar termos de busca diferentes para encontrar mais fotos.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Grid
        ref={gridRef}
        columnCount={columnCount}
        columnWidth={itemWidth}
        height={window.innerHeight - 200} // Account for header and filters
        rowCount={rowCount}
        rowHeight={itemHeight}
        width={window.innerWidth}
        className="scrollbar-hide"
        style={{ overflowX: 'hidden' }}
      >
        {Cell}
      </Grid>
      
      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Carregando mais fotos...</span>
          </div>
        )}
      </div>
    </div>
  );
}