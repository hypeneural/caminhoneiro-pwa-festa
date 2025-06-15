import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, MapPin, Radio, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Event {
  id: number;
  time: string;
  title: string;
  location: string;
  type: string;
  date: string;
  hasCamera?: boolean;
  hasRoute?: boolean;
  isLive?: boolean;
}

const saturdayEvents = [
  {
    id: 1,
    time: "18:00",
    title: "Missa dos Festeiros",
    location: "Capela Santa Teresinha",
    type: "religioso",
    date: "19/07/2025",
    hasCamera: true,
    hasRoute: false
  }
];

const sundayEvents = [
  {
    id: 2,
    time: "09:00",
    title: "Procissão Automotiva",
    location: "Capela Santa Teresinha",
    type: "procissao",
    date: "20/07/2025",
    hasRoute: true,
    hasCamera: true,
    isLive: false
  },
  {
    id: 3,
    time: "11:00",
    title: "Entrega do Kit Festeiro",
    location: "Área Central do Evento",
    type: "alimentacao",
    date: "20/07/2025",
    hasCamera: false,
    hasRoute: false
  },
  {
    id: 4,
    time: "11:00",
    title: "Almoço Festivo",
    location: "Área de Alimentação",
    type: "alimentacao",
    date: "20/07/2025",
    hasCamera: false,
    hasRoute: false
  },
  {
    id: 5,
    time: "15:00",
    title: "Tarde Dançante com Banda Duetou",
    location: "Palco Principal",
    type: "entretenimento",
    date: "20/07/2025",
    hasCamera: true,
    hasRoute: false
  }
];

export const ProgramPreview = () => {
  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>('sunday');

  const getCurrentEvents = () => {
    return selectedDay === 'saturday' ? saturdayEvents : sundayEvents;
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(`2025-07-${selectedDay === 'saturday' ? '19' : '20'}T${event.time}:00`);
    const eventEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    if (now < eventDate) return 'upcoming';
    if (now >= eventDate && now <= eventEnd) return 'current';
    return 'past';
  };

  const getNextEvent = () => {
    const events = getCurrentEvents();
    const now = new Date();
    
    for (const event of events) {
      const eventDate = new Date(`2025-07-${selectedDay === 'saturday' ? '19' : '20'}T${event.time}:00`);
      if (eventDate > now) {
        return { event, date: eventDate };
      }
    }
    return events[0] ? { event: events[0], date: new Date(`2025-07-${selectedDay === 'saturday' ? '19' : '20'}T${events[0].time}:00`) } : null;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'religioso': return 'text-trucker-blue bg-blue-50 dark:bg-blue-900/20';
      case 'procissao': return 'text-trucker-red bg-red-50 dark:bg-red-900/20';
      case 'alimentacao': return 'text-trucker-orange bg-orange-50 dark:bg-orange-900/20';
      case 'entretenimento': return 'text-trucker-green bg-green-50 dark:bg-green-900/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const nextEvent = getNextEvent();
  const upcomingEvents = getCurrentEvents().slice(0, 3);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-trucker-blue to-trucker-blue/80 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Programação de Hoje</h2>
            <p className="text-sm text-muted-foreground">
              {selectedDay === 'saturday' ? 'Sábado, 19 de Julho' : 'Domingo, 20 de Julho'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-trucker-blue border-trucker-blue/30 bg-trucker-blue/10">
          {getCurrentEvents().length} eventos
        </Badge>
      </div>

      {/* Day Toggle */}
      <div className="flex bg-muted rounded-lg p-1 mb-4">
        <button
          onClick={() => setSelectedDay('saturday')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            selectedDay === 'saturday'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sáb 19/07
        </button>
        <button
          onClick={() => setSelectedDay('sunday')}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            selectedDay === 'sunday'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Dom 20/07
        </button>
      </div>

      {/* Next Event Highlight */}
      {nextEvent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <Card className="p-4 bg-gradient-to-br from-trucker-blue/5 to-trucker-blue/10 border-trucker-blue/20">
            <div className="flex items-start justify-between mb-3">
              <Badge 
                className={`${getEventTypeColor(nextEvent.event.type)} font-medium`}
                variant="secondary"
              >
                {getEventStatus(nextEvent.event) === 'current' ? '🔴 Ao Vivo' : '⏰ Próximo'}
              </Badge>
              <div className="flex gap-1">
                {nextEvent.event.hasCamera && (
                  <Video className="w-4 h-4 text-trucker-red" />
                )}
                {nextEvent.event.hasRoute && (
                  <MapPin className="w-4 h-4 text-trucker-green" />
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-trucker-blue">{nextEvent.event.time}</div>
                <div className="text-xs text-muted-foreground">hoje</div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                  {nextEvent.event.title}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{nextEvent.event.location}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Upcoming Events */}
      <div className="space-y-3 mb-4">
        {upcomingEvents.slice(1, 4).map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="p-3 bg-background/50">
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[50px]">
                  <div className="text-sm font-medium text-foreground">{event.time}</div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground line-clamp-1 mb-1">
                    {event.title}
                  </h4>
                  <Badge 
                    className={`${getEventTypeColor(event.type)} text-xs`}
                    variant="secondary"
                  >
                    {event.location}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {event.hasCamera && (
                    <Video className="w-3 h-3 text-trucker-red opacity-60" />
                  )}
                  {event.hasRoute && (
                    <MapPin className="w-3 h-3 text-trucker-green opacity-60" />
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link to="/programacao">
          <Button className="w-full bg-gradient-to-r from-trucker-blue to-trucker-blue/90 hover:from-trucker-blue/90 hover:to-trucker-blue text-white">
            <span>Ver Programação Completa</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </motion.section>
  );
};