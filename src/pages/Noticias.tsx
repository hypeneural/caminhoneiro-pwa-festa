import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { NewsModal } from "@/components/mobile/NewsModal";
import { NewsFilters } from "@/components/news/NewsFilters";
import { NewsCard } from "@/components/news/NewsCard";
import { Newspaper, Loader2, WifiOff, RefreshCw, TrendingUp } from "lucide-react";
import { useNews, useFeaturedNews } from "@/hooks/useNews";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { NewsItem, NewsFilters as NewsFiltersType } from "@/types/news";

const Noticias = () => {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<NewsFiltersType>({
    limit: 10,
    page: 1,
    sort: 'published_at',
    order: 'DESC'
  });
  
  const loadingRef = useRef<HTMLDivElement>(null);
  const { isOnline } = useNetworkStatus();
  
  // Main news with filters
  const { 
    items: news, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh,
    fetchNews
  } = useNews({ filters, initialLoad: true });
  
  // Featured news
  const { 
    featuredNews, 
    loading: featuredLoading 
  } = useFeaturedNews();

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: NewsFiltersType) => {
    setFilters(prev => ({ ...newFilters, page: 1 }));
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({
      limit: 10,
      page: 1,
      sort: 'published_at',
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

  const handleNewsClick = useCallback((newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedNews(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Get all news for modal navigation
  const allNews = [...(featuredNews || []), ...news];

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
              <Newspaper className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Notícias</h1>
            </div>
            <p className="text-muted-foreground">
              Fique por dentro de tudo sobre a festa
            </p>
          </div>

          {/* Filters */}
          <NewsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />

          {/* Featured News Section */}
          {featuredNews && featuredNews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Em Destaque</h2>
              </div>
              
              {featuredLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {featuredNews.slice(0, 2).map((newsItem, index) => (
                    <NewsCard
                      key={newsItem.id}
                      news={newsItem}
                      onClick={() => handleNewsClick(newsItem)}
                      featured={true}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Main News List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {Object.keys(filters).some(key => filters[key as keyof NewsFiltersType] && key !== 'limit' && key !== 'page' && key !== 'sort' && key !== 'order') 
                  ? "Resultados da Busca" 
                  : "Últimas Notícias"}
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
            {loading && news.length === 0 && (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex gap-4 p-4 border rounded-lg">
                    <Skeleton className="w-24 h-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
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
                  <p className="font-semibold">Erro ao carregar notícias</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button onClick={handleRefresh} variant="outline">
                  Tentar novamente
                </Button>
              </motion.div>
            )}

            {/* News List */}
            <AnimatePresence mode="wait">
              {news.length > 0 && (
                <motion.div
                  key="news-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {news.map((newsItem, index) => (
                    <NewsCard
                      key={newsItem.id}
                      news={newsItem}
                      onClick={() => handleNewsClick(newsItem)}
                      index={index}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!loading && news.length === 0 && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma notícia encontrada</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Tente ajustar os filtros ou buscar por outros termos
                </p>
                <Button onClick={handleFiltersReset} variant="outline">
                  Limpar filtros
                </Button>
              </motion.div>
            )}

            {/* Load More Indicator */}
            {loading && news.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-8"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Carregando mais notícias...</span>
                </div>
              </motion.div>
            )}

            {/* Intersection observer target */}
            <div ref={loadingRef} className="h-10" />

            {/* End of results indicator */}
            {!hasMore && news.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-muted-foreground text-sm">
                  📰 Todas as notícias foram carregadas
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
      
      {/* News Modal */}
      <NewsModal
        news={selectedNews}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        allNews={allNews}
        onNavigate={(newsId: string) => {
          const newsItem = allNews.find(n => n.id === newsId);
          if (newsItem) {
            setSelectedNews(newsItem);
          }
        }}
      />
    </div>
  );
};

export default Noticias;