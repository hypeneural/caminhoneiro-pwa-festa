import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Map as MapIcon, 
  Navigation, 
  MapPin, 
  Clock, 
  Route, 
  Share2, 
  RefreshCw,
  Calendar,
  MapPinned,
  Truck,
  Church,
  Music,
  Coffee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { TrackerError } from "@/components/tracker/TrackerError";
import { TrackerSkeleton } from "@/components/ui/skeleton";
import { TrackerMetrics } from "@/components/tracker/TrackerMetrics";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useTraccarData } from "@/hooks/useTraccarData";
import EnhancedProcissaoMap from "@/components/map/EnhancedProcissaoMap";
import { 
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
  RiSpeedLine
} from 'react-icons/ri';

// Cronograma da procissão
const PROCESSION_SCHEDULE = [
  {
    id: 'saida',
    time: '09:00',
    title: 'Saída da Capela Santa Terezinha',
    description: 'Início da procissão em honra a São Cristóvão',
    icon: Church,
    status: 'completed' as const,
    location: 'Capela Santa Terezinha'
  },
  {
    id: 'retorno_benca',
    time: '11:00', 
    title: 'Retorno na Capela para Bênção',
    description: 'Bênção dos veículos e almoço festivo',
    icon: MapPinned,
    status: 'current' as const,
    location: 'Capela Santa Terezinha'
  },
  {
    id: 'show',
    time: '15:00',
    title: 'Show com Alciney e Sandro',
    description: 'Apresentação musical especial',
    icon: Music,
    status: 'upcoming' as const,
    location: 'Praça do Evento'
  }
];

// Componente de cronograma
const ProcessionSchedule: React.FC<{ data?: any }> = ({ data }) => {
  const getCurrentScheduleItem = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    return PROCESSION_SCHEDULE.map(item => {
      const [hour, minute] = item.time.split(':').map(Number);
      const itemTimeInMinutes = hour * 60 + minute;
      
      let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
      
      if (currentTimeInMinutes > itemTimeInMinutes + 120) { // +2h buffer
        status = 'completed';
      } else if (currentTimeInMinutes >= itemTimeInMinutes - 30 && currentTimeInMinutes <= itemTimeInMinutes + 120) {
        status = 'current';
      }
      
      return { ...item, status };
    });
  };

  const scheduleItems = getCurrentScheduleItem();
  
  return (
    <Card className="p-4 shadow-lg bg-gradient-to-br from-card to-card/50">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-trucker-blue" />
        <h3 className="font-bold text-card-foreground">Cronograma da Procissão</h3>
      </div>
      
      <div className="space-y-3">
        {scheduleItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.status === 'current';
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-trucker-blue/10 border border-trucker-blue/20' 
                  : 'bg-muted/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                item.status === 'completed' ? 'bg-green-100 text-green-600' :
                item.status === 'current' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{item.time}</span>
                  <span className="text-sm font-medium">{item.title}</span>
                  {isActive && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge variant="destructive" className="text-xs">
                        AGORA
                      </Badge>
                    </motion.div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                <p className="text-xs text-trucker-blue font-medium">{item.location}</p>
              </div>
              
              <div className={`w-3 h-3 rounded-full ${
                item.status === 'completed' ? 'bg-green-500' :
                item.status === 'current' ? 'bg-blue-500 animate-pulse' :
                'bg-gray-300'
              }`} />
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};

// Componente de localização atual com dados reais
const CurrentLocationCard: React.FC<{ data: any }> = ({ data }) => (
  <Card className="p-4 shadow-lg bg-gradient-to-br from-card to-card/50">
    <div className="flex items-center gap-2 mb-3">
      <MdLocationOn className="w-5 h-5 text-trucker-red" />
      <h3 className="font-bold text-card-foreground">São Cristóvão - Localização Atual</h3>
    </div>
    
    <div className="space-y-3">
      {/* Coordenadas */}
      <div className="bg-muted/30 rounded-lg p-3">
        <div className="text-sm font-mono text-foreground">
          {data.coordinatesText}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {data.address || 'Aguardando endereço...'}
        </div>
      </div>
      
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant={data.isInMotion ? "default" : "outline"}
            className={data.isInMotion ? "bg-trucker-green" : ""}
          >
            <motion.div
              animate={data.isInMotion ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center gap-1"
            >
              {data.isInMotion ? <RiTruckFill className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {data.movementStatus.label}
            </motion.div>
          </Badge>
          
          <Badge variant="outline" className="text-xs">
            {data.speedKmh} km/h
          </Badge>
        </div>
        
        <span className="text-xs text-muted-foreground">
          Atualizado {data.connectionStatus.lastUpdate}
        </span>
      </div>
      
      {/* Informações adicionais */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-muted-foreground">Precisão GPS</div>
          <div className={`font-bold ${data.accuracyStatus.color}`}>
            ±{data.accuracyStatus.value.toFixed(0)}m
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-muted-foreground">Bateria</div>
          <div className={`font-bold ${data.batteryStatus.color}`}>
            {data.batteryStatus.level}%
          </div>
        </div>
      </div>
    </div>
  </Card>
);

// Componente principal da página
const Map = () => {
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
  
  const [mapHeight, setMapHeight] = useState<'normal' | 'expanded'>('normal');

  const handleShare = async () => {
    if (!data || !hasValidData) return;
    
    try {
      const shareData = {
        title: 'Procissão de São Cristóvão - Localização Atual',
        text: `São Cristóvão está ${data.movementStatus.label} - ${data.coordinatesText}`,
        url: `https://maps.google.com/maps?q=${data.latitude},${data.longitude}`
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\nVer no mapa: ${shareData.url}`
        );
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header aprimorado */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur border-b border-border/50 px-4 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
            <MapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Mapa da Procissão</h1>
            {data && (
              <p className="text-xs text-muted-foreground">
                São Cristóvão {data.isInMotion ? 'em movimento' : 'parado'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {data && (
            <Badge 
              variant={isRealtime ? "destructive" : "outline"}
              className={isRealtime ? "animate-pulse" : ""}
            >
              {isRealtime ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-1"
                >
                  <MdGpsFixed className="w-3 h-3" />
                  AO VIVO
                </motion.div>
              ) : (
                <>
                  <MdGpsOff className="w-3 h-3" />
                  OFFLINE
                </>
              )}
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={forceRefresh}
            disabled={isFetching}
            className="h-8 w-8 p-0"
          >
            <IoMdRefresh className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="pt-16 pb-20">
        <ErrorBoundary fallback={({ error }) => (
          <TrackerError onRetry={forceRefresh} isRetrying={isFetching} />
        )}>
          {(isLoading && !data) ? (
            <TrackerSkeleton />
          ) : (isError && !data) ? (
            <TrackerError onRetry={forceRefresh} isRetrying={isFetching} />
          ) : data ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Mapa aprimorado */}
              <motion.div
                className="relative"
                animate={{ 
                  height: mapHeight === 'expanded' ? '70vh' : '50vh' 
                }}
                transition={{ duration: 0.5 }}
              >
                <EnhancedProcissaoMap 
                  trackerData={data}
                  height={mapHeight === 'expanded' ? 'h-[70vh]' : 'h-[50vh]'}
                />
                
                {/* Controles do mapa */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setMapHeight(mapHeight === 'normal' ? 'expanded' : 'normal')}
                    className="bg-background/80 backdrop-blur-sm"
                  >
                    <IoMdExpand className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleShare}
                    disabled={!hasValidData}
                    className="bg-background/80 backdrop-blur-sm"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Cards de informações */}
              <div className="px-4 space-y-4">
                {/* Localização atual */}
                <CurrentLocationCard data={data} />
                
                {/* Cronograma */}
                <ProcessionSchedule data={data} />
                
                {/* Navegação rápida */}
                <Card className="p-4 shadow-lg">
                  <h3 className="font-bold text-card-foreground mb-3">Navegação Rápida</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-12 gap-2"
                      onClick={() => window.open(`https://maps.google.com/maps?q=${data.latitude},${data.longitude}`, '_blank')}
                    >
                      <MdDirections className="w-4 h-4" />
                      Google Maps
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-12 gap-2"
                      onClick={() => window.open(`/rota-completa`, '_self')}
                    >
                      <Route className="w-4 h-4" />
                      Rota Completa
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>
          ) : (
            <div className="p-4">
              <TrackerError onRetry={forceRefresh} isRetrying={isFetching} />
            </div>
          )}
        </ErrorBoundary>
        
        {/* Métricas de debug */}
        <TrackerMetrics showOnlyInDev={true} />
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Map;