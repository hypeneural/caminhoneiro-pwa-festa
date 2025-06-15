import { Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  publishedAt: Date;
  category: string;
  categoryColor: string;
}

const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "Inscrições abertas para a bênção dos caminhões",
    summary: "Caminhoneiros podem se inscrever gratuitamente para participar da tradicional bênção que acontecerá no primeiro dia do evento.",
    imageUrl: "https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?w=400",
    publishedAt: new Date('2025-06-10'),
    category: "Inscrições",
    categoryColor: "bg-trucker-green"
  },
  {
    id: "2",
    title: "Shows confirmados para os dois dias de festa",
    summary: "Lineup completo foi divulgado com artistas sertanejos e bandas locais que vão animar a festa dos caminhoneiros.",
    imageUrl: "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?w=400",
    publishedAt: new Date('2025-06-08'),
    category: "Programação",
    categoryColor: "bg-trucker-orange"
  },
  {
    id: "3",
    title: "Rota da procissão de São Cristóvão definida",
    summary: "O percurso tradicional será mantido, passando pelos principais pontos da cidade com paradas estratégicas para bênçãos.",
    imageUrl: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=400",
    publishedAt: new Date('2025-06-05'),
    category: "Religioso",
    categoryColor: "bg-trucker-blue"
  },
  {
    id: "4",
    title: "Expectativa de público recorde em 2025",
    summary: "Organização espera receber mais de 10 mil visitantes nos dois dias de festa, superando números dos anos anteriores.",
    imageUrl: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?w=400",
    publishedAt: new Date('2025-06-03'),
    category: "Evento",
    categoryColor: "bg-trucker-red"
  }
];

export function NewsCarousel() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-trucker-green rounded-lg flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-trucker-green-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Últimas Notícias</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-trucker-blue hover:text-trucker-blue/80">
          Ver todas
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4">
        {mockNews.map((news, index) => (
          <motion.div
            key={news.id}
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
                  >
                    Ler mais
                  </motion.button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Scroll indicator dots */}
      <div className="flex justify-center gap-2 mt-4">
        {mockNews.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === 0 ? 'bg-trucker-blue' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}