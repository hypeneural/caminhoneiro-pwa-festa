import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Calendar, Truck } from 'lucide-react';
import { Photo } from '@/types/gallery';
import { Banner } from '@/types/sponsors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { GalleryAdBanner } from './GalleryAdBanner';
import { useBanners } from '@/hooks/useBanners';

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
  BANNER_INTERVAL: 3, // A cada 3 linhas inserir banner
} as const;

// Cache para otimizar cálculos de dimensões
const dimensionsCache = new Map<string, { width: number; height: number }>();

// Tipo para itens mistos (fotos + banners)
type GridItemType = 
  | { type: 'photo'; data: Photo; originalIndex: number }
  | { type: 'banner'; data: Banner; originalIndex: number };

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: GridItemType[];
    columnCount: number;
    onPhotoClick: (photo: Photo) => void;
    favorites: string[];
    onToggleFavorite: (photoId: string) => void;
    itemWidth: number;
    onBannerClick?: (banner: Banner, position: number) => void;
    onBannerImpression?: (banner: Banner, position: number) => void;
    onBannerDismiss?: (bannerId: number) => void;
  };
}

// Componente de item seguro para hooks
const MixedGridItem = memo(({ columnIndex, rowIndex, style, data }: GridItemProps) => {
  const { 
    items, 
    columnCount, 
    onPhotoClick, 
    favorites, 
    onToggleFavorite, 
    itemWidth,
    onBannerClick,
    onBannerImpression,
    onBannerDismiss
  } = data;
  
  const itemIndex = rowIndex * columnCount + columnIndex;
  const gridItem = items[itemIndex];

  // SEMPRE executar todos os hooks primeiro
  const itemRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoizar valores para performance
  const isFavorite = useMemo(() => 
    gridItem?.type === 'photo' && gridItem.data ? favorites.includes(gridItem.data.id) : false, 
    [gridItem, favorites]
  );

  const itemHeight = useMemo(() => {
    // Proporção fixa 3:4 para todas as thumbnails
    const height = Math.round(itemWidth / GRID_CONFIG.ASPECT_RATIO);
    
    if (gridItem?.type === 'photo') {
      const cacheKey = `${gridItem.data.id}-${itemWidth}`;
      dimensionsCache.set(cacheKey, { width: itemWidth, height });
    }
    
    return height;
  }, [gridItem, itemWidth]);

  // Intersection Observer melhorado para lazy loading
  useEffect(() => {
    if (!itemRef.current || !gridItem) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, [gridItem, isVisible]);

  // Se não há item, renderiza slot vazio
  if (!gridItem) {
    return <div ref={itemRef} style={style} />;
  }

  // Renderiza banner
  if (gridItem.type === 'banner') {
    // Determina variante baseada na categoria do banner
    const getVariant = () => {
      if (gridItem.data.category === 'sponsor') {
        return 'square'; // Sponsors são sempre quadrados (logos 300x300)
      }
      // Banners da API (1080x360) são horizontais e ocupam 2 colunas
      return columnIndex === 0 && columnCount > 1 ? 'horizontal' : 'square';
    };

    return (
      <div ref={itemRef} style={style} className="p-1">
        <GalleryAdBanner
          banner={gridItem.data}
          position={itemIndex}
          onBannerClick={onBannerClick}
          onBannerImpression={onBannerImpression}
          onBannerDismiss={onBannerDismiss}
          variant={getVariant()}
          className="h-full"
        />
      </div>
    );
  }

  // Renderiza foto
  const photo = gridItem.data;

  const renderPhotoContent = () => {
    if (!isVisible) {
      return (
        <div 
          className="w-full bg-muted/20 rounded-xl animate-pulse"
          style={{ height: itemHeight }}
        />
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative group bg-muted/5 rounded-xl overflow-hidden cursor-pointer"
        style={{ height: itemHeight }}
        onClick={() => onPhotoClick(photo)}
      >
        {/* Imagem principal */}
        <div className="relative w-full h-full overflow-hidden">
          <OptimizedImage
            src={photo.thumbnailUrl}
            alt={photo.description || `Foto ${photo.id}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Overlay escuro no hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        </div>

        {/* Controles de ação */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {/* Botão de favorito */}
            <div className="bg-black/30 backdrop-blur-sm rounded-full">
              <Button
                size="sm"
                variant="ghost"
                className={`w-8 h-8 p-0 hover:bg-white/20 ${
                  isFavorite ? 'text-red-500' : 'text-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(photo.id);
                }}
              >
                <Heart
                  className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
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
          <div className="absolute bottom-2 right-2 bg-black/30 text-white text-xs px-2 py-1 rounded-full flex items-center">
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
      {renderPhotoContent()}
    </div>
  );
});

MixedGridItem.displayName = 'MixedGridItem';

interface VirtualPhotoGridWithAdsProps {
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
  enableAds?: boolean;
}

export const VirtualPhotoGridWithAds: React.FC<VirtualPhotoGridWithAdsProps> = ({
  photos,
  loading,
  hasMore,
  onPhotoClick,
  onLoadMore,
  favorites,
  onToggleFavorite,
  isRefreshing,
  isLoadingMore = false,
  onScroll,
  enableAds = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isNearBottom, setIsNearBottom] = useState(false);

  // Hook de banners
  const {
    galleryBanners,
    trackBannerImpression,
    trackBannerClick,
    dismissBanner,
    getBannerStats
  } = useBanners({
    enableRandomRotation: true,
    galleryInsertionInterval: GRID_CONFIG.BANNER_INTERVAL,
    analyticsEnabled: true
  });

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
    
    return {
      columnCount,
      itemWidth,
      itemHeight: Math.round(itemWidth / GRID_CONFIG.ASPECT_RATIO)
    };
  }, [containerSize.width]);

  // Cria grid misto com fotos e banners
  const mixedItems = useMemo(() => {
    if (!enableAds || galleryBanners.length === 0) {
      // Sem ads, apenas fotos
      return photos.map((photo, index) => ({
        type: 'photo' as const,
        data: photo,
        originalIndex: index
      }));
    }

    const items: GridItemType[] = [];
    const { columnCount } = gridConfig;
    
    let bannerIndex = 0;
    let photoIndex = 0;
    
    // Insere itens linha por linha
    while (photoIndex < photos.length) {
      const currentRow = Math.floor(photoIndex / columnCount);
      
      // A cada BANNER_INTERVAL linhas, insere um banner
      if (currentRow > 0 && currentRow % GRID_CONFIG.BANNER_INTERVAL === 0 && bannerIndex < galleryBanners.length) {
        // Banner ocupa primeira posição da linha
        items.push({
          type: 'banner',
          data: galleryBanners[bannerIndex],
          originalIndex: items.length
        });
        bannerIndex++;
        
        // Restante da linha com fotos (ou vazio se não há fotos suficientes)
        for (let col = 1; col < columnCount && photoIndex < photos.length; col++) {
          items.push({
            type: 'photo',
            data: photos[photoIndex],
            originalIndex: photoIndex
          });
          photoIndex++;
        }
      } else {
        // Linha normal com fotos
        for (let col = 0; col < columnCount && photoIndex < photos.length; col++) {
          items.push({
            type: 'photo',
            data: photos[photoIndex],
            originalIndex: photoIndex
          });
          photoIndex++;
        }
      }
    }
    
    return items;
  }, [photos, galleryBanners, gridConfig.columnCount, enableAds]);

  // Calcula número de linhas total
  const totalRows = useMemo(() => {
    const { columnCount } = gridConfig;
    return Math.ceil(mixedItems.length / columnCount);
  }, [mixedItems.length, gridConfig.columnCount]);

  // Dados para o grid
  const itemData = useMemo(() => ({
    items: mixedItems,
    columnCount: gridConfig.columnCount,
    onPhotoClick,
    favorites,
    onToggleFavorite,
    itemWidth: gridConfig.itemWidth,
    onBannerClick: trackBannerClick,
    onBannerImpression: trackBannerImpression,
    onBannerDismiss: dismissBanner
  }), [
    mixedItems, 
    gridConfig.columnCount, 
    gridConfig.itemWidth, 
    onPhotoClick, 
    favorites, 
    onToggleFavorite,
    trackBannerClick,
    trackBannerImpression,
    dismissBanner
  ]);

  // Scroll handler melhorado para infinite loading
  const handleScroll = useCallback((scrollInfo: any) => {
    const scrollTop = scrollInfo.scrollTop || 0;
    
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
    
    // Debug simplificado apenas para triggers importantes
    if (shouldLoadMore) {
      console.log('📊 Scroll trigger:', {
        shouldLoadMore,
        distanceFromBottom: Math.round(distanceFromBottom),
        hasMore,
        loading: loading || isRefreshing || isLoadingMore
      });
    }
    
    // Trigger do infinite scroll
    if (shouldLoadMore && hasMore && !loading && !isRefreshing && !isLoadingMore) {
      console.log('🚀 TRIGGERING LoadMore - Mixed Grid reached threshold!');
      onLoadMore();
    } else if (shouldLoadMore) {
      console.log('❌ Mixed Grid LoadMore BLOCKED:', {
        shouldLoadMore,
        hasMore,
        loading,
        isRefreshing,
        isLoadingMore
      });
    }
  }, [hasMore, loading, isRefreshing, isLoadingMore, onLoadMore, onScroll, mixedItems.length, photos.length, galleryBanners.length]);

  if (containerSize.width === 0 || containerSize.height === 0) {
    return (
      <div 
        ref={containerRef}
        className="w-full h-full virtual-grid-container"
      >
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full virtual-grid-container"
    >
      <Grid
        columnCount={gridConfig.columnCount}
        rowCount={totalRows}
        columnWidth={gridConfig.itemWidth + GRID_CONFIG.GAP}
        rowHeight={gridConfig.itemHeight + GRID_CONFIG.GAP}
        height={containerSize.height}
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
        {MixedGridItem}
      </Grid>



      {/* Loading states */}
      <AnimatePresence>
        {(loading || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
              <span className="text-sm text-muted-foreground">
                {isRefreshing ? 'Atualizando...' : 'Carregando fotos...'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load more indicator */}
      <AnimatePresence>
        {isLoadingMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-full text-sm flex items-center z-10"
          >
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Carregando mais fotos...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 