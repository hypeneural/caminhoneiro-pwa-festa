import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Eye, 
  Share2, 
  Play,
  ArrowRight,
  RefreshCw,
  Wifi,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { cameraService } from "@/services/api/cameraService";
import type { Camera as CameraType } from "@/types/camera";

const MotionCard = motion.create(Card);

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
  hidden: { opacity: 0, x: 50 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20
    }
  }
} as const;

interface CamerasCarouselProps {
  className?: string;
}

export const CamerasCarousel = ({ className = "" }: CamerasCarouselProps) => {
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewersCount] = useState(() => Math.floor(Math.random() * 150) + 75);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const response = await cameraService.listCameras({ 
        limit: 5,
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
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleCameraClick = (camera: CameraType) => {
    navigate('/cameras', { 
      state: { selectedCamera: camera } 
    });
  };

  const handleShare = async (camera: CameraType, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: `Câmera ${camera.nome_local} - Festa dos Caminhoneiros`,
        text: camera.descricao,
        url: `${window.location.origin}/cameras`
      });
    } catch (error) {
      // Ignora erro se usuário cancelar compartilhamento
    }
  };

  const handleViewAll = () => {
    navigate('/cameras');
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="w-32 h-6" />
          </div>
          <Skeleton className="w-20 h-9" />
        </div>
        
        {/* Carousel Skeleton */}
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex-shrink-0 w-72 overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-trucker-red animate-bounce-gentle" />
        <h3 className="text-lg font-semibold mb-2">Câmeras indisponíveis</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Não foi possível carregar as câmeras no momento
        </p>
        <Button
          variant="outline"
          onClick={fetchCameras}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      className={`space-y-4 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="p-2 bg-trucker-red rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Camera className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold">Câmeras Ao Vivo</h2>
            <p className="text-xs text-muted-foreground">
              {cameras.length} transmissões disponíveis
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewAll}
          className="gap-1 hover:bg-trucker-blue hover:text-white transition-colors"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <AnimatePresence>
          {cameras.map((camera, index) => (
            <MotionCard
              key={camera.id}
              variants={itemVariants}
              className="flex-shrink-0 w-72 group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
              onClick={() => handleCameraClick(camera)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <motion.img 
                  src={cameraService.getThumbnailUrl(camera.alias_ipcamlive)}
                  alt={camera.nome_local}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge 
                    className="bg-trucker-red text-white animate-pulse flex items-center gap-1 text-xs"
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                    AO VIVO
                  </Badge>
                  <Badge 
                    variant="secondary"
                    className="bg-black/60 text-white flex items-center gap-1 text-xs"
                  >
                    <Eye className="w-3 h-3" />
                    {viewersCount + index * 12}
                  </Badge>
                </div>

                {/* Ações */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleShare(camera, e)}
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Play button central */}
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="w-16 h-16 bg-trucker-red/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </motion.div>

                {/* Status indicator */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className="bg-green-500/20 border-green-500 text-green-400 text-xs"
                  >
                    <Wifi className="w-2 h-2 mr-1" />
                    Online
                  </Badge>
                </div>
              </div>

              <motion.div 
                className="p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-bold text-base mb-1 line-clamp-1">
                  {camera.nome_local}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {camera.descricao}
                </p>
                <Button 
                  className="w-full bg-trucker-blue hover:bg-trucker-blue/90 group/btn text-sm h-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCameraClick(camera);
                  }}
                >
                  <Play className="w-4 h-4 mr-2 group-hover/btn:animate-bounce-gentle" />
                  Assistir Agora
                </Button>
              </motion.div>
            </MotionCard>
          ))}
        </AnimatePresence>
      </div>

      {/* Scroll indicator */}
      {cameras.length > 2 && (
        <div className="flex justify-center pt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Deslize para ver mais câmeras
          </p>
        </div>
      )}
    </motion.div>
  );
}; 