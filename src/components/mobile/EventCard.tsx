import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Route, Share2, Calendar, Camera, ExternalLink, Navigation, Zap, Users, Car, Truck, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface EventCardProps {
  event: {
    id: number;
    time: string;
    title: string;
    location: string;
    address?: string;
    type: string;
    date: string;
    description?: string;
    isLive?: boolean;
    hasRoute?: boolean;
    hasCamera?: boolean;
  };
  index: number;
  status: 'past' | 'current' | 'upcoming';
}

export const EventCard: React.FC<EventCardProps> = ({ event, index, status }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'religioso': return 'bg-trucker-yellow/20 text-trucker-yellow border-trucker-yellow/30 backdrop-blur-sm';
      case 'procissao': return 'bg-trucker-blue/20 text-trucker-blue border-trucker-blue/30 backdrop-blur-sm';
      case 'entretenimento': return 'bg-trucker-red/20 text-trucker-red border-trucker-red/30 backdrop-blur-sm';
      case 'alimentacao': return 'bg-trucker-green/20 text-trucker-green border-trucker-green/30 backdrop-blur-sm';
      default: return 'bg-trucker-orange/20 text-trucker-orange border-trucker-orange/30 backdrop-blur-sm';
    }
  };

  const getGradientColor = () => {
    switch (status) {
      case 'past': 
        return 'from-muted/50 to-muted/20';
      case 'current': 
        return 'from-trucker-green/20 via-trucker-green/10 to-transparent';
      case 'upcoming': 
        return 'from-trucker-blue/10 via-primary/5 to-transparent';
    }
  };

  const shareEvent = async () => {
    // Simulate haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    const shareData = {
      title: event.title,
      text: `${event.title} - ${event.time} em ${event.location}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      navigator.clipboard.writeText(`${event.title} - ${event.time} em ${event.location}`);
      toast({
        title: "📋 Link copiado!",
        description: "Informações do evento copiadas para a área de transferência.",
      });
    }
  };

  const addToCalendar = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    const eventDate = new Date(`2025-07-${event.date.includes('19') ? '19' : '20'}T${event.time}:00`);
    const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.address || event.location)}`;
    
    window.open(calendarUrl, '_blank');
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    setIsExpanded(!isExpanded);
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    }
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={handleCardClick}
      className="cursor-pointer"
    >
      {/* Timeline connector */}
      <div className="relative">
        {index > 0 && (
          <motion.div 
            className="absolute -top-6 left-8 w-0.5 h-6 bg-gradient-to-b from-border to-transparent"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
          />
        )}
      </div>

      <Card className={`
        relative overflow-hidden backdrop-blur-md border-0 min-h-[200px]
        bg-gradient-to-br ${getGradientColor()}
        shadow-lg hover:shadow-2xl 
        transition-all duration-500 ease-out
        ${status === 'current' ? 'ring-2 ring-trucker-green/50 shadow-trucker-green/20' : ''}
        ${status === 'past' ? 'opacity-75' : ''}
      `}>
        {/* Glass overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
        
        {/* Animated gradient border for current event */}
        {status === 'current' && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'linear-gradient(45deg, transparent, rgba(34, 197, 94, 0.3), transparent)',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        )}

        <div className="relative p-6 flex flex-col h-full">
          <div className="flex items-start gap-4 mb-6">
            {/* Enhanced Time Circle */}
            <div className="flex flex-col items-center min-w-[80px]">
              <motion.div 
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center relative
                  ${status === 'current' 
                    ? 'bg-gradient-to-br from-trucker-green to-trucker-green/80 shadow-lg shadow-trucker-green/30' 
                    : status === 'past' 
                    ? 'bg-gradient-to-br from-muted to-muted/60' 
                    : 'bg-gradient-to-br from-trucker-blue to-trucker-blue/80 shadow-lg shadow-trucker-blue/20'
                  }
                `}
                animate={status === 'current' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {status === 'current' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-trucker-green/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <Clock className={`w-7 h-7 ${
                  status === 'current' ? 'text-trucker-green-foreground' :
                  status === 'past' ? 'text-muted-foreground' : 'text-trucker-blue-foreground'
                }`} />
              </motion.div>
              <span className={`text-base font-bold mt-3 ${
                status === 'current' ? 'text-trucker-green' :
                status === 'past' ? 'text-muted-foreground' : 'text-trucker-blue'
              }`}>
                {event.time}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <motion.h3 
                  className="font-bold text-card-foreground leading-tight pr-2 text-xl"
                  layout
                >
                  {event.title}
                </motion.h3>
                <div className="flex gap-2 flex-shrink-0">
                  {event.isLive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Badge className="bg-gradient-to-r from-trucker-red to-red-600 text-white border-0 shadow-lg">
                        <motion.div 
                          className="w-2 h-2 bg-white rounded-full mr-1"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        AO VIVO
                      </Badge>
                    </motion.div>
                  )}
                  <Badge 
                    variant="outline" 
                    className={`text-sm font-medium ${getTypeColor(event.type)}`}
                  >
                    {event.type}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-muted-foreground text-base mb-6">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>

              {/* Status indicator */}
              {status === 'current' && (
                <motion.div 
                  className="flex items-center gap-2 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div 
                    className="w-3 h-3 bg-trucker-green rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-base text-trucker-green font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Acontecendo agora
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Action buttons section - moved to bottom and full width */}
          <div className="mt-auto">
            <div className="bg-background/30 backdrop-blur-sm rounded-xl p-4 border border-border/20">
              <div className="grid grid-cols-2 gap-3">
                {event.hasRoute && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      size="default" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.vibrate) navigator.vibrate(50);
                        navigate('/rota-completa');
                      }}
                      className="w-full h-12 bg-background/50 hover:bg-trucker-blue/10 border-trucker-blue/30 text-sm font-medium"
                    >
                      <Route className="w-4 h-4 mr-2" />
                      Ver Rota
                    </Button>
                  </motion.div>
                )}
                
                {event.hasCamera && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      size="default" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.vibrate) navigator.vibrate(50);
                        navigate('/cameras');
                      }}
                      className="w-full h-12 bg-background/50 hover:bg-trucker-red/10 border-trucker-red/30 text-sm font-medium"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Câmera
                    </Button>
                  </motion.div>
                )}

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="default" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareEvent();
                    }}
                    className="w-full h-12 bg-background/50 hover:bg-background/70 border-border/30 text-sm font-medium"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="default" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCalendar();
                    }}
                    className="w-full h-12 bg-background/50 hover:bg-background/70 border-border/30 text-sm font-medium"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Expandable content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  opacity: { duration: 0.2 }
                }}
                className="overflow-hidden mt-4"
              >
                <motion.div 
                  className="pt-4 border-t border-border/30 space-y-4"
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {event.address && (
                    <div className="bg-background/30 backdrop-blur-sm rounded-lg p-3">
                      <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        Endereço completo:
                      </p>
                      <p className="text-sm text-muted-foreground">{event.address}</p>
                    </div>
                  )}
                  
                  {event.description && (
                    <div className="bg-background/30 backdrop-blur-sm rounded-lg p-3">
                      <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        Detalhes:
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.vibrate) navigator.vibrate(50);
                        window.open(`https://maps.google.com/?q=${encodeURIComponent(event.address || event.location)}`, '_blank');
                      }}
                      className="w-full bg-background/50 hover:bg-trucker-blue/10 border-trucker-blue/30"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir no Google Maps
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Tap indicator */}
          <motion.div 
            className="text-center mt-3 text-xs text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {!isExpanded ? '👆 Toque para ver detalhes' : '👆 Toque para fechar'}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};