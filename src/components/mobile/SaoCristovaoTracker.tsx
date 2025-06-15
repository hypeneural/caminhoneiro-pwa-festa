import { motion } from "framer-motion";
import { MapPin, Gauge, Battery, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTraccarData } from "@/hooks/useTraccarData";
import { TrackerSkeleton } from "@/components/tracker/TrackerSkeleton";
import { TrackerError } from "@/components/tracker/TrackerError";
import {
  convertKnotsToKmh,
  convertMetersToKm,
  getMovementStatus,
  getBatteryColor,
  formatLastUpdate,
  isRecentUpdate
} from "@/utils/trackerUtils";

export const SaoCristovaoTracker = () => {
  const { data, isLoading, isError, refetch, isFetching } = useTraccarData();

  // Estado de carregamento inicial
  if (isLoading && !data) {
    return <TrackerSkeleton />;
  }

  // Estado de erro apenas se não houver dados
  if (isError && !data) {
    return <TrackerError onRetry={refetch} isRetrying={isFetching} />;
  }

  // Verificação adicional de segurança para dados
  if (!data) {
    return <TrackerError onRetry={refetch} isRetrying={isFetching} />;
  }

  // Processamento dos dados quando disponíveis
  const speedKmh = convertKnotsToKmh(data.speed || 0);
  const totalDistanceKm = convertMetersToKm(data.attributes?.totalDistance || 0);
  const batteryLevel = data.attributes?.batteryLevel || 0;
  const status = getMovementStatus(data.attributes?.motion || false, data.speed || 0);
  const batteryColor = getBatteryColor(batteryLevel);
  const lastUpdate = formatLastUpdate(data.fixTime);
  const isLive = isRecentUpdate(data.fixTime);
  
  // Mostrar indicador de erro de conexão se houver erro mas dados em cache
  const hasConnectionError = isError && data;

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-trucker-blue" />
        <h2 className="text-lg font-bold text-foreground">São Cristóvão em Movimento</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-4 space-y-4 shadow-lg border-primary/10 bg-gradient-to-br from-card to-card/50">
          {/* Header com status AO VIVO */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant="destructive" 
                className={`${(isLive && !hasConnectionError) ? 'animate-pulse bg-trucker-red' : 'bg-muted'} text-xs font-bold`}
              >
                {hasConnectionError ? 'DADOS OFFLINE' : (isLive ? 'AO VIVO' : 'OFFLINE')}
              </Badge>
              <motion.div
                animate={{ scale: (isLive && !hasConnectionError) ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 2, repeat: (isLive && !hasConnectionError) ? Infinity : 0 }}
                className={`w-2 h-2 rounded-full ${(isLive && !hasConnectionError) ? 'bg-trucker-red' : 'bg-muted'}`}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              atualizado {lastUpdate}
            </span>
          </div>

          {/* Mapa temático com caminhão animado */}
          <div className="relative h-32 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg overflow-hidden">
            {/* Grade de fundo simulando mapa técnico */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />
            
            {/* Caminhão animado */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={
                  status.label === 'Em movimento' 
                    ? { x: [-10, 10, -10] } // Movimento horizontal
                    : { y: [-2, 2, -2] }    // Movimento vertical sutil
                }
                transition={{ 
                  duration: status.label === 'Em movimento' ? 3 : 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-4xl filter drop-shadow-lg"
              >
                🚛
              </motion.div>
            </div>

            {/* Indicador de velocidade no canto */}
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1">
              <span className="text-xs font-bold text-foreground">
                {speedKmh} km/h
              </span>
            </div>
          </div>

          {/* Painel de telemetria 3x3 */}
          <div className="grid grid-cols-3 gap-3">
            {/* Velocidade */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-trucker-blue/10 to-trucker-blue/5 rounded-lg p-3 border border-trucker-blue/20"
            >
              <Gauge className="w-5 h-5 text-trucker-blue mb-2" />
              <div className="text-xl font-bold text-foreground">{speedKmh}</div>
              <div className="text-xs text-muted-foreground">km/h</div>
            </motion.div>

            {/* Bateria */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-3 border border-border/50"
            >
              <Battery className={`w-5 h-5 ${batteryColor} mb-2`} />
              <div className="text-xl font-bold text-foreground">{batteryLevel}</div>
              <div className="text-xs text-muted-foreground">%</div>
            </motion.div>

            {/* Distância Total */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-trucker-green/10 to-trucker-green/5 rounded-lg p-3 border border-trucker-green/20"
            >
              <Route className="w-5 h-5 text-trucker-green mb-2" />
              <div className="text-xl font-bold text-foreground">{totalDistanceKm}</div>
              <div className="text-xs text-muted-foreground">km</div>
            </motion.div>
          </div>

          {/* Status e endereço */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 pt-2 border-t border-border/50"
          >
            {/* Status de movimento */}
            <div className="flex items-center gap-3">
              <div className={`${status.color} ${status.textColor} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2`}>
                <span className="text-lg">{status.icon}</span>
                {status.label}
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Localização atual:</div>
              <div className="text-sm text-foreground font-medium">
                {data.address || (
                  <span className="text-muted-foreground italic">
                    Buscando endereço...
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};