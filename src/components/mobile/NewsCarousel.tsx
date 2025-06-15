import React from "react";
import { Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBoundary, CarouselErrorFallback } from "@/components/ui/error-boundary";
import { CarouselSkeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { VirtualCarousel } from "@/components/ui/virtual-carousel";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useNews } from "@/hooks/useNews";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES, THEME_COLORS, APP_TEXTS } from "@/constants";

const NewsCard = React.memo(({ news, index }: { news: any; index: number }) => {
  const { navigateTo } = useNavigation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] // Optimized easing for mobile
      }}
      className="flex-shrink-0 w-80"
    >
      <TouchFeedback>
        <Card 
          className="overflow-hidden bg-card shadow-md border-border/50 cursor-pointer hover:shadow-lg transition-shadow"
          role="article"
          aria-label={`Notícia: ${news.title}`}
        >
          <div className="relative">
            <OptimizedImage
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-32 object-cover"
              priority={index === 0}
            />
            <Badge 
              className={`absolute top-2 left-2 ${news.categoryColor} text-white text-xs`}
              aria-label={`Categoria: ${news.category}`}
            >
              {news.category}
            </Badge>
          </div>
        
        <div className="p-3">
          <h3 className="text-sm font-bold text-foreground mb-2 line-clamp-2 leading-tight">
            {news.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
            {news.summary}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {news.publishedAt.toLocaleDateString('pt-BR')}
            </span>
            <AccessibleButton
              variant="ghost"
              size="sm"
              className="text-xs text-trucker-blue font-medium hover:text-trucker-blue/80 h-auto p-0"
              onClick={() => navigateTo(ROUTES.NEWS)}
              aria-label={`Ler mais sobre: ${news.title}`}
            >
              {APP_TEXTS.ACTION_READ_MORE}
            </AccessibleButton>
          </div>
        </div>
      </Card>
      </TouchFeedback>
    </motion.div>
  );
});

export const NewsCarousel = React.memo(() => {
  const { latestNews, loading } = useNews();
  const { navigateTo } = useNavigation();
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });
  

  if (loading) {
    return (
      <div className="mb-6" aria-label="Carregando notícias">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-muted rounded-lg animate-pulse" />
            <div className="w-32 h-4 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-16 h-6 bg-muted rounded animate-pulse" />
        </div>
        <CarouselSkeleton itemCount={3} itemWidth="w-80" />
      </div>
    );
  }

  const renderNewsItem = React.useCallback((news: any, index: number, isVisible: boolean) => {
    return <NewsCard key={news.id} news={news} index={index} />;
  }, []);

  return (
    <ErrorBoundary fallback={CarouselErrorFallback}>
      <section ref={intersectionRef} className="mb-6" aria-labelledby="news-section">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 bg-${THEME_COLORS.TRUCKER_GREEN} rounded-lg flex items-center justify-center`}>
              <Newspaper className={`w-4 h-4 text-${THEME_COLORS.TRUCKER_GREEN_FOREGROUND}`} aria-hidden="true" />
            </div>
            <h2 id="news-section" className="text-lg font-bold text-foreground">
              {APP_TEXTS.SECTION_NEWS}
            </h2>
          </div>
          <AccessibleButton 
            variant="ghost" 
            size="sm" 
            className={`text-${THEME_COLORS.TRUCKER_BLUE} hover:text-${THEME_COLORS.TRUCKER_BLUE}/80`}
            onClick={() => navigateTo(ROUTES.NEWS)}
            aria-label="Ver todas as notícias"
          >
            {APP_TEXTS.ACTION_SEE_ALL}
          </AccessibleButton>
        </div>

        {isIntersecting && (
          <VirtualCarousel
            items={latestNews}
            renderItem={renderNewsItem}
            itemWidth={320}
            gap={16}
            className="px-4"
            overscan={2}
            autoPlay={false}
            showIndicators={true}
          />
        )}
      </section>
    </ErrorBoundary>
  );
});