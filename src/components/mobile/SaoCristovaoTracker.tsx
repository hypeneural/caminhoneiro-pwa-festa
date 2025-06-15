import React from "react";
import { motion } from "framer-motion";
import { MapPin, Gauge, Battery, Route, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundary, TrackerErrorFallback } from "@/components/ui/error-boundary";
import { TrackerSkeleton } from "@/components/ui/skeleton";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useTraccarData } from "@/hooks/useTraccarData";
import { TrackerError } from "@/components/tracker/TrackerError";
import MapRenderer from "@/components/map/MapRenderer";
import { useMapRenderer } from "@/hooks/useMapRenderer";
import {
  convertKnotsToKmh,
  convertMetersToKm,
  getMovementStatus,
  getBatteryColor,
  formatLastUpdate,
  isRecentUpdate
} from "@/utils/trackerUtils";

export const SaoCristovaoTracker = () => {
  const navigate = useNavigate();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { data, isLoading, isError, refetch, isFetching } = useTraccarData();
  const { logMapEvent } = useMapRenderer();

  return (
    <ErrorBoundary fallback={TrackerErrorFallback}>
      <section className="px-4 py-6" aria-labelledby="tracker-section">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-trucker-blue" aria-hidden="true" />
          <h2 id="tracker-section" className="text-lg font-bold text-foreground">
            São Cristóvão em Movimento
          </h2>
        </div>

        {(isLoading && !data) ? (
          <TrackerSkeleton />
        ) : (isError && !data) || !data ? (
          <TrackerError onRetry={refetch} isRetrying={isFetching} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {(() => {
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
                <Card 
                  className="p-4 space-y-4 shadow-lg border-primary/10 bg-gradient-to-br from-card to-card/50"
                  role="region"
                  aria-live="polite"
                  aria-label="Informações de rastreamento em tempo real"
                >
            {/* Header com status AO VIVO */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="destructive" 
                  className={`${(isLive && !hasConnectionError) ? 'animate-pulse bg-trucker-red' : 'bg-muted'} text-xs font-bold`}
                  aria-label={hasConnectionError ? 'Dados offline' : (isLive ? 'Transmissão ao vivo' : 'Offline')}
                >
                  {hasConnectionError ? 'DADOS OFFLINE' : (isLive ? 'AO VIVO' : 'OFFLINE')}
                </Badge>
                <motion.div
                  animate={{ scale: (isLive && !hasConnectionError) ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 2, repeat: (isLive && !hasConnectionError) ? Infinity : 0 }}
                  className={`w-2 h-2 rounded-full ${(isLive && !hasConnectionError) ? 'bg-trucker-red' : 'bg-muted'}`}
                  aria-hidden="true"
                />
              </div>
              <span className="text-xs text-muted-foreground" aria-label={`Última atualização: ${lastUpdate}`}>
                atualizado {lastUpdate}
              </span>
            </div>

            {/* Mapa robusto com fallbacks em camadas */}
            <div 
              ref={ref} 
              className="relative h-32 rounded-lg overflow-hidden"
              role="img"
              aria-label="Mapa com localização atual do São Cristóvão"
            >
              {inView ? (
                <MapRenderer 
                  data={data} 
                  height="h-32"
                  showSpeed={true}
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg flex items-center justify-center">
                  <div className="text-2xl" aria-hidden="true">🗺️</div>
                </div>
              )}
            </div>

            {/* Painel de telemetria 3x3 */}
            <div 
              className="grid grid-cols-3 gap-3"
              role="group"
              aria-label="Dados de telemetria em tempo real"
            >
              {/* Velocidade */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-gradient-to-br from-trucker-blue/10 to-trucker-blue/5 rounded-lg p-3 border border-trucker-blue/20"
                role="group"
                aria-label={`Velocidade atual: ${speedKmh} quilômetros por hora`}
              >
                <Gauge className="w-5 h-5 text-trucker-blue mb-2" aria-hidden="true" />
                <div className="text-xl font-bold text-foreground">{speedKmh}</div>
                <div className="text-xs text-muted-foreground">km/h</div>
              </motion.div>

              {/* Bateria */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-3 border border-border/50"
                role="group"
                aria-label={`Nível da bateria: ${batteryLevel} por cento`}
              >
                <Battery className={`w-5 h-5 ${batteryColor} mb-2`} aria-hidden="true" />
                <div className="text-xl font-bold text-foreground">{batteryLevel}</div>
                <div className="text-xs text-muted-foreground">%</div>
              </motion.div>

              {/* Distância Total */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-gradient-to-br from-trucker-green/10 to-trucker-green/5 rounded-lg p-3 border border-trucker-green/20"
                role="group"
                aria-label={`Distância total percorrida: ${totalDistanceKm} quilômetros`}
              >
                <Route className="w-5 h-5 text-trucker-green mb-2" aria-hidden="true" />
                <div className="text-xl font-bold text-foreground">{totalDistanceKm}</div>
                <div className="text-xs text-muted-foreground">km</div>
              </motion.div>
            </div>

            {/* Status e endereço */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-3 pt-2 border-t border-border/50"
            >
              {/* Status de movimento */}
              <div className="flex items-center gap-3">
                <div 
                  className={`${status.color} ${status.textColor} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2`}
                  role="status"
                  aria-label={`Status: ${status.label}`}
                >
                  <span className="text-lg" aria-hidden="true">{status.icon}</span>
                  {status.label}
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-muted/30 rounded-lg p-3" role="group" aria-label="Localização atual">
                <div className="text-xs text-muted-foreground mb-1">Localização atual:</div>
                <div className="text-sm text-foreground font-medium">
                  {data.address || (
                    <span className="text-muted-foreground italic">
                      Buscando endereço...
                    </span>
                  )}
                </div>
              </div>

              {/* Botão CTA para rota completa */}
              <AccessibleButton 
                onClick={() => navigate('/rota-completa')}
                className="w-full bg-trucker-blue hover:bg-trucker-blue/90 text-white"
                size="lg"
                aria-label="Ver rota completa do São Cristóvão"
              >
                <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                Ver Rota Completa
              </AccessibleButton>
            </motion.div>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </section>
    </ErrorBoundary>
  );
};