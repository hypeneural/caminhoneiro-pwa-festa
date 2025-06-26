
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useTraccarData } from "@/hooks/useTraccarData";
import { useMapRenderer } from "@/hooks/useMapRenderer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundary, TrackerErrorFallback } from "@/components/ui/error-boundary";
import { TrackerSkeleton } from "@/components/ui/skeleton";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { TrackerError } from "@/components/tracker/TrackerError";
import MapRenderer from "@/components/map/MapRenderer";
import {
  convertKnotsToKmh,
  convertMetersToKm,
  getMovementStatus,
  getBatteryColor,
  formatLastUpdate,
  isRecentUpdate
} from "@/utils/trackerUtils";
import { NavigationActions } from "@/components/ui/navigation-actions";

// React Icons
import { FaMapMarkedAlt, FaTachometerAlt, FaBatteryThreeQuarters, FaRoute, FaTruck, FaParking } from 'react-icons/fa';
import { IoMdPulse } from 'react-icons/io';
import { MdGpsFixed, MdGpsOff, MdLocationOn } from 'react-icons/md';
import { RiMapPinTimeLine, RiTruckFill } from 'react-icons/ri';
import { BiCurrentLocation } from 'react-icons/bi';

export const SaoCristovaoTracker = () => {
  const navigate = useNavigate();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { data, isLoading, isError, refetch, isFetching } = useTraccarData();
  const { logMapEvent } = useMapRenderer();

  const handleRealtimeMapClick = () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
    navigate('/rota-completa');
  };

  const handleFullTrajectoryClick = () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
    navigate('/mapa');
  };

  return (
    <ErrorBoundary fallback={TrackerErrorFallback}>
      <section className="px-4 py-6" aria-labelledby="tracker-section">
        <div className="flex items-center gap-2 mb-4">
          <FaMapMarkedAlt className="w-5 h-5 text-trucker-blue" aria-hidden="true" />
          <h2 id="tracker-section" className="text-lg font-bold text-foreground">
            São Cristóvão em Movimento
          </h2>
        </div>

        {(isLoading && !data) ? (
          <TrackerSkeleton />
        ) : (isError && !data) || !data ? (
          <TrackerError onRetry={refetch} isRetrying={isFetching} />
        ) :
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {(() => {
              const speedKmh = convertKnotsToKmh(data.speed || 0);
              const totalDistanceKm = convertMetersToKm(data.attributes?.totalDistance || 0);
              const batteryLevel = data.attributes?.batteryLevel || 0;
              const status = getMovementStatus(data.attributes?.motion || false, data.speed || 0);
              const batteryColor = getBatteryColor(batteryLevel);
              const lastUpdate = formatLastUpdate(data.fixTime);
              const isLive = isRecentUpdate(data.fixTime);
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
                        variant={hasConnectionError ? "outline" : (isLive ? "destructive" : "secondary")}
                        className="flex items-center gap-1.5"
                      >
                        <motion.div
                          animate={{ 
                            scale: isLive && !hasConnectionError ? [1, 1.2, 1] : 1,
                            opacity: isLive && !hasConnectionError ? [1, 0.7, 1] : 1
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {hasConnectionError ? (
                            <MdGpsOff className="w-4 h-4" />
                          ) : (
                            isLive ? <IoMdPulse className="w-4 h-4" /> : <MdGpsFixed className="w-4 h-4" />
                          )}
                        </motion.div>
                        {hasConnectionError ? 'OFFLINE' : (isLive ? 'AO VIVO' : 'OFFLINE')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RiMapPinTimeLine className="w-4 h-4" />
                      {lastUpdate}
                    </div>
                  </div>

                  {/* Mapa robusto com fallbacks em camadas */}
                  <div 
                    ref={ref} 
                    className="relative h-32 rounded-lg overflow-hidden"
                    role="img"
                    aria-label="Mapa com localização atual do São Cristóvão"
                    id="map-container"
                  >
                    {inView && data ? (
                      <MapRenderer 
                        data={data} 
                        height="h-32"
                        showSpeed={true}
                        containerId="map-container"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg flex items-center justify-center">
                        <div className="text-2xl" aria-hidden="true">🗺️</div>
                      </div>
                    )}
                  </div>

                  {/* Status de movimento com animação */}
                  <motion.div 
                    className={`${status.color} rounded-lg p-4 flex items-center gap-3`}
                    animate={{ 
                      scale: status.animate ? [1, 1.02, 1] : 1,
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ 
                        x: status.animationType === 'move' ? [0, 4, 0] : 0,
                        rotate: status.animationType === 'move' ? [0, 0, 0] : 0
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="bg-white/90 rounded-full p-2"
                    >
                      {status.animationType === 'move' ? (
                        <RiTruckFill className={`w-6 h-6 ${status.textColor}`} />
                      ) : (
                        <FaParking className={`w-6 h-6 ${status.textColor}`} />
                      )}
                    </motion.div>
                    <div>
                      <div className={`font-medium ${status.textColor}`}>
                        {status.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {status.description}
                      </div>
                    </div>
                  </motion.div>

                  {/* Painel de telemetria 3x3 com animações */}
                  <div
                    className="grid grid-cols-3 gap-3"
                    role="group"
                    aria-label="Dados de telemetria em tempo real"
                  >
                    {/* Velocidade */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="bg-gradient-to-br from-trucker-blue/10 to-trucker-blue/5 rounded-lg p-3 border border-trucker-blue/20"
                      role="group"
                      aria-label={`Velocidade atual: ${speedKmh} quilômetros por hora`}
                    >
                      <motion.div
                        animate={{ 
                          rotate: speedKmh > 0 ? [0, 360] : 0,
                        }}
                        transition={{ duration: 2, repeat: speedKmh > 0 ? Infinity : 0 }}
                      >
                        <FaTachometerAlt className="w-5 h-5 text-trucker-blue mb-2" aria-hidden="true" />
                      </motion.div>
                      <div className="text-xl font-bold text-foreground">{speedKmh}</div>
                      <div className="text-xs text-muted-foreground">km/h</div>
                    </motion.div>

                    {/* Bateria */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-3 border border-border/50"
                      role="group"
                      aria-label={`Nível da bateria: ${batteryLevel} por cento`}
                    >
                      <motion.div
                        animate={{ 
                          scale: batteryLevel < 20 ? [1, 1.1, 1] : 1,
                        }}
                        transition={{ duration: 1, repeat: batteryLevel < 20 ? Infinity : 0 }}
                      >
                        <FaBatteryThreeQuarters className={`w-5 h-5 ${batteryColor} mb-2`} aria-hidden="true" />
                      </motion.div>
                      <div className="text-xl font-bold text-foreground">{batteryLevel}</div>
                      <div className="text-xs text-muted-foreground">%</div>
                    </motion.div>

                    {/* Distância Total */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="bg-gradient-to-br from-trucker-green/10 to-trucker-green/5 rounded-lg p-3 border border-trucker-green/20"
                      role="group"
                      aria-label={`Distância total percorrida: ${totalDistanceKm} quilômetros`}
                    >
                      <FaRoute className="w-5 h-5 text-trucker-green mb-2" aria-hidden="true" />
                      <div className="text-xl font-bold text-foreground">{totalDistanceKm}</div>
                      <div className="text-xs text-muted-foreground">km</div>
                    </motion.div>
                  </div>

                  {/* Localização atual com animação */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/30 rounded-lg p-4 space-y-2"
                    role="group"
                    aria-label="Localização atual"
                  >
                    <div className="flex items-center gap-2 text-trucker-blue">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [1, 0.8, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <BiCurrentLocation className="w-5 h-5" />
                      </motion.div>
                      <span className="font-medium">Localização atual</span>
                    </div>
                    <div className="flex items-start gap-3 pl-7">
                      <div className="flex-1">
                        <div className="text-sm text-foreground font-medium">
                          {data.address || (
                            <span className="text-muted-foreground italic">
                              Buscando endereço...
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Atualizado {lastUpdate}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Botões de ação melhorados - Mobile First Design */}
                  <div className="space-y-3">
                    {/* Botão Mapa em Tempo Real - Destaque Principal */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={handleRealtimeMapClick}
                        className="w-full h-14 bg-gradient-to-r from-trucker-blue to-trucker-blue/90 hover:from-trucker-blue/90 hover:to-trucker-blue text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group"
                        aria-label="Ver mapa em tempo real do São Cristóvão"
                      >
                        {/* Animated background pulse */}
                        <motion.div
                          className="absolute inset-0 bg-white/10 rounded-xl"
                          animate={{ 
                            scale: [1, 1.05, 1],
                            opacity: [0, 0.3, 0]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        
                        {/* Icon with pulse animation */}
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="relative z-10"
                        >
                          <FaMapMarkedAlt className="w-6 h-6" />
                        </motion.div>
                        
                        <div className="flex flex-col items-start relative z-10">
                          <span className="text-base font-semibold">Mapa em Tempo Real</span>
                          <span className="text-xs text-white/80">Localização ao vivo</span>
                        </div>
                        
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                          animate={{ x: [-200, 400] }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "linear",
                            repeatDelay: 3
                          }}
                        />
                      </button>
                    </motion.div>

                    {/* Botão Ver Trajeto Completo - Secundário */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={handleFullTrajectoryClick}
                        className="w-full h-12 bg-gradient-to-r from-trucker-green to-trucker-green/90 hover:from-trucker-green/90 hover:to-trucker-green text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden"
                        aria-label="Ver trajeto completo do São Cristóvão"
                      >
                        <motion.div
                          animate={{ 
                            rotate: [0, 360],
                          }}
                          transition={{ 
                            duration: 8, 
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        >
                          <FaRoute className="w-5 h-5" />
                        </motion.div>
                        
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">Ver Trajeto Completo</span>
                          <span className="text-xs text-white/80">Histórico de rota</span>
                        </div>
                        
                        {/* Subtle glow effect */}
                        <motion.div
                          className="absolute inset-0 bg-white/5 rounded-xl"
                          animate={{ 
                            opacity: [0, 0.3, 0]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </button>
                    </motion.div>
                  </div>

                  {/* Botão de Navegação - Terceiro nível */}
                  <NavigationActions
                    coordinates={{
                      latitude: data.latitude,
                      longitude: data.longitude
                    }}
                    title="Abrir Localização do Caminhão"
                    address={data.address || "Localização atual do São Cristóvão"}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full"
                    >
                      <Button 
                        variant="outline" 
                        className="w-full h-12 bg-background/50 hover:bg-trucker-red/10 border-trucker-red/30 text-trucker-red hover:text-trucker-red transition-all duration-300 flex items-center justify-center gap-3 rounded-xl shadow-sm hover:shadow-md"
                      >
                        <motion.div
                          animate={{ 
                            y: [0, -3, 0],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <MdLocationOn className="w-5 h-5" />
                        </motion.div>
                        <span className="font-medium">Abrir no Maps</span>
                      </Button>
                    </motion.div>
                  </NavigationActions>
                </Card>
              );
            })()}
          </motion.div>
        }
      </section>
    </ErrorBoundary>
  );
};
