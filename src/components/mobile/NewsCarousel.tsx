import React from "react";
import { Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNews } from "@/hooks/useNews";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES, THEME_COLORS, APP_TEXTS } from "@/constants";

const NewsCard = React.memo(({ news, index }: { news: any; index: number }) => {
  const { navigateTo } = useNavigation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="flex-shrink-0 w-80"
    >
      <Card className="overflow-hidden bg-card shadow-md border-border/50 cursor-pointer hover:shadow-lg transition-shadow">
        <div className="relative">
          <img 
            src={news.imageUrl}
            alt={news.title}
            className="w-full h-32 object-cover"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "low"}
            width={320}
            height={128}
          />
          <Badge className={`absolute top-2 left-2 ${news.categoryColor} text-white text-xs`}>
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs text-trucker-blue font-medium hover:text-trucker-blue/80"
              onClick={() => navigateTo(ROUTES.NEWS)}
            >
              {APP_TEXTS.ACTION_READ_MORE}
            </motion.button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

export const NewsCarousel = React.memo(() => {
  const { latestNews, loading } = useNews();
  const { navigateTo } = useNavigation();

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-muted rounded-lg animate-pulse" />
            <div className="w-32 h-4 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-16 h-6 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-80">
              <div className="bg-muted rounded-lg h-48 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 bg-${THEME_COLORS.TRUCKER_GREEN} rounded-lg flex items-center justify-center`}>
            <Newspaper className={`w-4 h-4 text-${THEME_COLORS.TRUCKER_GREEN_FOREGROUND}`} />
          </div>
          <h2 className="text-lg font-bold text-foreground">{APP_TEXTS.SECTION_NEWS}</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-${THEME_COLORS.TRUCKER_BLUE} hover:text-${THEME_COLORS.TRUCKER_BLUE}/80`}
          onClick={() => navigateTo(ROUTES.NEWS)}
        >
          {APP_TEXTS.ACTION_SEE_ALL}
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4">
        {latestNews.map((news, index) => (
          <NewsCard key={news.id} news={news} index={index} />
        ))}
      </div>

      {/* Scroll indicator dots */}
      <div className="flex justify-center gap-2 mt-4">
        {latestNews.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === 0 ? `bg-${THEME_COLORS.TRUCKER_BLUE}` : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
});