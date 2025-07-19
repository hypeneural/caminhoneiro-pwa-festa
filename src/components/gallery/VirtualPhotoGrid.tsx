import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Calendar, Truck } from 'lucide-react';
import { Photo } from '@/types/gallery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';

// Configurações do grid com proporção 3:4 padronizada (vertical)
const GRID_CONFIG = {
  OVERSCAN_COUNT: 3,
  ASPECT_RATIO: 3/4, // Proporção fixa 3:4 para thumbnails (vertical)
  PADDING: 4,
  GAP: 6,
  DEFAULT_COLUMNS_MOBILE: 2,
  DEFAULT_COLUMNS_TABLET: 3,
  DEFAULT_COLUMNS_DESKTOP: 4,
  BUFFER_SIZE: 20,
} as const;

// Cache para otimizar cálculos de dimensões
const dimensionsCache = new Map<string, { width: number; height: number }>();

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    photos: Photo[];
    columnCount: number;
    onPhotoClick: (photo: Photo) => void;
    favorites: string[];
    onToggleFavorite: (photoId: string) => void;
    itemWidth: number;
  };
}

// Componente de item seguro para hooks
const GridItem = memo(({ columnIndex, rowIndex, style, data }: GridItemProps) => {
  const { photos, columnCount, onPhotoClick, favorites, onToggleFavorite, itemWidth } = data;
  const photoIndex = rowIndex * columnCount + columnIndex;
  const photo = photos[photoIndex];

  // SEMPRE executar todos os hooks primeiro
  const itemRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoizar valores para performance
  const isFavorite = useMemo(() => 
    photo ? favorites.includes(photo.id) : false, 
    [photo, favorites]
  );

  const itemHeight = useMemo(() => {
    // Proporção fixa 4:3 para todas as thumbnails
    const height = Math.round(itemWidth / GRID_CONFIG.ASPECT_RATIO);
    
    if (photo) {
      const cacheKey = `${photo.id}-${itemWidth}`;
      dimensionsCache.set(cacheKey, { width: itemWidth, height });
    }
    
    return height;
  }, [photo, itemWidth]);

  // Intersection Observer melhorado para lazy loading
  useEffect(() => {
    if (!itemRef.current || !photo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.01, // Trigger mais cedo
        rootMargin: '100px 0px 300px 0px' // Margem maior para baixo (pré-carregamento)
      }
    );

    observer.observe(itemRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isVisible, photo]);

  // Reset states quando photo muda
  useEffect(() => {
    if (photo) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [photo?.id]);

  // Handlers
  const handlePhotoClick = useCallback(() => {
    if (photo) {
      onPhotoClick(photo);
    }
  }, [photo, onPhotoClick]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (photo) {
      onToggleFavorite(photo.id);
    }
  }, [photo, onToggleFavorite]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Renderização condicional APÓS todos os hooks
  const renderContent = () => {
    // Placeholder para posições vazias
    if (!photo) {
      return (
        <div className="w-full h-full bg-muted/30 rounded-lg animate-pulse" />
      );
    }

    // Conteúdo da foto
    const imageUrl = photo.variants?.thumbnail?.webp || photo.variants?.thumbnail?.jpg || photo.thumbnailUrl;
    const fallbackUrl = photo.variants?.thumbnail?.jpg || photo.thumbnailUrl;

    return (
      <motion.div
        className="relative w-full h-full bg-muted/20 rounded-lg overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-200"
        onClick={handlePhotoClick}
        whileTap={{ scale: 0.98 }}
        style={{ minHeight: itemHeight }}
      >
        {/* Loading placeholder */}
        {!imageLoaded && !imageError && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/60 animate-pulse"
            style={{ backgroundColor: photo.dominant_color }}
          />
        )}

        {/* Imagem principal */}
        {isVisible && (
          <OptimizedImage
            src={imageUrl}
            fallbackSrc={fallbackUrl}
            alt={photo.title || `Foto ${photoIndex + 1}`}
            className={`
              thumbnail-3x4 transition-opacity duration-300
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
            draggable={false}
          />
        )}

        {/* Overlay com informações */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {photo.group && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs mb-1 bg-black/30 text-white border-none"
                  >
                    {photo.group.nome}
                  </Badge>
                )}
                
                {photo.vehiclePlate && (
                  <div className="flex items-center text-xs opacity-90">
                    <Truck className="w-3 h-3 mr-1" />
                    {photo.vehiclePlate}
                  </div>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={handleToggleFavorite}
              >
                <Heart 
                  className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Badge de destaque */}
        {photo.destaque && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-amber-500 text-white border-none text-xs">
              ⭐ Destaque
            </Badge>
          </div>
        )}

        {/* Visualizações */}
        {photo.views > 0 && (
          <div className="absolute top-2 right-2 bg-black/30 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            {photo.views}
          </div>
        )}

        {/* Erro de carregamento */}
        {imageError && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-muted-foreground text-center">
              <div className="text-2xl mb-2">📷</div>
              <div className="text-xs">Erro ao carregar</div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div 
      ref={itemRef}
      style={style} 
      className="p-1 grid-item"
    >
      {renderContent()}
    </div>
  );
});

GridItem.displayName = 'GridItem';

interface VirtualPhotoGridProps {
  photos: Photo[];
  loading: boolean;
  hasMore: boolean;
  onPhotoClick: (photo: Photo) => void;
  onLoadMore: () => void;
  favorites: string[];
  onToggleFavorite: (photoId: string) => void;
  isRefreshing: boolean;
  isLoadingMore?: boolean;
  onScroll?: (scrollTop: number) => void;
}

export const VirtualPhotoGrid: React.FC<VirtualPhotoGridProps> = ({
  photos,
  loading,
  hasMore,
  onPhotoClick,
  onLoadMore,
  favorites,
  onToggleFavorite,
  isRefreshing,
  isLoadingMore = false,
  onScroll
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isNearBottom, setIsNearBottom] = useState(false);

  // Detecta redimensionamento
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerSize({ width: clientWidth, height: clientHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calcula configurações do grid
  const gridConfig = useMemo(() => {
    const { width } = containerSize;
    
    let columnCount: number = GRID_CONFIG.DEFAULT_COLUMNS_MOBILE;
    if (width >= 768) columnCount = GRID_CONFIG.DEFAULT_COLUMNS_TABLET;
    if (width >= 1024) columnCount = GRID_CONFIG.DEFAULT_COLUMNS_DESKTOP;

    const totalPadding = GRID_CONFIG.PADDING * 2;
    const totalGaps = GRID_CONFIG.GAP * (columnCount - 1);
    const itemWidth = Math.floor((width - totalPadding - totalGaps) / columnCount);
    
    const rowCount = Math.ceil(photos.length / columnCount);

    // Altura fixa baseada na proporção 4:3
    const standardHeight = Math.round(itemWidth / GRID_CONFIG.ASPECT_RATIO);

    return {
      columnCount,
      rowCount,
      itemWidth,
      itemHeight: standardHeight
    };
  }, [containerSize.width, photos]);

  // Dados para o grid
  const itemData = useMemo(() => ({
    photos,
    columnCount: gridConfig.columnCount,
    onPhotoClick,
    favorites,
    onToggleFavorite,
    itemWidth: gridConfig.itemWidth
  }), [photos, gridConfig.columnCount, gridConfig.itemWidth, onPhotoClick, favorites, onToggleFavorite]);

  // Scroll handler melhorado para infinite loading
  const handleScroll = useCallback((scrollInfo: any) => {
    // React-window Grid passa diferentes propriedades
    const scrollTop = scrollInfo.scrollTop || 0;
    const scrollLeft = scrollInfo.scrollLeft || 0;
    
    // Chama callback de scroll para controle do header
    onScroll?.(scrollTop);
    
    // Pega dimensões do container real
    const gridElement = document.querySelector('.virtual-grid-scroll');
    if (!gridElement) return;
    
    const containerHeight = gridElement.clientHeight;
    const contentHeight = gridElement.scrollHeight;
    
    // Cálculo mais preciso para trigger do infinite scroll
    const scrollBottom = scrollTop + containerHeight;
    const threshold = contentHeight * 0.85; // 85% do scroll
    const nearBottom = scrollBottom >= threshold;
    
    // Alternativa: baseado em distância absoluta do final
    const distanceFromBottom = contentHeight - scrollBottom;
    const pixelThreshold = Math.max(500, containerHeight * 0.5); // 500px ou 50% da altura visível
    const nearBottomPixels = distanceFromBottom <= pixelThreshold;
    
    const shouldLoadMore = nearBottom || nearBottomPixels;
    
    setIsNearBottom(shouldLoadMore);
    
    // Debug mais detalhado para verificar scroll
    console.log('📊 Scroll Debug:', {
      scrollTop: Math.round(scrollTop),
      containerHeight,
      contentHeight,
      scrollBottom: Math.round(scrollBottom),
      threshold: Math.round(threshold),
      distanceFromBottom: Math.round(distanceFromBottom),
      pixelThreshold,
      nearBottom,
      nearBottomPixels,
      shouldLoadMore,
      hasMore,
      loading,
      isRefreshing,
      isLoadingMore
    });
    
    // Trigger do infinite scroll
    if (shouldLoadMore && hasMore && !loading && !isRefreshing && !isLoadingMore) {
      console.log('🚀 TRIGGERING LoadMore - Scroll reached threshold!');
      onLoadMore();
    } else if (shouldLoadMore) {
      console.log('❌ LoadMore BLOCKED:', {
        shouldLoadMore,
        hasMore,
        loading,
        isRefreshing,
        isLoadingMore
      });
    }
  }, [hasMore, loading, isRefreshing, isLoadingMore, onLoadMore, onScroll]);

  // Loading state
  if (loading && photos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando fotos...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && photos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma foto encontrada</h3>
          <p className="text-muted-foreground">Tente ajustar os filtros ou aguarde novas fotos serem adicionadas.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0 virtual-grid-container">
      {containerSize.width > 0 && containerSize.height > 0 && (
        <Grid
          columnCount={gridConfig.columnCount}
          columnWidth={gridConfig.itemWidth + GRID_CONFIG.GAP}
          height={containerSize.height}
          rowCount={gridConfig.rowCount}
          rowHeight={gridConfig.itemHeight}
          width={containerSize.width}
          itemData={itemData}
          overscanRowCount={GRID_CONFIG.OVERSCAN_COUNT}
          onScroll={handleScroll}
          className="scrollbar-thin virtual-grid-scroll"
          style={{ 
            overflowX: 'hidden',
            overflowY: 'auto',
            contain: 'layout style paint'
          }}
        >
          {GridItem}
        </Grid>
      )}

      {/* Loading indicator */}
      <AnimatePresence>
        {(loading || isRefreshing) && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg"
          >
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-muted-foreground">
                {isRefreshing ? 'Atualizando...' : 'Carregando mais fotos...'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Infinite scroll loading indicator */}
      <AnimatePresence>
        {isLoadingMore && hasMore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-4 right-4 bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg"
          >
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* End indicator */}
      {!hasMore && photos.length > 0 && !loading && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-px bg-border" />
            <span>Fim da galeria</span>
            <div className="w-8 h-px bg-border" />
          </div>
        </div>
      )}
    </div>
  );
};