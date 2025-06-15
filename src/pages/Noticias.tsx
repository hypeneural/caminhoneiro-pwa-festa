import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Clock, Eye, Share2, Bookmark, TrendingUp, Filter, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsModal } from "@/components/mobile/NewsModal";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: string;
  publishedAt: string;
  author: string;
  featured?: boolean;
  views: string;
  readTime: string;
  trending?: boolean;
}

// Lazy Loading Image Component
const LazyImage = ({ src, alt, className, ...props }: { src: string; alt: string; className?: string; [key: string]: any }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <Skeleton className={`absolute inset-0 ${className}`} />
      )}
      {error && (
        <div className={`absolute inset-0 bg-muted flex items-center justify-center ${className}`}>
          <WifiOff className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <img
        ref={imgRef}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        {...props}
      />
    </div>
  );
};

// News Card Component for better performance
const NewsCard = ({ news, onClick, featured = false }: { news: NewsItem; onClick: () => void; featured?: boolean }) => {
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  if (featured) {
    return (
      <Card 
        className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <LazyImage
                src={news.imageUrl}
                alt={news.title}
                className="w-full h-48 object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="bg-trucker-red">
                Em Destaque
              </Badge>
              {news.trending && (
                <Badge variant="secondary" className="bg-white/90 text-trucker-red">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              )}
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <Badge variant="secondary" className="mb-2 bg-white/90">
                {news.category}
              </Badge>
              <h2 className="text-white text-lg font-bold mb-2 line-clamp-2 group-hover:text-trucker-yellow transition-colors">
                {news.title}
              </h2>
            </div>
          </div>
          <div className="p-4">
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {news.summary}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="font-medium">{news.author}</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {news.readTime}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {news.views}
                </div>
                <span>{formatDate(news.publishedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer group hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <LazyImage
                src={news.imageUrl}
                alt={news.title}
                className="w-24 h-20 object-cover rounded-lg"
              />
            </motion.div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {news.category}
              </Badge>
              {news.trending && (
                <Badge variant="outline" className="text-xs text-trucker-red border-trucker-red">
                  <TrendingUp className="w-2 h-2 mr-1" />
                  Trending
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-trucker-blue transition-colors">
              {news.title}
            </h3>
            <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
              {news.summary}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="font-medium">{news.author}</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {news.readTime}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {news.views}
                </div>
                <span>{formatDate(news.publishedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Noticias = () => {
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedNews, setDisplayedNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loadingRef = useRef<HTMLDivElement>(null);
  const isOnline = useNetworkStatus();

  const ITEMS_PER_PAGE = 6;

  const categories = [
    { id: "todas", name: "Todas", count: 24, color: "bg-trucker-blue" },
    { id: "evento", name: "Evento", count: 12, color: "bg-trucker-green" },
    { id: "shows", name: "Shows", count: 8, color: "bg-trucker-red" },
    { id: "caminhoneiros", name: "Caminhoneiros", count: 6, color: "bg-trucker-yellow" },
    { id: "bastidores", name: "Bastidores", count: 4, color: "bg-trucker-orange" }
  ];

  // Simulated larger dataset for infinity scroll
  const generateAllNews = useCallback((): NewsItem[] => {
    const baseNews = [
      {
        id: 1,
        title: "Festa do Caminhoneiro 2025: Programação Completa Divulgada",
        summary: "Confira todos os shows e atrações que vão agitar os dois dias de festa em Tijucas/SC com grandes nomes do sertanejo nacional",
        content: "",
        imageUrl: "/placeholder.svg",
        category: "evento",
        publishedAt: "2024-12-15T10:00:00Z",
        author: "Redação FC",
        featured: true,
        views: "2.1K",
        readTime: "3 min",
        trending: true
      },
      {
        id: 2,
        title: "Gusttavo Lima Confirma Presença na Festa 2025",
        summary: "Embaixador estrela mais uma edição do maior evento caminhoneiro do Sul brasileiro",
        content: "",
        imageUrl: "/placeholder.svg",
        category: "shows",
        publishedAt: "2024-12-14T15:30:00Z",
        author: "Maria Silva",
        views: "1.8K",
        readTime: "2 min",
        trending: true
      },
      {
        id: 3,
        title: "Inscrições Abertas para Concurso de Decoração",
        summary: "Caminhoneiros podem participar da disputa pela melhor decoração de caminhão",
        content: "",
        imageUrl: "/placeholder.svg",
        category: "evento",
        publishedAt: "2024-12-13T09:15:00Z",
        author: "João Santos",
        views: "950",
        readTime: "4 min"
      },
      {
        id: 4,
        title: "Movimento Caminhoneiro Ganha Força Nacional",
        summary: "Categoria se mobiliza por melhores condições de trabalho e reconhecimento",
        content: "",
        imageUrl: "/placeholder.svg",
        category: "caminhoneiros",
        publishedAt: "2024-12-12T14:20:00Z",
        author: "Ana Costa",
        views: "1.2K",
        readTime: "5 min"
      },
      {
        id: 5,
        title: "Estrutura da Festa: Investimento Recorde",
        summary: "Organização investe R$ 2 milhões em infraestrutura para receber 30 mil pessoas",
        content: "",
        imageUrl: "/placeholder.svg",
        category: "bastidores",
        publishedAt: "2024-12-11T11:45:00Z",
        author: "Carlos Mendes",
        views: "1.5K",
        readTime: "6 min"
      },
      {
        id: 6,
        title: "Zé Neto & Cristiano: 'Honra Estar na Festa'",
        summary: "Dupla sertaneja fala sobre a importância do evento para a categoria",
        content: "",
        imageUrl: "/placeholder.svg",
        category: "shows",
        publishedAt: "2024-12-10T16:00:00Z",
        author: "Redação FC",
        views: "2.3K",
        readTime: "4 min"
      }
    ];

    // Generate more news for infinity scroll demonstration
    const additionalNews = [];
    for (let i = 7; i <= 50; i++) {
      const categories = ["evento", "shows", "caminhoneiros", "bastidores"];
      const authors = ["Redação FC", "Maria Silva", "João Santos", "Ana Costa", "Carlos Mendes"];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      
      additionalNews.push({
        id: i,
        title: `Notícia ${i}: ${randomCategory === 'evento' ? 'Evento Especial' : randomCategory === 'shows' ? 'Show Confirmado' : randomCategory === 'caminhoneiros' ? 'Categoria em Foco' : 'Bastidores'}`,
        summary: `Esta é uma notícia de demonstração sobre ${randomCategory} para mostrar o infinity scroll funcionando perfeitamente no app.`,
        content: "",
        imageUrl: "/placeholder.svg",
        category: randomCategory,
        publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        author: randomAuthor,
        views: `${Math.floor(Math.random() * 5000)}`,
        readTime: `${Math.floor(Math.random() * 8) + 2} min`,
        trending: Math.random() > 0.8
      });
    }

    return [...baseNews, ...additionalNews];
  }, []);

  const allNews = useMemo(() => generateAllNews(), [generateAllNews]);

  const filteredNews = useMemo(() => {
    let filtered = allNews;
    
    // Filter by category
    if (selectedCategory !== "todas") {
      filtered = filtered.filter(news => news.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(news => 
        news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        news.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        news.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [allNews, selectedCategory, searchQuery]);

  const featuredNews = allNews.find(news => news.featured);
  const trendingNews = allNews.filter(news => news.trending && !news.featured);

  // Load more news function
  const loadMoreNews = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newNews = filteredNews.slice(startIndex, endIndex);
    
    if (newNews.length > 0) {
      setDisplayedNews(prev => [...prev, ...newNews]);
      setPage(prev => prev + 1);
    }
    
    if (endIndex >= filteredNews.length) {
      setHasMore(false);
    }
    
    setIsLoading(false);
  }, [filteredNews, page, isLoading, hasMore]);

  // Reset pagination when filters change
  useEffect(() => {
    const firstBatch = filteredNews.slice(0, ITEMS_PER_PAGE);
    setDisplayedNews(firstBatch);
    setPage(2);
    setHasMore(filteredNews.length > ITEMS_PER_PAGE);
  }, [filteredNews]);

  // Intersection Observer for infinity scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMoreNews();
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
  }, [loadMoreNews, hasMore, isLoading]);

  const handleNewsClick = useCallback((news: NewsItem) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedNews(null);
  }, []);

  const handleNavigateNews = useCallback((newsId: number) => {
    const news = allNews.find(n => n.id === newsId);
    if (news) {
      setSelectedNews(news);
    }
  }, [allNews]);

  // PWA: Service Worker registration and updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

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
              className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg p-3 flex items-center gap-2"
            >
              <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Você está offline. Mostrando conteúdo em cache.
              </span>
            </motion.div>
          )}

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Newspaper className="w-8 h-8 text-trucker-green" />
              <h1 className="text-2xl font-bold text-foreground">Notícias</h1>
            </div>
            <p className="text-muted-foreground">
              Fique por dentro de tudo sobre a festa
            </p>
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <Input
                placeholder="Buscar notícias, autores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className={`whitespace-nowrap cursor-pointer transition-all duration-200 flex items-center gap-2 ${
                      selectedCategory === category.id 
                        ? `${category.color} text-white hover:opacity-90` 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedCategory === category.id 
                        ? "bg-white/20 text-white" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {category.count}
                    </span>
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Featured News */}
          {featuredNews && selectedCategory === "todas" && !searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <NewsCard
                news={featuredNews}
                onClick={() => handleNewsClick(featuredNews)}
                featured={true}
              />
            </motion.div>
          )}

          {/* Trending Section */}
          {trendingNews.length > 0 && selectedCategory === "todas" && !searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-trucker-red" />
                <h2 className="text-lg font-semibold">Em Alta</h2>
              </div>
              <div className="grid gap-3">
                {trendingNews.slice(0, 2).map((news, index) => (
                  <motion.div
                    key={news.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <NewsCard
                      news={news}
                      onClick={() => handleNewsClick(news)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* News List with Infinity Scroll */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedCategory === "todas" ? "Todas as Notícias" : 
                 categories.find(c => c.id === selectedCategory)?.name || "Notícias"}
                {searchQuery && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredNews.length} resultados para "{searchQuery}")
                  </span>
                )}
              </h2>
              {filteredNews.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {displayedNews.length} de {filteredNews.length} notícias
                </span>
              )}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedCategory}-${searchQuery}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {displayedNews.map((news, index) => (
                  <motion.div
                    key={news.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ y: -2 }}
                  >
                    <NewsCard
                      news={news}
                      onClick={() => handleNewsClick(news)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Loading indicator for infinity scroll */}
            {isLoading && (
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
            {!hasMore && displayedNews.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-muted-foreground text-sm">
                  📰 Você viu todas as notícias disponíveis
                </div>
              </motion.div>
            )}

            {filteredNews.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma notícia encontrada</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery 
                    ? "Tente buscar por outros termos ou ajustar os filtros"
                    : "Não há notícias nesta categoria no momento"
                  }
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
      
      <NewsModal
        news={selectedNews}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        allNews={allNews}
        onNavigate={handleNavigateNews}
      />
    </div>
  );
};

export default Noticias;