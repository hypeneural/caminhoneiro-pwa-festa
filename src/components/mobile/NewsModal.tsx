import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Bookmark, Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: string;
  publishedAt: string;
  author: string;
  views: string;
  readTime: string;
  featured?: boolean;
}

interface NewsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  allNews: NewsItem[];
  onNavigate?: (newsId: number) => void;
}

export function NewsModal({ news, isOpen, onClose, allNews, onNavigate }: NewsModalProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!news) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Simulated content paragraphs for demo
  const contentParagraphs = [
    "A Festa do Caminhoneiro 2025 promete ser a maior edição da história, com uma programação completa que vai emocionar todos os participantes. O evento, que acontece em Tijucas/SC, nos dias 19 e 20 de julho, já tem sua programação oficial divulgada.",
    "Entre as principais atrações confirmadas estão grandes nomes do sertanejo nacional, shows especiais e diversas atividades voltadas para toda a família caminhoneira. A organização investiu pesado para garantir a melhor experiência possível.",
    "O evento conta com estrutura completa, incluindo área de camping, praça de alimentação com pratos típicos da região, shows pirotécnicos e muito mais. A expectativa é receber mais de 30 mil pessoas durante os dois dias de festa.",
    "As vendas de ingressos já estão abertas e podem ser adquiridas através do site oficial ou nos pontos de venda autorizados. Valores promocionais estão disponíveis para compras antecipadas."
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <div className="relative">
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            
            {/* Navigation and Actions */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <div className="flex gap-2">
                {hasPrevious && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handlePrevious}
                    className="bg-black/50 hover:bg-black/70 border-0"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {hasNext && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleNext}
                    className="bg-black/50 hover:bg-black/70 border-0"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleShare}
                  className="bg-black/50 hover:bg-black/70 border-0"
                >
                  <Share2 className="w-5 h-5 text-white" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="bg-black/50 hover:bg-black/70 border-0"
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-white' : ''} text-white`} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={onClose}
                  className="bg-black/50 hover:bg-black/70 border-0"
                >
                  <X className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>

            {/* Category Badge */}
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-trucker-red text-white">
                {news.category}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold mb-4 leading-tight"
              >
                {news.title}
              </motion.h1>

              {/* Meta Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-4 border-b"
              >
                <span className="font-medium">{news.author}</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(news.publishedAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {news.views} visualizações
                </div>
                <span>{news.readTime} de leitura</span>
              </motion.div>

              {/* Summary */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-muted-foreground mb-6 leading-relaxed"
              >
                {news.summary}
              </motion.p>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="prose prose-lg max-w-none"
              >
                {contentParagraphs.map((paragraph, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="mb-4 leading-relaxed text-foreground"
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </motion.div>

              {/* Related Topics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 pt-6 border-t"
              >
                <h3 className="font-semibold mb-3">Tópicos Relacionados</h3>
                <div className="flex flex-wrap gap-2">
                  {['Festa 2025', 'Programação', 'Ingressos', 'Sertanejo', 'Tijucas'].map((topic) => (
                    <Badge key={topic} variant="secondary" className="cursor-pointer hover:bg-trucker-blue hover:text-white transition-colors">
                      #{topic}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}