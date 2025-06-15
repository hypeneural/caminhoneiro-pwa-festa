import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Bookmark, Clock, Eye, ChevronLeft, ChevronRight, Heart, MessageCircle, ExternalLink, ArrowUp } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES } from "@/constants";
import { useState, useEffect } from "react";

import { NewsItem } from "@/types/news";

interface NewsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  allNews: NewsItem[];
  onNavigate?: (newsId: string) => void;
}

export function NewsModal({ news, isOpen, onClose, allNews, onNavigate }: NewsModalProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { navigateTo } = useNavigation();

  if (!news) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.summary,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    
    setScrollProgress(progress);
    setShowScrollTop(scrollTop > 300);
  };

  const scrollToTop = () => {
    const modalContent = document.querySelector('[data-scroll-area]');
    modalContent?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentIndex = allNews.findIndex(n => n.id === news.id);
  const hasNext = currentIndex < allNews.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(allNews[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(allNews[currentIndex - 1].id);
    }
  };

  const contentParagraphs = news.content ? 
    news.content.split('\n\n') : 
    [
      "A Festa do Caminhoneiro 2025 promete ser a maior edição da história, com uma programação completa que vai emocionar todos os participantes. O evento, que acontece em Tijucas/SC, nos dias 25 e 26 de julho, já tem sua programação oficial divulgada.",
      "Entre as principais atrações confirmadas estão grandes nomes do sertanejo nacional, shows especiais e diversas atividades voltadas para toda a família caminhoneira. A organização investiu pesado para garantir a melhor experiência possível.",
      "O evento conta com estrutura completa, incluindo área de camping, praça de alimentação com pratos típicos da região, shows pirotécnicos e muito mais. A expectativa é receber mais de 30 mil pessoas durante os dois dias de festa.",
      "As vendas de ingressos já estão abertas e podem ser adquiridas através do site oficial ou nos pontos de venda autorizados. Valores promocionais estão disponíveis para compras antecipadas.",
      "Para mais informações sobre a programação completa, localização e outras novidades, continue acompanhando nossos canais oficiais."
    ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[95vh] p-0 overflow-hidden flex flex-col rounded-t-3xl border-t-2 border-border/20"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted z-50">
          <motion.div
            className="h-full bg-gradient-to-r from-trucker-blue to-trucker-green"
            style={{ width: `${scrollProgress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${scrollProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-1" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="h-full flex flex-col min-h-0"
        >
          {/* Header Image */}
          <div className="relative h-64 flex-shrink-0">
            <OptimizedImage
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Floating Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              {hasPrevious && (
                <TouchFeedback>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handlePrevious}
                    className="bg-black/30 hover:bg-black/50 border-0 backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </Button>
                </TouchFeedback>
              )}
              {hasNext && (
                <TouchFeedback>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleNext}
                    className="bg-black/30 hover:bg-black/50 border-0 backdrop-blur-sm"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </Button>
                </TouchFeedback>
              )}
            </div>

            {/* Category and Breaking Badge */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-trucker-red text-white font-semibold">
                {news.category}
              </Badge>
              {news.breaking && (
                <Badge className="bg-red-500 text-white font-bold animate-pulse">
                  🚨 BREAKING
                </Badge>
              )}
            </div>

            {/* Title and Meta */}
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-white font-bold text-xl mb-2 leading-tight line-clamp-3">
                {news.title}
              </h1>
              <div className="flex items-center justify-between text-white/80 text-sm">
                <span>{formatTimeAgo(news.publishedAt)}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {news.views.toLocaleString()}
                  </span>
                  {news.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {news.readTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div 
            className="flex-1 overflow-y-auto"
            onScroll={handleScroll}
            data-scroll-area
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="p-6 pb-32">
              {/* Engagement Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl mb-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-6">
                  <TouchFeedback>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsLiked(!isLiked)}
                      className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      {(news.likes || 0) + (isLiked ? 1 : 0)}
                    </Button>
                  </TouchFeedback>
                  
                  <TouchFeedback>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {news.comments || 0}
                    </Button>
                  </TouchFeedback>
                  
                  <TouchFeedback>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      {news.shares || 0}
                    </Button>
                  </TouchFeedback>
                </div>
                
                <TouchFeedback>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className="hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                  >
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>
                </TouchFeedback>
              </motion.div>

              {/* Author and Date */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 mb-6 p-4 bg-card rounded-2xl border border-border/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-trucker-blue to-trucker-green rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {news.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{news.author}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(news.publishedAt)}</p>
                </div>
              </motion.div>

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <p className="text-lg text-muted-foreground leading-relaxed font-medium bg-muted/30 p-4 rounded-2xl border-l-4 border-trucker-blue">
                  {news.summary}
                </p>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="prose prose-lg max-w-none"
              >
                {contentParagraphs.map((paragraph, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="mb-6 leading-relaxed text-foreground text-base"
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </motion.div>

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 p-4 bg-muted/30 rounded-2xl"
              >
                <h3 className="font-semibold mb-3 text-foreground">Tags Relacionadas</h3>
                <div className="flex flex-wrap gap-2">
                  {['festa2025', 'programacao', 'eventos', 'caminhoneiros'].map((tag) => (
                    <TouchFeedback key={tag}>
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-trucker-blue hover:text-white transition-colors px-3 py-1"
                      >
                        #{tag}
                      </Badge>
                    </TouchFeedback>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Fixed Bottom CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-lg border-t border-border/50">
            <TouchFeedback>
              <Button
                onClick={() => {
                  onClose();
                  navigateTo(ROUTES.NEWS);
                }}
                className="w-full bg-gradient-to-r from-trucker-blue to-trucker-green hover:from-trucker-blue/90 hover:to-trucker-green/90 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
              >
                <ExternalLink className="w-5 h-5" />
                Ver Todas as Notícias
              </Button>
            </TouchFeedback>
          </div>

          {/* Scroll to Top Button */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed bottom-24 right-6 z-50"
              >
                <TouchFeedback>
                  <Button
                    onClick={scrollToTop}
                    size="icon"
                    className="bg-trucker-blue hover:bg-trucker-blue/90 text-white rounded-full shadow-lg"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </Button>
                </TouchFeedback>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}