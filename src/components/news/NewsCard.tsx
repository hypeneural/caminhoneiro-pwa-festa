import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Eye, WifiOff, TrendingUp } from "lucide-react";
import { NewsItem } from "@/types/news";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewsCardProps {
  news: NewsItem;
  onClick: () => void;
  featured?: boolean;
  index?: number;
}

// Lazy Loading Image Component
const LazyImage = ({ src, alt, className, ...props }: { 
  src: string; 
  alt: string; 
  className?: string; 
  [key: string]: any 
}) => {
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

export const NewsCard = ({ news, onClick, featured = false, index = 0 }: NewsCardProps) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  // Featured news card - larger, more prominent
  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card 
          className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
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
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                <Badge 
                  className="bg-primary text-primary-foreground font-semibold"
                >
                  Em Destaque
                </Badge>
                {news.trending && (
                  <Badge variant="secondary" className="bg-background/90 text-foreground">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
              
              {/* Content overlay */}
              <div className="absolute bottom-3 left-3 right-3">
                <Badge 
                  variant="secondary" 
                  className="mb-2 bg-background/90 text-foreground"
                  style={{ 
                    backgroundColor: news.categoryColor + '20',
                    color: news.categoryColor,
                    borderColor: news.categoryColor
                  }}
                >
                  {news.category}
                </Badge>
                <h2 className="text-background text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {news.title}
                </h2>
              </div>
            </div>
            
            {/* Card content */}
            <div className="p-4">
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {news.summary}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{news.author}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(news.publishedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {news.views.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Regular news card - compact horizontal layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="cursor-pointer group hover:shadow-md transition-all duration-300"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image */}
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
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: news.categoryColor + '20',
                    color: news.categoryColor,
                    borderColor: news.categoryColor
                  }}
                >
                  {news.category}
                </Badge>
                {news.trending && (
                  <Badge variant="outline" className="text-xs text-primary border-primary">
                    <TrendingUp className="w-2 h-2 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {news.title}
              </h3>
              
              <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
                {news.summary}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="font-medium truncate">{news.author}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(news.publishedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {news.views > 999 ? `${Math.floor(news.views/1000)}k` : news.views}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};