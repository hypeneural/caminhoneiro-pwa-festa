import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { CountdownBadge } from "@/components/mobile/CountdownBadge";
import { EventCard } from "@/components/mobile/EventCard";

const Schedule = () => {
  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>('saturday');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const saturdayEvents = [
    {
      id: 1,
      time: "18:00",
      title: "Missa dos Festeiros",
      location: "Capela Santa Teresinha",
      address: "Rua Santa Teresinha, 123 - Centro, Tijucas - SC",
      type: "religioso",
      date: "19/07/2025",
      description: "Missa especial dedicada aos festeiros e organizadores do evento.",
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
      address: "Rua Santa Teresinha, 123 - Centro, Tijucas - SC",
      type: "procissao",
      date: "20/07/2025",
      description: "Saída da capela com bênção dos veículos e caminhões.",
      hasRoute: true,
      hasCamera: true,
      isLive: false
    },
    {
      id: 3,
      time: "11:00",
      title: "Entrega do Kit Festeiro",
      location: "Área Central do Evento",
      address: "Praça Central - Centro, Tijucas - SC",
      type: "alimentacao",
      date: "20/07/2025",
      description: "Distribuição dos kits festeiros e início do almoço festivo.",
      hasCamera: false,
      hasRoute: false
    },
    {
      id: 4,
      time: "11:00",
      title: "Almoço Festivo",
      location: "Área de Alimentação",
      address: "Praça Central - Centro, Tijucas - SC",
      type: "alimentacao",
      date: "20/07/2025",
      description: "Almoço comunitário para todos os participantes.",
      hasCamera: false,
      hasRoute: false
    },
    {
      id: 5,
      time: "15:00",
      title: "Tarde Dançante com Banda Duetou",
      location: "Palco Principal",
      address: "Praça Central - Centro, Tijucas - SC",
      type: "entretenimento",
      date: "20/07/2025",
      description: "Apresentação musical com a renomada Banda Duetou.",
      hasCamera: true,
      hasRoute: false
    }
  ];

  const getCurrentEvents = () => {
    return selectedDay === 'saturday' ? saturdayEvents : sundayEvents;
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const eventDate = new Date(`2025-07-${selectedDay === 'saturday' ? '19' : '20'}T${event.time}:00`);
    const eventEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    if (now < eventDate) return 'upcoming';
    if (now >= eventDate && now <= eventEnd) return 'current';
    return 'past';
  };

  const getNextEvent = () => {
    const allEvents = [...saturdayEvents, ...sundayEvents];
    const now = new Date();
    
    for (const event of allEvents) {
      const eventDate = new Date(`2025-07-${event.date.includes('19') ? '19' : '20'}T${event.time}:00`);
      if (eventDate > now) {
        return { event, date: eventDate };
      }
    }
    return null;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const nextEvent = getNextEvent();

  return (
    <div className="min-h-screen bg-background">
      {/* Smart Header with Countdown */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-lg"
      >
        {/* Top section with countdown */}
        {nextEvent && (
          <div className="bg-gradient-to-r from-trucker-blue to-trucker-blue/80 text-trucker-blue-foreground px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Próximo: {nextEvent.event.title}</span>
              </div>
              <CountdownBadge 
                targetDate={nextEvent.date} 
                eventName={nextEvent.event.title} 
              />
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

          {/* Day selector */}
          <div className="flex bg-muted rounded-lg p-1">
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
        </div>
      </motion.header>

      {/* Main content */}
      <main className="pt-32 pb-20 px-4">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, x: selectedDay === 'sunday' ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Day title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className={`w-5 h-5 ${selectedDay === 'saturday' ? 'text-trucker-blue' : 'text-trucker-red'}`} />
              <h2 className="text-xl font-bold">
                {selectedDay === 'saturday' ? 'Sábado, 19 de Julho' : 'Domingo, 20 de Julho'}
              </h2>
            </div>
            <Badge variant="outline" className={selectedDay === 'saturday' ? 'text-trucker-blue border-trucker-blue' : 'text-trucker-red border-trucker-red'}>
              {getCurrentEvents().length} eventos
            </Badge>
          </div>

          {/* Events timeline */}
          <div className="space-y-6 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border opacity-50" />
            
            {getCurrentEvents().map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                status={getEventStatus(event)}
              />
            ))}
          </div>

          {/* Info cards */}
          <div className="mt-8 space-y-4">
            {/* Weather info */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white">☀️</span>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    Previsão do Tempo
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedDay === 'saturday' ? 'Sáb: 24°C, ensolarado' : 'Dom: 26°C, parcialmente nublado'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Location info */}
            <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white">📍</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Capela Santa Teresinha
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Local principal dos eventos - Estacionamento disponível
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open('https://maps.google.com/?q=Capela+Santa+Teresinha+Tijucas', '_blank')}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Ver no Mapa
                </Button>
              </div>
            </Card>
          </div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Schedule;