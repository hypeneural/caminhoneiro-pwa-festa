import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, MapPin, Video, Bell, Share2, X, Church, Coffee, Truck, Gift, Music, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Event, getEventsByDay, getNextEvent, getEventStatus, getEventTypeConfig } from "@/data/programacao";
import { useCountdown } from "@/hooks/useCountdown";

// Componente de ícone dinâmico
const DynamicIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
  const icons = {
    Church,
    Coffee, 
    Truck,
    Gift,
    Music,
    Utensils,
    Calendar,
    Clock,
    MapPin
  } as const;
  
  const Icon = icons[iconName as keyof typeof icons] || Calendar;
  return <Icon className={className} />;
};

export const ProgramPreview = () => {
  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>('saturday'); // Aba padrão é sábado
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  const getCurrentEvents = () => {
    return getEventsByDay(selectedDay);
  };

  const nextEvent = getNextEvent();
  const countdown = useCountdown(nextEvent?.date || new Date());

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleShare = async (event: Event) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `${event.title} - ${event.time} em ${event.location}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      toast({
        title: "Link copiado!",
        description: "O link do evento foi copiado para a área de transferência."
      });
    }
  };

  const handleReminder = (event: Event) => {
    toast({
      title: "Lembrete criado!",
      description: `Você será notificado 15 minutos antes de "${event.title}".`
    });
  };

  const upcomingEvents = getCurrentEvents().slice(0, 4);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-4 py-6 bg-gradient-to-b from-background to-muted/20"
      >
        {/* Header with Live Clock */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/90 to-primary rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Programação
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {currentTime.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary font-medium">
            {getCurrentEvents().length} eventos
          </Badge>
        </div>

        {/* Native Day Toggle */}
        <div className="relative bg-muted/50 backdrop-blur rounded-2xl p-1 mb-6 shadow-inner">
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

        {/* Hero Event Card with Real-time Countdown */}
        {nextEvent && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card 
              className={`relative overflow-hidden border-0 shadow-xl bg-gradient-to-br ${getEventTypeConfig(nextEvent.event.type).gradient} backdrop-blur-sm cursor-pointer hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]`}
              onClick={() => handleEventClick(nextEvent.event)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge 
                    className={`${getEventTypeConfig(nextEvent.event.type).color} font-semibold px-3 py-1 text-xs`}
                    variant="secondary"
                  >
                    {getEventStatus(nextEvent.event) === 'current' ? '🔴 AO VIVO' : '⏰ PRÓXIMO'}
                  </Badge>
                  <div className="flex gap-2">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center"
                    >
                      <DynamicIcon iconName={nextEvent.event.icon} className="w-5 h-5 text-primary" />
                    </motion.div>
                    {nextEvent.event.hasCamera && (
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                        <Video className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                    {nextEvent.event.hasRoute && (
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-black bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                      {nextEvent.event.time}
                    </div>
                    {countdown.isActive && !countdown.isPast && (
                      <div className="text-xs font-medium text-muted-foreground mt-1 bg-muted/50 rounded-full px-2 py-1">
                        {countdown.days > 0 ? `${countdown.days}d ` : ''}
                        {countdown.hours}h {countdown.minutes}m
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2">
                      {nextEvent.event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{nextEvent.event.location}</span>
                    </div>
                    {nextEvent.event.description && (
                      <p className="text-sm text-muted-foreground/80 line-clamp-2">
                        {nextEvent.event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Mini Events Timeline */}
        <div className="space-y-3 mb-6">
          {upcomingEvents.slice(1, 4).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            >
              <Card 
                className="group relative bg-background/60 backdrop-blur-sm border-muted/50 hover:bg-background/80 hover:border-muted hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.98]"
                onClick={() => handleEventClick(event)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center"
                    >
                      <DynamicIcon iconName={event.icon} className="w-5 h-5 text-primary" />
                    </motion.div>
                    
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {event.time}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.duration ? `${event.duration}min` : ''}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      <Badge 
                        className={`${getEventTypeConfig(event.type).color} text-xs`}
                        variant="secondary"
                      >
                        {event.location}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      {event.hasCamera && (
                        <Video className="w-4 h-4 text-red-500" />
                      )}
                      {event.hasRoute && (
                        <MapPin className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Enhanced CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link to="/programacao">
            <Button className="w-full h-14 bg-gradient-to-r from-primary via-primary to-primary/90 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-2xl font-bold text-base">
              <Calendar className="w-5 h-5 mr-3" />
              <span>Ver Programação Completa</span>
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent 
              className="max-w-sm mx-auto bottom-0 top-auto translate-y-0 rounded-t-3xl border-0 p-0 gap-0"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="relative"
              >
                {/* Modal Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-muted rounded-full" />
                </div>

                <div className="p-6 space-y-4">
                  <DialogHeader className="text-left space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge 
                        className={`${getEventTypeConfig(selectedEvent.type).color} font-semibold`}
                        variant="secondary"
                      >
                        {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                      </Badge>
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        aria-label="Fechar detalhes do evento"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <DialogTitle className="text-xl font-bold leading-tight">
                      {selectedEvent.title}
                    </DialogTitle>
                    <DialogDescription>
                      Detalhes do evento {selectedEvent.title}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold">{selectedEvent.time}</div>
                        <div className="text-sm text-muted-foreground">
                          Duração: {selectedEvent.duration || 120} minutos
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold">{selectedEvent.location}</div>
                        <div className="text-sm text-muted-foreground">Local do evento</div>
                      </div>
                    </div>

                    {selectedEvent.description && (
                      <div className="p-3 bg-muted/50 rounded-xl">
                        <p className="text-sm leading-relaxed">{selectedEvent.description}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReminder(selectedEvent)}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Lembrete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleShare(selectedEvent)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>

                    {(selectedEvent.hasCamera || selectedEvent.hasRoute) && (
                      <div className="flex gap-3">
                        {selectedEvent.hasCamera && (
                          <Link to="/cameras" className="flex-1">
                            <Button variant="default" size="sm" className="w-full">
                              <Video className="w-4 h-4 mr-2" />
                              Ver Câmera
                            </Button>
                          </Link>
                        )}
                        {selectedEvent.hasRoute && (
                          <Link to="/mapa" className="flex-1">
                            <Button variant="default" size="sm" className="w-full">
                              <MapPin className="w-4 h-4 mr-2" />
                              Ver Rota
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};