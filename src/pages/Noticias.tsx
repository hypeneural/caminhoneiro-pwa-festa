import { motion } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Clock, Eye, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const Noticias = () => {
  const categories = [
    { id: "todas", name: "Todas", active: true },
    { id: "evento", name: "Evento", active: false },
    { id: "shows", name: "Shows", active: false },
    { id: "caminhoneiros", name: "Caminhoneiros", active: false }
  ];

  const featuredNews = {
    id: 1,
    title: "Festa do Caminhoneiro 2025: Programação Completa Divulgada",
    summary: "Confira todos os shows e atrações que vão agitar os dois dias de festa em Tijucas/SC",
    imageUrl: "/placeholder.svg",
    category: "Evento",
    publishedAt: "2024-12-15T10:00:00Z",
    author: "Redação FC",
    featured: true,
    views: "2.1K",
    readTime: "3 min"
  };

  const newsList = [
    {
      id: 2,
      title: "Gusttavo Lima Confirma Presença na Festa 2025",
      summary: "Embaixador estrela mais uma edição do maior evento caminhoneiro do Sul",
      imageUrl: "/placeholder.svg",
      category: "Shows",
      publishedAt: "2024-12-14T15:30:00Z",
      author: "Maria Silva",
      views: "1.8K",
      readTime: "2 min"
    },
    {
      id: 3,
      title: "Inscrições Abertas para Concurso de Decoração",
      summary: "Caminhoneiros podem participar da disputa pela melhor decoração",
      imageUrl: "/placeholder.svg",
      category: "Evento",
      publishedAt: "2024-12-13T09:15:00Z",
      author: "João Santos",
      views: "950",
      readTime: "4 min"
    },
    {
      id: 4,
      title: "Movimento Caminhoneiro Ganha Força Nacional",
      summary: "Categoria se mobiliza por melhores condições de trabalho",
      imageUrl: "/placeholder.svg",
      category: "Caminhoneiros",
      publishedAt: "2024-12-12T14:20:00Z",
      author: "Ana Costa",
      views: "1.2K",
      readTime: "5 min"
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Newspaper className="w-8 h-8 text-trucker-green" />
              <h1 className="text-2xl font-bold text-foreground">Notícias</h1>
            </div>
            <p className="text-muted-foreground">
              Fique por dentro de tudo sobre a festa
            </p>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={category.active ? "default" : "outline"}
                className={`whitespace-nowrap ${
                  category.active ? "bg-trucker-green" : ""
                }`}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          {/* Featured News */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={featuredNews.imageUrl}
                  alt={featuredNews.title}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-3 left-3 bg-trucker-red">
                  Destaque
                </Badge>
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <Badge variant="secondary" className="mb-2">
                  {featuredNews.category}
                </Badge>
                <h2 className="text-lg font-bold mb-2 line-clamp-2">
                  {featuredNews.title}
                </h2>
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {featuredNews.summary}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>{featuredNews.author}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {featuredNews.readTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {featuredNews.views}
                    </div>
                    <span>{formatDate(featuredNews.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* News List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Últimas Notícias</h2>
            <div className="space-y-4">
              {newsList.map((news, index) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card>
                    <CardContent className="p-0">
                      <div className="flex gap-3 p-4">
                        <div className="flex-shrink-0">
                          <img
                            src={news.imageUrl}
                            alt={news.title}
                            className="w-20 h-16 object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Badge variant="secondary" className="text-xs mb-1">
                            {news.category}
                          </Badge>
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {news.title}
                          </h3>
                          <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
                            {news.summary}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>{news.author}</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {news.readTime}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {news.views}
                              </div>
                              <span>{formatDate(news.publishedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Load More */}
          <div className="text-center">
            <Button variant="outline" className="w-full">
              Carregar Mais Notícias
            </Button>
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Noticias;