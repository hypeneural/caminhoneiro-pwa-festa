import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PodcastCard } from "@/components/podcast/PodcastCard";
import { PodcastPlayer } from "@/components/podcast/PodcastPlayer";
import { PodcastFilters } from "@/components/podcast/PodcastFilters";
import { Mic, Loader2, WifiOff, RefreshCw, Youtube } from "lucide-react";
import { usePodcast } from "@/hooks/usePodcast";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { PodcastItem, PodcastFilters as PodcastFiltersType } from "@/types/podcast";

const Podcast = () => {
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [filters, setFilters] = useState<PodcastFiltersType>({
    limit: 10,
    page: 1,
    sort: 'created_at',
    order: 'DESC'
  });
  
  const loadingRef = useRef<HTMLDivElement>(null);
  const { isOnline } = useNetworkStatus();
  
  const { 
    items: podcasts, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh,
    fetchPodcasts
  } = usePodcast({ filters, initialLoad: true });

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: PodcastFiltersType) => {
    setFilters(prev => ({ ...newFilters, page: 1 }));
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({
      limit: 10,
      page: 1,
      sort: 'created_at',
      order: 'DESC'
    });
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && isOnline) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadingRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, loadMore, isOnline]);

  const handlePodcastPlay = useCallback((podcast: PodcastItem) => {
    setSelectedPodcast(podcast);
    setIsPlayerOpen(true);
  }, []);

  const handlePlayerClose = useCallback(() => {
    setIsPlayerOpen(false);
    setSelectedPodcast(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Offline Indicator */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center gap-2"
            >
              <WifiOff className="w-4 h-4 text-warning" />
              <span className="text-sm text-warning-foreground">
                Você está offline. Mostrando conteúdo em cache.
              </span>
            </motion.div>
          )}

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Podcast</h1>
            </div>
            <p className="text-muted-foreground">
              Assista aos nossos podcasts exclusivos no YouTube
            </p>
          </div>

          {/* Filters */}
          <PodcastFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />

          {/* Main Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {Object.keys(filters).some(key => filters[key as keyof PodcastFiltersType] && key !== 'limit' && key !== 'page' && key !== 'sort' && key !== 'order') 
                  ? "Resultados da Busca" 
                  : "Últimos Podcasts"}
              </h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            {/* Loading State */}
            {loading && podcasts.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-8 w-10" />
                        <Skeleton className="h-8 w-10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-destructive mb-4">
                  <WifiOff className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-semibold">Erro ao carregar podcasts</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button onClick={handleRefresh} variant="outline">
                  Tentar novamente
                </Button>
              </motion.div>
            )}

            {/* Podcasts Grid */}
            <AnimatePresence mode="wait">
              {podcasts.length > 0 && (
                <motion.div
                  key="podcasts-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {podcasts.map((podcast, index) => (
                    <PodcastCard
                      key={podcast.id}
                      podcast={podcast}
                      onPlay={handlePodcastPlay}
                      index={index}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!loading && podcasts.length === 0 && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhum podcast encontrado</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Tente ajustar os filtros ou buscar por outros termos
                </p>
                <Button onClick={handleFiltersReset} variant="outline">
                  Limpar filtros
                </Button>
              </motion.div>
            )}

            {/* Load More Indicator */}
            {loading && podcasts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-8"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Carregando mais podcasts...</span>
                </div>
              </motion.div>
            )}

            {/* Intersection observer target */}
            <div ref={loadingRef} className="h-10" />

            {/* End of results indicator */}
            {!hasMore && podcasts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-muted-foreground text-sm">
                  🎧 Todos os podcasts foram carregados
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
      
      {/* Podcast Player */}
      <PodcastPlayer
        podcast={selectedPodcast}
        isOpen={isPlayerOpen}
        onClose={handlePlayerClose}
      />
    </div>
  );
};

export default Podcast;