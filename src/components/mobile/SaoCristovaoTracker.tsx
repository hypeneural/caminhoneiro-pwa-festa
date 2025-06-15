import { MapPin, Navigation, Clock } from "lucide-react";
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
    address: "Rua das Flores, 123 - Centro, Tijucas/SC",
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
          icon: '🚛',
          speed: '12 km/h'
        };
      case 'stopped':
        return {
          text: 'Parado para descanso',
          color: 'bg-trucker-yellow',
          icon: '⏸️',
          speed: '0 km/h'
        };
      case 'blessing':
        return {
          text: 'Realizando bênção',
          color: 'bg-trucker-blue',
          icon: '🙏',
          speed: '0 km/h'
        };
      default:
        return {
          text: 'Status desconhecido',
          color: 'bg-muted',
          icon: '❓',
          speed: '-- km/h'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="px-4 mb-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-trucker-yellow rounded-lg flex items-center justify-center">
          <MapPin className="w-4 h-4 text-trucker-yellow-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Localização de São Cristóvão</h2>
      </div>

      <Card className="p-4 bg-card shadow-md border-border/50">
        {/* Live Indicator */}
        <div className="flex items-center justify-between mb-4">
          <Badge 
            variant="destructive" 
            className="bg-trucker-red text-trucker-red-foreground animate-pulse"
          >
            🔴 AO VIVO
          </Badge>
          <span className="text-xs text-muted-foreground">Atualizado há 30s</span>
        </div>

        {/* Interactive Map Placeholder */}
        <div className="relative h-36 bg-gradient-to-br from-trucker-blue/10 to-trucker-green/10 rounded-lg mb-4 overflow-hidden">
          {/* Map Background Grid */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" className="w-full h-full">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--trucker-blue))" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Truck Icon with Enhanced Animation */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Pulse Radar Effect */}
            <motion.div
              className="absolute inset-0 w-10 h-10 bg-trucker-red/20 rounded-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
              animate={{
                scale: [1, 3, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
            
            {/* Truck SVG Icon */}
            <div className="relative z-10">
              <svg 
                width="36" 
                height="36" 
                viewBox="0 0 24 24" 
                fill="none"
                className="drop-shadow-lg"
              >
                <path 
                  d="M1 3h15v13H1V3zm16 5h4l2 3v5h-2a3 3 0 11-6 0H8a3 3 0 11-6 0H1v-2h1V3zm2 10a1 1 0 100-2 1 1 0 000 2zM5 18a1 1 0 100-2 1 1 0 000 2z" 
                  fill="hsl(var(--trucker-red))"
                />
                <circle cx="5" cy="17" r="1" fill="hsl(var(--background))" />
                <circle cx="19" cy="17" r="1" fill="hsl(var(--background))" />
              </svg>
            </div>
          </motion.div>

          {/* Animated Route Path */}
          <svg className="absolute inset-0 w-full h-full">
            <motion.path
              d="M20,120 Q80,40 140,120 Q200,200 260,120"
              stroke="hsl(var(--trucker-blue))"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8,4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </svg>

          {/* Location Badge */}
          <div className="absolute bottom-3 left-3 bg-background/95 text-xs px-3 py-1 rounded-full border border-border/50">
            📍 Tijucas/SC
          </div>
        </div>

        {/* Location Information - Hierarquia Melhorada */}
        <div className="space-y-4">
          {/* Current Location - DESTAQUE PRINCIPAL */}
          <div className="bg-trucker-blue/5 border border-trucker-blue/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">LOCALIZAÇÃO ATUAL</p>
            <p className="text-base font-semibold text-foreground leading-tight mb-2">
              {mockLocation.currentLocation.address}
            </p>
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`${statusInfo.color} border-none text-white font-medium`}
              >
                {statusInfo.icon} {statusInfo.text}
              </Badge>
              <span className="text-sm text-muted-foreground font-medium">
                {statusInfo.speed}
              </span>
            </div>
          </div>

          {/* Next Stop */}
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-trucker-blue" />
                  <p className="text-xs text-muted-foreground font-medium">PRÓXIMA PARADA</p>
                </div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  {mockLocation.nextStop.name}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-trucker-yellow" />
                    <span className="text-sm text-trucker-yellow font-semibold">
                      {mockLocation.nextStop.estimatedTime} min
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">• 2,3 km</span>
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant="outline"
                className="border-trucker-blue text-trucker-blue hover:bg-trucker-blue/10 font-medium"
              >
                Ver no Mapa Completo
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}