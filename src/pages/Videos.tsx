import { motion } from "framer-motion";
import { Header } from "@/components/mobile/Header";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Play, Clock, Eye } from "lucide-react";

const Videos = () => {
  const videoCategories = [
    { id: "highlights", name: "Destaques", count: 8 },
    { id: "shows", name: "Shows", count: 15 },
    { id: "bastidores", name: "Bastidores", count: 12 },
    { id: "entrevistas", name: "Entrevistas", count: 6 }
  ];

  const featuredVideos = [
    {
      id: 1,
      title: "Melhores Momentos 2024",
      thumbnail: "/placeholder.svg",
      duration: "15:32",
      views: "2.1K",
      category: "Destaques"
    },
    {
      id: 2,
      title: "Show Gusttavo Lima Completo",
      thumbnail: "/placeholder.svg",
      duration: "45:18",
      views: "8.7K",
      category: "Shows"
    },
    {
      id: 3,
      title: "Preparativos da Festa",
      thumbnail: "/placeholder.svg",
      duration: "8:45",
      views: "1.5K",
      category: "Bastidores"
    },
    {
      id: 4,
      title: "Entrevista com Organizadores",
      thumbnail: "/placeholder.svg",
      duration: "12:20",
      views: "3.2K",
      category: "Entrevistas"
    }
  ];

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
              <Video className="w-8 h-8 text-trucker-orange" />
              <h1 className="text-2xl font-bold text-foreground">Vídeos</h1>
            </div>
            <p className="text-muted-foreground">
              Relembre os melhores momentos da festa
            </p>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {videoCategories.map((category) => (
              <Badge
                key={category.id}
                variant="outline"
                className="whitespace-nowrap flex items-center gap-2"
              >
                {category.name}
                <span className="bg-trucker-orange text-trucker-orange-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {category.count}
                </span>
              </Badge>
            ))}
          </div>

          {/* Featured Video */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src="/placeholder.svg"
                  alt="Video em destaque"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 bg-trucker-red rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
                <Badge className="absolute top-2 left-2 bg-trucker-red">
                  Em Destaque
                </Badge>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  15:32
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">Festa do Caminhoneiro 2024 - Resumo Oficial</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    5.2K visualizações
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    2 dias atrás
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Todos os Vídeos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {featuredVideos.map((video) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * video.id }}
                >
                  <Card className="overflow-hidden h-full flex flex-col">
                    <CardContent className="p-0 flex-1 flex flex-col">
                      <div className="relative flex-shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-32 object-cover rounded-t"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                        <div>
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {video.title}
                          </h4>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {video.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                          <span>{video.views} views</span>
                          <span>•</span>
                          <span>3 dias atrás</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Videos;