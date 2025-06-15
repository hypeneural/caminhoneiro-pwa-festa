import { motion } from "framer-motion";
import { Video, MapPin, Users, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";

interface Camera {
  id: string;
  name: string;
  location: string;
  isLive: boolean;
  viewers: number;
  thumbnailUrl: string;
  streamUrl: string;
}

const mockCameras: Camera[] = [
  {
    id: "1",
    name: "Palco Principal",
    location: "Centro da Festa",
    isLive: true,
    viewers: 234,
    thumbnailUrl: "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?auto=format&fit=crop&q=80&w=400",
    streamUrl: "#"
  },
  {
    id: "2", 
    name: "Área de Bênção",
    location: "Igreja São Cristóvão",
    isLive: true,
    viewers: 156,
    thumbnailUrl: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?auto=format&fit=crop&q=80&w=400",
    streamUrl: "#"
  },
  {
    id: "3",
    name: "Concentração de Caminhões",
    location: "Pátio Central",
    isLive: false,
    viewers: 0,
    thumbnailUrl: "https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?auto=format&fit=crop&q=80&w=400",
    streamUrl: "#"
  },
  {
    id: "4",
    name: "Área de Alimentação",
    location: "Praça da Comida",
    isLive: true,
    viewers: 89,
    thumbnailUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400",
    streamUrl: "#"
  }
];

export default function Cameras() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-trucker-blue text-trucker-blue-foreground p-4">
        <div className="flex items-center gap-3 mb-2">
          <Video className="w-6 h-6" />
          <h1 className="text-xl font-bold">Câmeras Ao Vivo</h1>
        </div>
        <p className="text-sm opacity-90">
          Acompanhe a festa em tempo real através das nossas câmeras
        </p>
      </div>

      {/* Live Cameras Grid */}
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockCameras.map((camera, index) => (
            <motion.div
              key={camera.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card className="overflow-hidden bg-card hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={camera.thumbnailUrl}
                    alt={camera.name}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  
                  {/* Live badge */}
                  {camera.isLive && (
                    <Badge className="absolute top-2 left-2 bg-trucker-red text-trucker-red-foreground animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-1" />
                      AO VIVO
                    </Badge>
                  )}

                  {/* Viewers count */}
                  {camera.isLive && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="text-xs">{camera.viewers}</span>
                    </div>
                  )}

                  {/* Offline overlay */}
                  {!camera.isLive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Wifi className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Offline</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-1">{camera.name}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>{camera.location}</span>
                  </div>

                  <Button 
                    className="w-full" 
                    variant={camera.isLive ? "default" : "secondary"}
                    disabled={!camera.isLive}
                  >
                    {camera.isLive ? "Assistir Agora" : "Indisponível"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Banner */}
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-trucker-blue mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground mb-1">
                Transmissão em Tempo Real
              </h3>
              <p className="text-sm text-muted-foreground">
                As câmeras ficam ativas durante os principais eventos da festa. 
                Acompanhe os momentos especiais mesmo à distância!
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}