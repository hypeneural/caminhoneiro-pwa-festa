import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, 
  Search, 
  X, 
  Maximize2, 
  Minimize2, 
  RefreshCw,
  Camera,
  Eye,
  Share2,
  ChevronLeft,
  Wifi,
  AlertCircle,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { BannerCarousel } from "@/components/sponsors/BannerCarousel";
import { CompactBannerCarousel } from "@/components/sponsors/CompactBannerCarousel";
import { cameraService } from "@/services/api/cameraService";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import type { Camera as CameraType } from "@/types/camera";

const MotionCard = motion(Card);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20
    }
  }
} as const;

export default function Cameras() {
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewersCount] = useState(() => Math.floor(Math.random() * 100) + 50);
  const { toast } = useToast();
  const { banners } = useAdvertisements();

  const fetchCameras = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const response = await cameraService.listCameras({ 
        search,
        limit: 25,
        page: 1 
      });
      setCameras(response.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar câmeras",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    fetchCameras(value);
  }, [fetchCameras]);

  const handleRefresh = async () => {
    await fetchCameras(searchTerm);
    toast({
      title: "Atualizado!",
      description: "Câmeras atualizadas com sucesso"
    });
  };

  const handleShare = async (camera: CameraType, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: `Câmera ${camera.nome_local} - Festa dos Caminhoneiros`,
        text: camera.descricao,
        url: window.location.href
      });
    } catch (error) {
      // Ignora erro se usuário cancelar compartilhamento
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header Fixo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-trucker-blue text-trucker-blue-foreground"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6" />
            <h1 className="text-xl font-bold">Câmeras Ao Vivo</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-trucker-blue-foreground hover:bg-trucker-blue-foreground/10"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Barra de Busca */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar câmera..."
              className="pl-10 bg-trucker-blue-foreground/10 border-trucker-blue-foreground/20 text-trucker-blue-foreground placeholder:text-trucker-blue-foreground/60"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-trucker-blue-foreground/60" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 text-trucker-blue-foreground/60"
                onClick={() => handleSearch("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Banner de Anúncio */}
      {banners.length > 0 && (
        <div className="p-4">
          <BannerCarousel 
            banners={banners} 
            showControls={true}
            showDots={true}
            className="rounded-xl shadow-lg"
          />
        </div>
      )}

      {/* Lista de Câmeras */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            {loading ? (
              // Skeletons
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {[1, 2].map((i) => (
                  <MotionCard 
                    key={i} 
                    variants={itemVariants}
                    className="overflow-hidden"
                  >
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </MotionCard>
                ))}
              </motion.div>
            ) : cameras.length === 0 ? (
              // Estado vazio
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="show"
                className="text-center py-12"
              >
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-trucker-red animate-bounce-gentle" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma câmera encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Tente uma busca diferente" : "Não há câmeras disponíveis no momento"}
                </p>
              </motion.div>
            ) : (
              // Lista de câmeras
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-4"
              >
                {cameras.map((camera, index) => (
                  <div key={camera.id}>
                    <MotionCard
                      variants={itemVariants}
                      className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
                      onClick={() => setSelectedCamera(camera)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative">
                        <motion.img 
                          src={cameraService.getThumbnailUrl(camera.alias_ipcamlive)}
                          alt={camera.nome_local}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                        <div className="absolute top-2 left-2 flex gap-2">
                          <Badge 
                            className="bg-trucker-red text-trucker-red-foreground animate-pulse flex items-center gap-1"
                          >
                            <div className="w-2 h-2 bg-white rounded-full" />
                            AO VIVO
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className="bg-black/60 text-white flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            {viewersCount}
                          </Badge>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleShare(camera, e)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <motion.div 
                        className="p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h3 className="font-bold text-lg mb-1">{camera.nome_local}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{camera.descricao}</p>
                        <Button className="w-full bg-trucker-blue hover:bg-trucker-blue/90 group">
                          <Video className="w-4 h-4 mr-2 group-hover:animate-bounce-gentle" />
                          Assistir Agora
                        </Button>
                      </motion.div>
                    </MotionCard>
                    
                    {/* Banner entre câmeras */}
                    {index < cameras.length - 1 && index % 3 === 2 && banners.length > 0 && (
                      <div className="my-6">
                        <BannerCarousel 
                          banners={banners}
                          showControls={true}
                          showDots={true}
                          compact
                          className="rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PullToRefresh>

      {/* Modal de Visualização */}
      <Dialog 
        open={selectedCamera !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCamera(null);
            setIsFullscreen(false);
          }
        }}
      >
        <DialogContent className={`p-0 ${isFullscreen ? 'w-screen h-screen max-w-none m-0 rounded-none' : ''}`}>
          {selectedCamera && (
            <>
              <DialogTitle className="sr-only">
                Câmera {selectedCamera.nome_local}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Transmissão ao vivo da câmera {selectedCamera.nome_local}. {selectedCamera.descricao}
              </DialogDescription>
              
              <div className="relative h-full bg-black">
                {/* Banner no Modal */}
                {banners.length > 0 && !isFullscreen && (
                  <div className="p-4 bg-background">
                    <BannerCarousel 
                      banners={banners.slice(0, 1)} 
                      showControls={true}
                      showDots={false}
                      compact
                      className="rounded-lg shadow-md"
                    />
                  </div>
                )}

                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setSelectedCamera(null)}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-black/60 text-white">
                      <Eye className="w-3 h-3 mr-1" />
                      {viewersCount} assistindo
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                <div className={`w-full ${isFullscreen ? 'h-screen' : 'aspect-video'}`}>
                  <iframe
                    src={cameraService.getStreamUrl(selectedCamera.alias_ipcamlive)}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    className="bg-black"
                    title={`Câmera ${selectedCamera.nome_local}`}
                  />
                </div>

                {!isFullscreen && (
                  <motion.div 
                    className="p-4 bg-background"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-trucker-blue" />
                      {selectedCamera.nome_local}
                    </h2>
                    <p className="text-sm text-muted-foreground">{selectedCamera.descricao}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        Online
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {viewersCount} visualizações
                      </Badge>
                    </div>
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Transmissão ao vivo da Festa dos Caminhoneiros. A qualidade do vídeo pode variar dependendo da sua conexão com a internet.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}