import React, { useState, useEffect } from "react";
import { Newspaper, TrendingUp, Flame, Zap, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { CarouselSkeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { SimpleCarousel } from "@/components/ui/simple-carousel";
import { useNews } from "@/hooks/useNews";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES, THEME_COLORS, APP_TEXTS } from "@/constants";
import { NewsModal } from "./NewsModal";
import { NewsItem } from "@/types/news";

const FeaturedNewsCard = React.memo(({ news, onClick }: { news: NewsItem; onClick: () => void }) => {
  const getBadgeIcon = () => {
    if (news.breaking) return <Zap className="w-3 h-3" />;
    if (news.trending) return <TrendingUp className="w-3 h-3" />;
    if (news.hot) return <Flame className="w-3 h-3" />;
    return null;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleClick = () => {
    console.log('📰 FeaturedNewsCard: Click event triggered');
    onClick();
  };

  return (
    <TouchFeedback onClick={handleClick}>
      <Card 
        className="relative overflow-hidden aspect-[16/9] bg-card cursor-pointer hover:shadow-lg transition-all duration-200"
        role="article"
        aria-label={`Notícia em destaque: ${news.title}`}
      >
        <div className="relative w-full h-full">
          <OptimizedImage
            src={news.imageUrl}
            alt={news.title}
            className="w-full h-full object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge 
              className={`${news.categoryColor} text-white text-xs`}
            >
              {news.category}
            </Badge>
            {news.breaking && (
              <Badge className="bg-red-500 text-white text-xs font-bold animate-pulse">
                BREAKING
              </Badge>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-bold text-lg mb-2 leading-tight line-clamp-2">
              {news.title}
            </h3>
            <div className="flex items-center justify-between text-white/80 text-sm">
              <span>{formatTimeAgo(news.publishedAt)}</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  👁️ {news.views.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </TouchFeedback>
  );
});

const SecondaryNewsCard = React.memo(({ news, onClick }: { news: NewsItem; onClick: () => void }) => {
  const getBadgeIcon = () => {
    if (news.trending) return <TrendingUp className="w-3 h-3" />;
    if (news.hot) return <Flame className="w-3 h-3" />;
    return null;
  };

  const handleClick = () => {
    console.log('📰 SecondaryNewsCard: Click event triggered');
    onClick();
  };

  return (
    <TouchFeedback onClick={handleClick}>
      <Card 
        className="overflow-hidden bg-card shadow-md border-border/50 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
        role="article"
        aria-label={`Notícia: ${news.title}`}
      >
        <div className="flex gap-3 p-3">
          <div className="relative w-20 h-20 flex-shrink-0">
            <OptimizedImage
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-full object-cover rounded-lg"
            />
            {(news.trending || news.hot) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                {getBadgeIcon()}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <Badge 
              className={`${news.categoryColor} text-white text-xs mb-2`}
            >
              {news.category}
            </Badge>
            <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 leading-tight">
              {news.title}
            </h4>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{news.publishedAt.toLocaleDateString('pt-BR')}</span>
              <div className="flex items-center gap-2">
                <span>👁️ {news.views}</span>
                <span>❤️ {news.likes}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </TouchFeedback>
  );
});

const NewsErrorFallback = ({ error, resetError }: { error?: Error; resetError?: () => void }) => (
  <div className="p-4 text-center space-y-3">
    <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground" />
    <div>
      <p className="text-sm font-medium text-foreground">
        Erro ao carregar notícias
      </p>
      <p className="text-xs text-muted-foreground">
        {error?.message || 'Tente novamente mais tarde'}
      </p>
    </div>
    {resetError && (
      <Button size="sm" variant="outline" onClick={resetError}>
        Tentar Novamente
      </Button>
    )}
  </div>
);

export const NewsCarousel = React.memo(() => {
  const { latestNews, featuredNews, loading, error, refresh } = useNews();
  const { navigateTo } = useNavigation();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const mainNews = featuredNews[0] || latestNews[0];
  const secondaryNews = latestNews.slice(1, 4);

  const handleNewsClick = (news: NewsItem) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
  };

  const handleNavigateNews = (newsId: string) => {
    const news = latestNews.find(n => n.id === newsId);
    if (news) {
      setSelectedNews(news);
    }
  };

  if (error) {
    return <NewsErrorFallback error={new Error(error)} />;
  }

  return (
    <ErrorBoundary fallback={NewsErrorFallback}>
      <section className="mb-6" aria-labelledby="news-section">
        {loading && latestNews.length === 0 ? (
          <div aria-label="Carregando notícias">
            <div className="flex items-center justify-between px-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-muted rounded-lg animate-pulse" />
                <div className="w-32 h-4 bg-muted rounded animate-pulse" />
              </div>
              <div className="w-16 h-6 bg-muted rounded animate-pulse" />
            </div>
            <div className="px-4 space-y-4">
              <div className="w-full h-48 bg-muted rounded-xl animate-pulse" />
              <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 p-3 bg-muted rounded-lg animate-pulse">
                    <div className="w-20 h-20 bg-muted-foreground/20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="w-16 h-4 bg-muted-foreground/20 rounded" />
                      <div className="w-full h-4 bg-muted-foreground/20 rounded" />
                      <div className="w-3/4 h-3 bg-muted-foreground/20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-trucker-red to-trucker-orange rounded-xl flex items-center justify-center shadow-lg">
                  <Newspaper className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold" id="news-section">
                  Últimas Notícias
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateTo(ROUTES.NEWS)}
                className="text-muted-foreground hover:text-foreground"
              >
                Ver mais
              </Button>
            </div>

            {/* Main News */}
            {mainNews && (
              <div className="px-4 mb-4">
                <FeaturedNewsCard news={mainNews} onClick={() => handleNewsClick(mainNews)} />
              </div>
            )}

            {/* Secondary News */}
            {secondaryNews.length > 0 && (
              <div className="px-4 space-y-3">
                {secondaryNews.map((news) => (
                  <SecondaryNewsCard
                    key={news.id}
                    news={news}
                    onClick={() => handleNewsClick(news)}
                  />
                ))}
              </div>
            )}

            {/* News Modal */}
            <NewsModal
              news={selectedNews}
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              allNews={latestNews}
              onNavigate={handleNavigateNews}
            />
          </>
        )}
      </section>
    </ErrorBoundary>
  );
});