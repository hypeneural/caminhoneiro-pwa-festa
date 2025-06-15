import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Route, Share2, Calendar, ChevronDown, Camera, ExternalLink } from 'lucide-react';
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
      case 'religioso': return 'bg-trucker-yellow/10 text-trucker-yellow border-trucker-yellow';
      case 'procissao': return 'bg-trucker-blue/10 text-trucker-blue border-trucker-blue';
      case 'entretenimento': return 'bg-trucker-red/10 text-trucker-red border-trucker-red';
      case 'alimentacao': return 'bg-trucker-green/10 text-trucker-green border-trucker-green';
      default: return 'bg-trucker-orange/10 text-trucker-orange border-trucker-orange';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'past': return 'opacity-60';
      case 'current': return 'ring-2 ring-trucker-green';
      case 'upcoming': return '';
    }
  };

  const shareEvent = async () => {
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
      // Fallback para copiar link
      navigator.clipboard.writeText(`${event.title} - ${event.time} em ${event.location}`);
      toast({
        title: "Link copiado!",
        description: "Informações do evento copiadas para a área de transferência.",
      });
    }
  };

  const addToCalendar = () => {
    const eventDate = new Date(`2025-07-${event.date.includes('19') ? '19' : '20'}T${event.time}:00`);
    const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.address || event.location)}`;
    
    window.open(calendarUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={`overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${getStatusColor()}`}>
        {/* Timeline connector */}
        <div className="relative">
          {index > 0 && (
            <div className="absolute -top-4 left-8 w-0.5 h-4 bg-border" />
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Time Circle */}
            <div className="flex flex-col items-center min-w-[60px]">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                status === 'current' ? 'bg-trucker-green animate-pulse' :
                status === 'past' ? 'bg-muted' : 'bg-trucker-blue'
              }`}>
                <Clock className={`w-5 h-5 ${
                  status === 'current' ? 'text-trucker-green-foreground' :
                  status === 'past' ? 'text-muted-foreground' : 'text-trucker-blue-foreground'
                }`} />
              </div>
              <span className={`text-sm font-bold mt-1 ${
                status === 'current' ? 'text-trucker-green' :
                status === 'past' ? 'text-muted-foreground' : 'text-trucker-blue'
              }`}>
                {event.time}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-card-foreground leading-tight pr-2">
                  {event.title}
                </h3>
                <div className="flex gap-2">
                  {event.isLive && (
                    <Badge className="bg-trucker-red text-trucker-red-foreground animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-1" />
                      AO VIVO
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getTypeColor(event.type)}`}
                  >
                    {event.type}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                <MapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>

              {/* Status indicator */}
              {status === 'current' && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-trucker-green rounded-full animate-pulse" />
                  <span className="text-xs text-trucker-green font-medium">
                    Acontecendo agora
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {event.hasRoute && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/rota-completa')}
                    className="text-xs"
                  >
                    <Route className="w-3 h-3 mr-1" />
                    Ver Rota
                  </Button>
                )}
                
                {event.hasCamera && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/cameras')}
                    className="text-xs"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    Câmera
                  </Button>
                )}

                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={shareEvent}
                  className="text-xs"
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  Compartilhar
                </Button>

                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={addToCalendar}
                  className="text-xs"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>

                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs ml-auto"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {/* Expandable content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 mt-3 border-t border-border">
                      {event.address && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-foreground mb-1">Endereço completo:</p>
                          <p className="text-xs text-muted-foreground">{event.address}</p>
                        </div>
                      )}
                      
                      {event.description && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-foreground mb-1">Detalhes:</p>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      )}

                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(event.address || event.location)}`, '_blank')}
                        className="text-xs w-full"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Abrir no Google Maps
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};