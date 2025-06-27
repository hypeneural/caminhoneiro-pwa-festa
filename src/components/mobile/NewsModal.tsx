
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Share2, 
  Heart, 
  MessageCircle, 
  Eye, 
  Clock, 
  ExternalLink,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import { NewsItem } from '@/types/news';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { BannerCarousel } from '@/components/sponsors/BannerCarousel';
import { useSponsors } from '@/hooks/useSponsors';
import { cn } from '@/lib/utils';

interface NewsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  allNews: NewsItem[];
  onNavigate: (newsId: string) => void;
}

export const NewsModal: React.FC<NewsModalProps> = ({
  news,
  isOpen,
  onClose,
  allNews,
  onNavigate
}) => {
  const { shuffledBanners } = useSponsors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter active banners for news modal
  const activeBanners = shuffledBanners?.filter(banner => banner.isActive).slice(0, 4) || [];

  useEffect(() => {
    if (news && allNews.length > 0) {
      const index = allNews.findIndex(item => item.id === news.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [news, allNews]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setIsScrolled(scrollRef.current.scrollTop > 20);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (!isOpen || !news) return null;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevNews = allNews[currentIndex - 1];
      onNavigate(prevNews.id.toString());
    }
  };

  const handleNext = () => {
    if (currentIndex < allNews.length - 1) {
      const nextNews = allNews[currentIndex + 1];
      onNavigate(nextNews.id.toString());
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 bg-background rounded-t-3xl max-h-[95vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Banner */}
          <div className={cn(
            "sticky top-0 z-10 bg-background/95 backdrop-blur-sm transition-all duration-200",
            isScrolled ? "shadow-md border-b border-border/50" : ""
          )}>
            {/* Banner Carousel */}
            {activeBanners.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="px-4 pt-4"
              >
                <BannerCarousel
                  banners={activeBanners}
                  autoplayDelay={6000}
                  showControls={false}
                  showDots={true}
                  className="rounded-lg overflow-hidden h-16"
                />
              </motion.div>
            )}

            {/* Navigation Header */}
            <div className="flex items-center justify-between p-4">
              <TouchFeedback
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-foreground" />
              </TouchFeedback>

              <div className="flex items-center gap-2">
                {currentIndex > 0 && (
                  <TouchFeedback
                    onClick={handlePrevious}
                    className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </TouchFeedback>
                )}
                
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} de {allNews.length}
                </span>
                
                {currentIndex < allNews.length - 1 && (
                  <TouchFeedback
                    onClick={handleNext}
                    className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </TouchFeedback>
                )}
              </div>

              <TouchFeedback
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center"
              >
                <Share2 className="w-5 h-5 text-foreground" />
              </TouchFeedback>
            </div>
          </div>

          {/* Scrollable Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {/* Hero Image */}
            <div className="relative aspect-video">
              <OptimizedImage
                src={news.imageUrl}
                alt={news.title}
                className="w-full h-full object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <Badge className={`${news.categoryColor} text-white`}>
                  {news.category}
                </Badge>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-6 space-y-6">
              {/* Title and Meta */}
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-foreground leading-tight">
                  {news.title}
                </h1>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTimeAgo(news.publishedAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {news.views.toLocaleString()}
                  </div>
                  {news.readTime && (
                    <span>{news.readTime}</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {news.summary}
                </p>
                
                {news.content && (
                  <div className="mt-6 space-y-4">
                    {news.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <div className="flex items-center gap-4">
                  <TouchFeedback className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">{news.likes}</span>
                  </TouchFeedback>
                  
                  <TouchFeedback className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{news.comments || 0}</span>
                  </TouchFeedback>
                </div>

                <div className="text-xs text-muted-foreground">
                  {news.publishedAt.toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
