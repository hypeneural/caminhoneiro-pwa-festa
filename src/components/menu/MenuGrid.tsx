import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { APIMenuItem } from '@/services/api/menuService';
import { MenuItemCard } from './MenuItemCard';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface MenuGridProps {
  items: APIMenuItem[];
  favorites: string[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  viewMode: 'grid' | 'list';
  onLoadMore: () => void;
  onFavoriteToggle: (id: string) => void;
  onItemClick: (item: APIMenuItem) => void;
}

export function MenuGrid({
  items,
  favorites,
  isLoading,
  isFetchingMore,
  hasMore,
  viewMode,
  onLoadMore,
  onFavoriteToggle,
  onItemClick
}: MenuGridProps) {
  // Infinite scroll handling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  });

  useEffect(() => {
    if (inView && hasMore && !isFetchingMore) {
      onLoadMore();
    }
  }, [inView, hasMore, isFetchingMore, onLoadMore]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn(
        'grid gap-3 p-3',
        viewMode === 'grid' 
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
          : 'grid-cols-1'
      )}>
        {Array.from({ length: 8 }).map((_, i) => (
          <MenuItemSkeleton key={i} viewMode={viewMode} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
          <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Nenhum item encontrado
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Tente ajustar seus filtros ou fazer uma nova busca.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className={cn(
        'grid gap-3 p-3',
        viewMode === 'grid' 
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
          : 'grid-cols-1'
      )}>
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              isFavorite={favorites.includes(item.id.toString())}
              onFavoriteToggle={onFavoriteToggle}
              onItemClick={onItemClick}
              viewMode={viewMode}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex justify-center py-8"
        >
          {isFetchingMore && (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}

function MenuItemSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className={cn(
      'rounded-lg overflow-hidden bg-card border animate-pulse',
      viewMode === 'list' ? 'flex' : 'flex flex-col'
    )}>
      {/* Image skeleton */}
      <div className={cn(
        'bg-muted',
        viewMode === 'list' ? 'w-32 h-32' : 'w-full aspect-square'
      )} />

      {/* Content skeleton */}
      <div className={cn(
        'p-4 flex flex-col gap-4',
        viewMode === 'list' ? 'flex-1' : ''
      )}>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div className="h-5 bg-muted rounded w-20" />
          <div className="h-5 bg-muted rounded w-16" />
        </div>
      </div>
    </div>
  );
}