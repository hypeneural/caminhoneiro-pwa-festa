import { MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SaoCristovaoLocation {
  isActive: boolean;
  currentLocation: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  status: 'moving' | 'stopped' | 'blessing';
  nextStop: {
    name: string;
    estimatedTime: number;
  };
  lastUpdate: Date;
}

const mockLocation: SaoCristovaoLocation = {
  isActive: true,
  currentLocation: {
    address: "Rua das Flores, Centro - Tijucas/SC",
    coordinates: { lat: -27.2423, lng: -48.6341 }
  },
  status: 'moving',
  nextStop: {
    name: "Igreja São José",
    estimatedTime: 15
  },
  lastUpdate: new Date()
};

export function SaoCristovaoTracker() {
  const getStatusInfo = () => {
    switch (mockLocation.status) {
      case 'moving':
        return {
          text: 'Em movimento',
          color: 'bg-trucker-green',
          icon: '🚛'
        };
      case 'stopped':
        return {
          text: 'Parado para descanso',
          color: 'bg-trucker-yellow',
          icon: '⏸️'
        };
      case 'blessing':
        return {
          text: 'Realizando bênção',
          color: 'bg-trucker-blue',
          icon: '🙏'
        };
      default:
        return {
          text: 'Status desconhecido',
          color: 'bg-muted',
          icon: '❓'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-trucker-yellow rounded-lg flex items-center justify-center">
          <MapPin className="w-4 h-4 text-trucker-yellow-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Localização de São Cristóvão</h2>
      </div>

      <Card className="p-4 bg-card shadow-md border-border/50">
        <div className="relative">
          {/* Live indicator */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-0 right-0 bg-trucker-red text-trucker-red-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
          >
            <div className="w-2 h-2 bg-trucker-red-foreground rounded-full animate-pulse"></div>
            AO VIVO
          </motion.div>

          {/* Map placeholder */}
          <div className="w-full h-32 bg-muted rounded-lg mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-trucker-blue/20 to-trucker-green/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-4xl"
              >
                🚛
              </motion.div>
            </div>
            <div className="absolute bottom-2 left-2 bg-background/90 text-xs px-2 py-1 rounded">
              Tijucas/SC
            </div>
          </div>

          {/* Status and location info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status atual:</span>
              <Badge className={`${statusInfo.color} text-white`}>
                {statusInfo.icon} {statusInfo.text}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Localização:</span>
                <p className="text-sm text-foreground">{mockLocation.currentLocation.address}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-muted-foreground">Próxima parada:</span>
                <p className="text-sm text-foreground">
                  {mockLocation.nextStop.name} • {mockLocation.nextStop.estimatedTime} min
                </p>
              </div>
            </div>

            <Button className="w-full mt-4 bg-trucker-blue hover:bg-trucker-blue/90 text-trucker-blue-foreground">
              <Navigation className="w-4 h-4 mr-2" />
              Acompanhar Rota
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}