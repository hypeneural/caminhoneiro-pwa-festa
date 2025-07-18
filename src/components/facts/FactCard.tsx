import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, ChevronUp, Lightbulb, Share2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { Fact } from '@/types/facts';
import { cn } from '@/lib/utils';
import { useNativeShare } from '@/hooks/useNativeShare';

interface FactCardProps {
  fact: Fact;
  index: number;
}

export const FactCard = ({ fact, index }: FactCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { shareApp } = useNativeShare();

  const handleShare = async () => {
    try {
      await shareApp({
        title: `💡 Você Sabia? - ${fact.category_name}`,
        text: `${fact.summary}\n\n${fact.body}`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing fact:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (iconClass: string) => {
    // Convert FontAwesome class to emoji/icon mapping
    const iconMap: { [key: string]: string } = {
      'fa-solid fa-landmark': '🏛️',
      'fa-solid fa-circle-info': '💡',
      'fa-solid fa-truck': '🚛',
      'fa-solid fa-church': '⛪',
      'fa-solid fa-star': '⭐',
      'fa-solid fa-heart': '❤️',
      'fa-solid fa-calendar': '📅',
      'fa-solid fa-map': '🗺️'
    };
    return iconMap[iconClass] || '💡';
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className="w-full"
    >
      <TouchFeedback>
        <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            {/* Header com categoria - design mais moderno */}
            <div className="bg-gradient-to-br from-trucker-blue via-trucker-blue to-blue-600 p-5 text-white relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl">{getCategoryIcon(fact.category_icon)}</span>
                  </div>
                  <div className="flex-1">
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white border-white/30 text-xs font-medium mb-2 backdrop-blur-sm"
                    >
                      {fact.category_name}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs opacity-90">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(fact.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <TouchFeedback>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-white hover:bg-white/20 p-3 rounded-xl backdrop-blur-sm"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TouchFeedback>
              </div>
            </div>

            {/* Conteúdo principal - layout melhorado */}
            <div className="p-5 space-y-4">
              {/* Resumo com destaque visual */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <h3 className="font-semibold text-foreground leading-relaxed text-base">
                    {fact.summary}
                  </h3>
                </div>
              </div>

              {/* Conteúdo expandido */}
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {fact.body}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão expandir/colapsar - design nativo */}
              <div className="flex justify-center pt-2">
                <TouchFeedback>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleExpanded}
                    className={cn(
                      "gap-2 transition-all duration-300 rounded-full px-6 py-2 font-medium",
                      "border-2 hover:scale-105 active:scale-95",
                      isExpanded 
                        ? "bg-trucker-blue text-white border-trucker-blue shadow-lg shadow-trucker-blue/25" 
                        : "bg-white text-trucker-blue border-trucker-blue/30 hover:bg-trucker-blue/5"
                    )}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Ver Menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Ler Mais
                      </>
                    )}
                  </Button>
                </TouchFeedback>
              </div>
            </div>
          </CardContent>
        </Card>
      </TouchFeedback>
    </motion.div>
  );
}; 