import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, RefreshCw, Thermometer, Users, Car, Trophy, Truck, Church, Coffee, Gift, Music, Utensils, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { CountdownBadge } from "@/components/mobile/CountdownBadge";
import { EventCard } from "@/components/mobile/EventCard";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { NavigationActions } from "@/components/ui/navigation-actions";
import { WeatherEventCard } from "@/components/weather/WeatherEventCard";
import { Event, getEventsByDay, getNextEvent, getEventStatus, getEventTypeConfig } from "@/data/programacao";
import { useCountdown } from "@/hooks/useCountdown";
import { useWeather } from "@/hooks/useWeather";

// Componente de ícone dinâmico
const DynamicIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  const icons = {
    Church,
    Coffee, 
    Truck,
    Gift,
    Music,
    Utensils,
    CalendarIcon,
    Clock
  } as const;
  
  const Icon = icons[iconName as keyof typeof icons] || CalendarIcon;
  return <Icon className={className} />;
};

const Schedule = () => {
  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>('saturday'); // Aba padrão é sábado
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { weather } = useWeather();

  const getCurrentEvents = () => {
    return getEventsByDay(selectedDay);
  };

  const nextEvent = getNextEvent();
  const countdown = useCountdown(nextEvent?.date || new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh with haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const handleDaySwipe = (direction: 'left' | 'right') => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    if (direction === 'right' && selectedDay === 'saturday') {
      setSelectedDay('sunday');
    } else if (direction === 'left' && selectedDay === 'sunday') {
      setSelectedDay('saturday');
    }
  };

  const nextEventData = nextEvent;

  return (
    <div className="min-h-screen bg-background">
      {/* Smart Header with Countdown */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-lg pt-safe"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Top section with countdown */}
        {nextEventData && (
          <div className="bg-gradient-to-r from-trucker-blue to-trucker-blue/80 text-trucker-blue-foreground px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Próximo: {nextEventData.event.title}</span>
              </div>
              <div className="text-xs font-medium bg-white/20 rounded-full px-2 py-1">
                {countdown.isActive && !countdown.isPast && (
                  <>
                    {countdown.days > 0 ? `${countdown.days}d ` : ''}
                    {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-trucker-blue-foreground" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Programação</h1>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-muted-foreground"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Day selector with tabs */}
          <div className="relative bg-muted/50 backdrop-blur rounded-2xl p-1">
            <div className="flex relative">
              <motion.div
                className="absolute inset-y-1 bg-background rounded-xl shadow-md"
                animate={{
                  x: selectedDay === 'saturday' ? 0 : '100%',
                  width: '50%'
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              <button
                onClick={() => setSelectedDay('saturday')}
                className={`relative z-10 flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  selectedDay === 'saturday'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sáb 19/07
              </button>
              <button
                onClick={() => setSelectedDay('sunday')}
                className={`relative z-10 flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  selectedDay === 'sunday'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dom 20/07
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <main className="pt-40 pb-20 px-4 min-h-screen">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: selectedDay === 'sunday' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: selectedDay === 'sunday' ? -20 : 20 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3 
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              const swipeThreshold = 50;
              if (info.offset.x > swipeThreshold) {
                handleDaySwipe('right');
              } else if (info.offset.x < -swipeThreshold) {
                handleDaySwipe('left');
              }
            }}
          >
            {/* Day title with enhanced design */}
            <motion.div 
              className="flex items-center justify-between mb-6 p-4 rounded-xl bg-gradient-to-r from-background/80 to-background/40 backdrop-blur-sm border border-border/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedDay === 'saturday' 
                      ? 'bg-gradient-to-br from-trucker-blue to-trucker-blue/80' 
                      : 'bg-gradient-to-br from-trucker-red to-trucker-red/80'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CalendarIcon className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedDay === 'saturday' ? 'Sábado' : 'Domingo'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedDay === 'saturday' ? '19 de Julho' : '20 de Julho'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${selectedDay === 'saturday' ? 'text-trucker-blue border-trucker-blue/30 bg-trucker-blue/10' : 'text-trucker-red border-trucker-red/30 bg-trucker-red/10'} backdrop-blur-sm`}
                >
                  {getCurrentEvents().length} eventos
                </Badge>
              </div>
            </motion.div>

            {/* Events timeline with enhanced design */}
            <div className="space-y-4 relative">
            {/* Enhanced timeline line */}
            <motion.div 
              className="absolute left-9 top-0 bottom-0 w-0.5 bg-gradient-to-b from-trucker-blue/50 via-border to-trucker-blue/50"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            
            <AnimatePresence mode="wait">
              {getCurrentEvents().map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative pl-16"
                >
                  {/* Timeline dot with icon */}
                  <motion.div
                    className={`absolute left-6 w-6 h-6 rounded-full border-2 border-background shadow-lg flex items-center justify-center ${
                      getEventStatus(event) === 'current' 
                        ? 'bg-green-500 animate-pulse' 
                        : getEventStatus(event) === 'past'
                        ? 'bg-muted'
                        : 'bg-primary'
                    }`}
                    whileHover={{ scale: 1.2 }}
                  >
                    <DynamicIcon iconName={event.icon} className="w-3 h-3 text-white" />
                  </motion.div>

                  <Card 
                    className={`relative overflow-hidden ${getEventTypeConfig(event.type).border} bg-gradient-to-br ${getEventTypeConfig(event.type).gradient} hover:shadow-lg transition-all duration-300 group cursor-pointer`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${getEventTypeConfig(event.type).color.replace('text-', 'bg-').replace(' bg-', '/20 text-')}`}
                          >
                            <DynamicIcon iconName={event.icon} className="w-6 h-6" />
                          </motion.div>
                          <div>
                            <div className="text-2xl font-bold text-foreground">{event.time}</div>
                            <Badge 
                              className={`${getEventTypeConfig(event.type).color} text-xs mt-1`}
                              variant="secondary"
                            >
                              {getEventStatus(event) === 'current' ? '🔴 AO VIVO' : 
                               getEventStatus(event) === 'past' ? '✅ FINALIZADO' : '⏰ PROGRAMADO'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {event.hasCamera && (
                            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                              <Video className="w-4 h-4 text-red-500" />
                            </div>
                          )}
                          {event.hasRoute && (
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                              <Car className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Car className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            </div>

            {/* Enhanced Info cards */}
            <motion.div 
              className="mt-8 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* Weather info with real API data */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {weather?.event && weather.event.length > 0 ? (
                  <WeatherEventCard 
                    eventWeather={weather.event} 
                    selectedDay={selectedDay}
                  />
                ) : (
                  <Card className="p-4 bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-blue-50/40 dark:from-blue-950/80 dark:via-blue-900/60 dark:to-blue-950/40 border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
                        whileHover={{ rotate: 10 }}
                      >
                        <Thermometer className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Previsão do Tempo
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Carregando previsão para o evento...
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>

              {/* Location info with better design */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="p-4 bg-gradient-to-br from-green-50/80 via-green-100/60 to-green-50/40 dark:from-green-950/80 dark:via-green-900/60 dark:to-green-950/40 border-green-200/50 dark:border-green-800/50 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: -10 }}
                    >
                      <span className="text-xl">📍</span>
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        Capela Santa Teresinha
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                        Local principal dos eventos
                      </p>
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <Car className="w-3 h-3" />
                        <span>Estacionamento disponível</span>
                      </div>
                    </div>
                    <NavigationActions 
                      coordinates={{
                        latitude: -27.24173,
                        longitude: -48.646721
                      }}
                      address="Capela Santa Teresinha, Rua Santa Teresinha, 123 - Centro, Tijucas - SC"
                      title="Como chegar na Capela"
                    >
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-green-300/50 text-green-700 hover:bg-green-100/50 backdrop-blur-sm"
                      >
                        Ver Mapa
                      </Button>
                    </NavigationActions>
                  </div>
                </Card>
              </motion.div>

              {/* Festeiros info card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="p-4 bg-gradient-to-br from-yellow-50/80 via-yellow-100/60 to-yellow-50/40 dark:from-yellow-950/80 dark:via-yellow-900/60 dark:to-yellow-950/40 border-yellow-200/50 dark:border-yellow-800/50 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"
                      whileHover={{ rotate: 15 }}
                    >
                      <Trophy className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                        44 Festeiros Participantes
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Este ano conta com 44 festeiros dedicados organizando o evento
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Vehicles info card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="p-4 bg-gradient-to-br from-purple-50/80 via-purple-100/60 to-purple-50/40 dark:from-purple-950/80 dark:via-purple-900/60 dark:to-purple-950/40 border-purple-200/50 dark:border-purple-800/50 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Truck className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        Mais de 500 Veículos na Carreata
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Esperados mais de 500 veículos participando da carreata dominical
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Attendance info */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="p-4 bg-gradient-to-br from-orange-50/80 via-orange-100/60 to-orange-50/40 dark:from-orange-950/80 dark:via-orange-900/60 dark:to-orange-950/40 border-orange-200/50 dark:border-orange-800/50 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                        Estimativa de Público
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {selectedDay === 'saturday' ? 'Cerca de 500 pessoas esperadas' : 'Mais de 2000 caminhoneiros + famílias'}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </main>
      </PullToRefresh>

      <BottomNavigation />
    </div>
  );
};

export default Schedule;