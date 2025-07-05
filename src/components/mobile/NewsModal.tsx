import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight, Share2, Clock, Eye, Heart, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { BannerCarousel } from '@/components/sponsors/BannerCarousel';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { NewsItem } from '@/types/news';

interface NewsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  allNews?: NewsItem[];
  onNavigate?: (newsId: string) => void;
}

export const NewsModal: React.FC<NewsModalProps> = ({
  news,
  isOpen,
  onClose,
  allNews = [],
  onNavigate
}) => {
  const { activeBanners } = useAdvertisements();
  const currentIndex = news && allNews.length > 0 ? allNews.findIndex(n => n.id === news.id) : -1;
  const showNavigation = allNews.length > 0 && onNavigate;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handlePrevious = () => {
    if (showNavigation && currentIndex > 0) {
      const prevNews = allNews[currentIndex - 1];
      onNavigate(prevNews.id);
    }
  };

  const handleNext = () => {
    if (showNavigation && currentIndex < allNews.length - 1) {
      const nextNews = allNews[currentIndex + 1];
      onNavigate(nextNews.id);
    }
  };

  const handleShare = async () => {
    if (!news) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.summary,
          url: window.location.origin + '/noticias/' + news.slug
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!news) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[95vh] flex-col rounded-t-3xl bg-background p-0 shadow-lg animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full">
          {/* Drag Handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/20 rounded-full" />

          {/* Fixed Header with Banner */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm transition-all duration-200">
            {/* Banner Carousel */}
            {activeBanners.length > 0 && (
              <div className="h-16 px-4 pt-2">
                <BannerCarousel
                  banners={activeBanners}
                  autoplayDelay={6000}
                  showControls={false}
                  showDots={true}
                  compact={true}
                  className="rounded-lg overflow-hidden h-14"
                />
              </div>
            )}

            {/* Navigation Header */}
            <div className="flex items-center justify-between p-4">
              <TouchFeedback
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-foreground" />
              </TouchFeedback>

              {showNavigation && (
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
              )}

              <TouchFeedback
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center"
              >
                <Share2 className="w-5 h-5 text-foreground" />
              </TouchFeedback>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
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
                <Dialog.Title className="text-2xl font-bold text-foreground leading-tight">
                  {news.title}
                </Dialog.Title>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTimeAgo(news.publishedAt)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {news.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {news.likes.toLocaleString()}
                    </span>
                    {news.comments !== undefined && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {news.comments.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <Dialog.Description className="text-muted-foreground text-sm leading-relaxed">
                {news.summary}
              </Dialog.Description>

              {/* Content */}
              {news.content && (
                <div 
                  className="prose prose-sm prose-trucker max-w-none"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
