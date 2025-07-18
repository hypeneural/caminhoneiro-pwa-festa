import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FactCard } from './FactCard';
import { Fact } from '@/types/facts';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface FactsListProps {
  facts: Fact[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
}

export const FactsList = ({
  facts,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRefresh
}: FactsListProps) => {
  const { ref: loadingRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1
  });

  // Trigger load more when intersection is detected
  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, loading, onLoadMore]);

  // Error state
  if (error && facts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Lightbulb className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ops! Algo deu errado
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          {error}
        </p>
        <Button onClick={onRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </Button>
      </motion.div>
    );
  }

  // Empty state
  if (!loading && facts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <div className="w-16 h-16 bg-trucker-blue/10 rounded-full flex items-center justify-center mb-4">
          <Lightbulb className="w-8 h-8 text-trucker-blue" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma curiosidade encontrada
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Não encontramos nenhuma curiosidade com os filtros aplicados. Tente buscar por outro termo ou categoria.
        </p>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Facts list */}
      <div className="space-y-4">
        {facts.map((fact, index) => (
          <FactCard key={fact.id} fact={fact} index={index} />
        ))}
      </div>

      {/* Loading more indicator */}
      {hasMore && (
        <div ref={loadingRef} className="flex justify-center py-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Carregando mais curiosidades...</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={onLoadMore}
              className="gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Carregar Mais
            </Button>
          )}
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && facts.length > 0 && (
        <div className="flex justify-center py-6">
          <p className="text-sm text-muted-foreground">
            🎉 Você viu todas as curiosidades disponíveis!
          </p>
        </div>
      )}
    </div>
  );
};

// Skeleton component for loading state
export const FactsListSkeleton = () => {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          {/* Header skeleton */}
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-3/5 rounded" />
          </div>
          
          {/* Button skeleton */}
          <div className="flex justify-center mt-4">
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 