
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useTraccarData } from "@/hooks/useTraccarData";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundary, TrackerErrorFallback } from "@/components/ui/error-boundary";
import { TrackerSkeleton } from "@/components/ui/skeleton";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { TrackerError } from "@/components/tracker/TrackerError";
import { TrackerMetrics } from "@/components/tracker/TrackerMetrics";
import AdaptiveMapRenderer from "@/components/map/AdaptiveMapRenderer";
import { 
  FaMapMarkedAlt, 
  FaTachometerAlt, 
  FaBatteryThreeQuarters, 
  FaRoute, 
  FaTruck, 
  FaParking,
  FaShareAlt,
  FaInfoCircle,
  FaSignal
} from 'react-icons/fa';
import { 
  IoMdPulse, 
  IoMdRefresh,
  IoMdExpand 
} from 'react-icons/io';
import { 
  MdGpsFixed, 
  MdGpsOff, 
  MdLocationOn,
  MdDirections,
  MdWarning
} from 'react-icons/md';
import { 
  RiMapPinTimeLine, 
  RiTruckFill,
  RiBattery2ChargeLine,
  RiSpeedLine
} from 'react-icons/ri';
import { BiCurrentLocation } from 'react-icons/bi';

// Componente para o header com status
const TrackerHeader: React.FC<{
  connectionStatus: any;
  movementStatus: any;
  isRealtime: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}> = ({ connectionStatus, movementStatus, isRealtime, onRefresh, isRefreshing }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Badge 
        variant={connectionStatus.state === 'live' ? "destructive" : 
                connectionStatus.state === 'delayed' ? "default" : "outline"}
        className="flex items-center gap-1.5"
      >
        <motion.div
          animate={{ 
            scale: isRealtime ? [1, 1.2, 1] : 1,
            opacity: isRealtime ? [1, 0.7, 1] : 1
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {connectionStatus.state === 'offline' ? (
            <MdGpsOff className="w-4 h-4" />
          ) : (
            isRealtime ? <IoMdPulse className="w-4 h-4" /> : <MdGpsFixed className="w-4 h-4" />
          )}
        </motion.div>
        {connectionStatus.label}
      </Badge>
      
      {movementStatus.animate && (
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg"
        >
          {movementStatus.icon}
        </motion.div>
      )}
    </div>
    
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <RiMapPinTimeLine className="w-4 h-4" />
        {connectionStatus.lastUpdate}
      </div>
      
      <AccessibleButton
        onClick={onRefresh}
        disabled={isRefreshing}
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        aria-label="Atualizar dados"
      >
        <IoMdRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </AccessibleButton>
    </div>
  </div>
);

// Componente para informações detalhadas
const TrackerDetails: React.FC<{
  data: any;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}> = ({ data, isExpanded, onToggleExpanded }) => (
  <div className="space-y-3">
    {/* Grid de informações principais com interatividade */}
    <div className="grid grid-cols-2 gap-3">
      {/* Velocidade */}
      <motion.div 
        className="text-center p-3 bg-muted/30 rounded-lg cursor-pointer"
        whileHover={{ scale: 1.05, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
        whileTap={{ scale: 0.95 }}
        onTap={() => {
          if (navigator.vibrate) navigator.vibrate(10);
        }}
      >
        <motion.div 
          className="flex items-center justify-center gap-1 mb-2"
          animate={data.speedKmh > 0 ? {
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <RiSpeedLine className="w-5 h-5 text-trucker-blue" />
          <span className="text-sm text-muted-foreground">Velocidade</span>
        </motion.div>
        <motion.div 
          className="text-2xl font-bold text-foreground"
          animate={data.speedKmh > 0 ? {
            color: ["#059669", "#3b82f6", "#059669"]
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {data.speedKmh}
        </motion.div>
        <div className="text-sm text-muted-foreground">km/h</div>
      </motion.div>
      
      {/* Precisão */}
      <motion.div 
        className="text-center p-3 bg-muted/30 rounded-lg cursor-pointer"
        whileHover={{ scale: 1.05, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
        whileTap={{ scale: 0.95 }}
        onTap={() => {
          if (navigator.vibrate) navigator.vibrate(10);
        }}
      >
        <div className="flex items-center justify-center gap-1 mb-2">
          <motion.div
            animate={data.accuracyStatus.value < 15 ? {
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FaSignal className={`w-5 h-5 ${data.accuracyStatus.color}`} />
          </motion.div>
          <span className="text-sm text-muted-foreground">Precisão GPS</span>
        </div>
        <motion.div 
          className={`text-2xl font-bold ${data.accuracyStatus.color}`}
          animate={data.accuracyStatus.showWarning ? {
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ±{data.accuracyStatus.value.toFixed(0)}m
        </motion.div>
        <div className="text-sm text-muted-foreground">
          {data.accuracyStatus.label}
        </div>
      </motion.div>
    </div>
    
    {/* Status de movimento com animação */}
    <motion.div 
      className={`p-3 rounded-lg ${data.movementStatus.color} cursor-pointer transition-all`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={data.movementStatus.animate ? {
        boxShadow: [
          "0 0 0 0 rgba(59, 130, 246, 0.4)",
          "0 0 0 10px rgba(59, 130, 246, 0)",
          "0 0 0 0 rgba(59, 130, 246, 0)"
        ]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="flex items-center gap-3">
        <motion.span 
          className="text-2xl"
          animate={data.movementStatus.animate ? {
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {data.movementStatus.icon}
        </motion.span>
        <div className="flex-1">
          <motion.div 
            className={`font-bold text-lg ${data.movementStatus.textColor}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {data.movementStatus.label}
          </motion.div>
          <motion.div 
            className={`text-sm ${data.movementStatus.textColor} opacity-80`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {data.movementStatus.description}
          </motion.div>
        </div>
        
        {/* Indicador visual de velocidade */}
        <div className="flex flex-col items-center gap-1">
          <motion.div
            className={`w-3 h-3 rounded-full ${
              data.speedKmh > 0 ? 'bg-green-500' : 'bg-gray-300'
            }`}
            animate={data.speedKmh > 0 ? {
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1]
            } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs font-mono text-muted-foreground">
            {data.speedKmh} km/h
          </span>
        </div>
      </div>
    </motion.div>
    
    {/* Informações expandidas */}
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          {/* Atividade detectada */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{data.activityStatus.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  Atividade: {data.activityStatus.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.activityStatus.description}
                </div>
              </div>
              <Badge variant={data.activityStatus.confidence === 'high' ? 'default' : 'secondary'}>
                {data.activityStatus.confidence === 'high' ? 'Alta' : 
                 data.activityStatus.confidence === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
            </div>
          </div>
          
          {/* Distância total e Bateria */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaRoute className="w-4 h-4 text-trucker-blue" />
                  <span className="text-sm font-medium text-foreground">Distância</span>
                </div>
                <span className="text-lg font-bold text-trucker-blue">
                  {data.totalDistanceKm} km
                </span>
              </div>
            </div>
            
            {/* Bateria (discreta) */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiBattery2ChargeLine className={`w-4 h-4 ${data.batteryStatus.color}`} />
                  <span className="text-sm font-medium text-foreground">Bateria</span>
                </div>
                <span className={`text-lg font-bold ${data.batteryStatus.color}`}>
                  {data.batteryStatus.level}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Coordenadas */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MdLocationOn className="w-4 h-4 text-trucker-blue" />
                <span className="font-medium text-foreground">Coordenadas</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {data.coordinatesText}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    
    {/* Botão para expandir/recolher */}
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggleExpanded}
      className="w-full"
    >
      <FaInfoCircle className="w-4 h-4 mr-2" />
      {isExpanded ? 'Menos Detalhes' : 'Mais Detalhes'}
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        className="ml-2"
      >
        ▼
      </motion.div>
    </Button>
  </div>
);

// Componente para ações com animações aprimoradas
const TrackerActions: React.FC<{
  onViewFullMap: () => void;
  onViewRoute: () => void;
  onShare: () => void;
  canShare: boolean;
}> = ({ onViewFullMap, onViewRoute, onShare, canShare }) => (
  <div className="grid grid-cols-3 gap-3">
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate([5, 50, 5]);
          onViewRoute();
        }}
        className="w-full flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <MdDirections className="w-4 h-4" />
        </motion.div>
        <span className="font-medium">Rota</span>
      </Button>
    </motion.div>
    
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate([5, 50, 5]);
          onViewFullMap();
        }}
        className="w-full flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <IoMdExpand className="w-4 h-4" />
        </motion.div>
        <span className="font-medium">Mapa</span>
      </Button>
    </motion.div>
    
    <motion.div
      whileHover={{ scale: canShare ? 1.05 : 1 }}
      whileTap={{ scale: canShare ? 0.95 : 1 }}
    >
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate([5, 50, 5]);
          onShare();
        }}
        disabled={!canShare}
        className={`w-full flex items-center gap-2 transition-all ${
          canShare 
            ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-200' 
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <motion.div
          animate={canShare ? { 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1] 
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <FaShareAlt className="w-4 h-4" />
        </motion.div>
        <span className="font-medium">Compartilhar</span>
      </Button>
    </motion.div>
  </div>
);

// Componente principal
export const SaoCristovaoTracker = () => {
  const navigate = useNavigate();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { 
    data, 
    isLoading, 
    isError, 
    forceRefresh, 
    isFetching,
    hasValidData,
    needsAttention,
    isRealtime 
  } = useTraccarData();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

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

  const handleShare = async () => {
    if (!data || !hasValidData) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Localização do São Cristóvão',
          text: `São Cristóvão está em ${data.movementStatus.label} - ${data.coordinatesText}`,
          url: `https://maps.google.com/maps?q=${data.latitude},${data.longitude}`
        });
      } else {
        // Fallback para copiar para clipboard
        const text = `São Cristóvão - ${data.movementStatus.label}\nLocalização: ${data.coordinatesText}\nVer no mapa: https://maps.google.com/maps?q=${data.latitude},${data.longitude}`;
        await navigator.clipboard.writeText(text);
        // TODO: Mostrar toast de sucesso
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  // Handlers para pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPulling && window.scrollY === 0) {
      const touch = e.touches[0];
      const distance = Math.max(0, touch.clientY - 100); // 100px offset
      setPullDistance(Math.min(distance, 120)); // Max 120px pull
    }
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      if (pullDistance > 80) {
        // Trigger refresh
        if (navigator.vibrate) navigator.vibrate([10, 100, 10]);
        forceRefresh();
      }
      
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  return (
    <ErrorBoundary fallback={TrackerErrorFallback}>
      <section className="px-4 py-6" aria-labelledby="tracker-section" ref={ref}>
        <div className="flex items-center gap-2 mb-4">
          <FaMapMarkedAlt className="w-5 h-5 text-trucker-blue" aria-hidden="true" />
          <h2 id="tracker-section" className="text-lg font-bold text-foreground">
            São Cristóvão em Movimento
          </h2>
          {needsAttention && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <MdWarning className="w-3 h-3 mr-1" />
              Atenção
            </Badge>
          )}
        </div>

        {(isLoading && !data) ? (
          <TrackerSkeleton />
        ) : (isError && !data) ? (
          <TrackerError onRetry={forceRefresh} isRetrying={isFetching} />
        ) : data ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateY(${pullDistance * 0.5}px)`,
              transition: isPulling ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            {/* Pull-to-refresh indicator */}
            <AnimatePresence>
              {isPulling && pullDistance > 20 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex justify-center mb-2"
                >
                  <div className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${pullDistance > 80 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }
                  `}>
                    <motion.div
                      animate={{ rotate: pullDistance > 80 ? 360 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-1"
                    >
                      <IoMdRefresh className="w-3 h-3" />
                      {pullDistance > 80 ? 'Solte para atualizar' : 'Puxe para atualizar'}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Card className="p-4 space-y-4 shadow-lg border-primary/10 bg-gradient-to-br from-card to-card/50 relative overflow-hidden">
              {/* Loading overlay */}
              <AnimatePresence>
                {isFetching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg shadow-md">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <IoMdRefresh className="w-5 h-5 text-trucker-blue" />
                      </motion.div>
                      <span className="text-sm font-medium">Atualizando...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Header com status */}
              <TrackerHeader
                connectionStatus={data.connectionStatus}
                movementStatus={data.movementStatus}
                isRealtime={isRealtime}
                onRefresh={forceRefresh}
                isRefreshing={isFetching}
              />

              {/* Mapa adaptativo com altura dinâmica e indicadores visuais */}
              <motion.div 
                className={`rounded-lg overflow-hidden border-2 transition-all duration-500 ${
                  data.isInMotion 
                    ? 'border-green-400 shadow-lg shadow-green-400/20' 
                    : 'border-blue-200 shadow-md'
                }`}
                animate={{ 
                  height: data.isInMotion ? 200 : 140, // Maior se em movimento
                  scale: data.isInMotion ? 1.02 : 1
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {/* Header do mapa */}
                <div className={`px-3 py-2 text-xs font-medium flex items-center justify-between ${
                  data.isInMotion 
                    ? 'bg-green-50 text-green-800 border-b border-green-200' 
                    : 'bg-blue-50 text-blue-800 border-b border-blue-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={data.isInMotion ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 360]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {data.isInMotion ? '🚛' : '🅿️'}
                    </motion.div>
                    <span>
                      {data.isInMotion ? 'São Cristóvão em Movimento' : 'São Cristóvão Parado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        data.isInMotion ? 'bg-green-500' : 'bg-blue-400'
                      }`}
                      animate={data.isInMotion ? {
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.5, 1]
                      } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-xs">
                      {data.isInMotion ? `${data.speedKmh} km/h` : 'Velocidade 0'}
                    </span>
                  </div>
                </div>
                
                {/* Mapa */}
                <div className="h-full">
                  <AdaptiveMapRenderer
                    data={data}
                    height="h-full"
                    showSpeed={false} // Removido pois já mostramos acima
                    adaptive={true}
                  />
                </div>
              </motion.div>

              {/* Detalhes do tracker */}
              <TrackerDetails
                data={data}
                isExpanded={isExpanded}
                onToggleExpanded={() => setIsExpanded(!isExpanded)}
              />

              {/* Ações */}
              <TrackerActions
                onViewFullMap={handleFullTrajectoryClick}
                onViewRoute={handleRealtimeMapClick}
                onShare={handleShare}
                canShare={hasValidData}
              />
              
              {/* Success indicator */}
              <AnimatePresence>
                {data && !isFetching && !isLoading && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="absolute top-2 right-2 z-20"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 2, repeat: 2 }}
                      className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span className="text-white text-sm">✓</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ) : null}
        
        {/* Métricas de debug (apenas em desenvolvimento) */}
        <TrackerMetrics showOnlyInDev={true} />
      </section>
    </ErrorBoundary>
  );
};
