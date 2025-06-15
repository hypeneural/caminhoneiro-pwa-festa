import { motion } from "framer-motion";
import { Map as MapIcon, Navigation, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";

const Map = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border/50 px-4 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
            <MapIcon className="w-5 h-5 text-trucker-blue-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Mapa</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="destructive" 
            className="bg-trucker-red animate-pulse"
          >
            AO VIVO
          </Badge>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="pt-16 pb-20">
        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="h-[50vh] bg-muted relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-trucker-blue/20 to-trucker-green/20 flex items-center justify-center">
            <div className="text-center">
              <MapIcon className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Mapa da Procissão</p>
            </div>
          </div>
          
          {/* Current Location Indicator */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-4 h-4 bg-trucker-red rounded-full shadow-lg"></div>
          </motion.div>
        </motion.div>

        {/* Location Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 space-y-4"
        >
          <div className="bg-card rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-trucker-red" />
              <h3 className="font-bold text-card-foreground">Localização Atual</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Rua das Flores, 123 - Centro</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-trucker-green border-trucker-green">
                Em movimento
              </Badge>
              <span className="text-xs text-muted-foreground">Atualizado há 30s</span>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-5 h-5 text-trucker-blue" />
              <h3 className="font-bold text-card-foreground">Próxima Parada</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Igreja São José</p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-trucker-yellow border-trucker-yellow">
                15 min
              </Badge>
              <Button size="sm" variant="outline">
                Ver Rota
              </Button>
            </div>
          </div>

          {/* Route Timeline */}
          <div className="bg-card rounded-xl p-4 shadow-md">
            <h3 className="font-bold text-card-foreground mb-3">Cronograma da Procissão</h3>
            <div className="space-y-3">
              {[
                { name: "Saída - Centro", time: "08:00", completed: true },
                { name: "Igreja São José", time: "09:15", current: true },
                { name: "Praça Central", time: "10:30", completed: false },
                { name: "Retorno - Centro", time: "11:45", completed: false },
              ].map((stop, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    stop.completed ? 'bg-trucker-green' : 
                    stop.current ? 'bg-trucker-red animate-pulse' : 
                    'bg-muted'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{stop.name}</p>
                    <p className="text-xs text-muted-foreground">{stop.time}</p>
                  </div>
                  {stop.current && (
                    <Badge variant="destructive" className="bg-trucker-red text-xs">
                      Atual
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Map;