import { Church, Coffee, Truck, Gift, Music, Utensils, Clock, MapPin } from "lucide-react";

export interface Event {
  id: number;
  time: string;
  title: string;
  location: string;
  address: string;
  type: 'religioso' | 'procissao' | 'alimentacao' | 'entretenimento';
  date: string;
  description: string;
  hasCamera: boolean;
  hasRoute: boolean;
  isLive?: boolean;
  duration: number; // em minutos
  icon: string; // nome do ícone lucide
}

// Dados atualizados da programação
export const saturdayEvents: Event[] = [
  {
    id: 1,
    time: "18:00",
    title: "Missa dos Festeiros e da Comunidade",
    location: "Capela Santa Teresinha",
    address: "Rua Santa Teresinha, 123 - Centro, Tijucas - SC",
    type: "religioso",
    date: "19/07/2025",
    description: "⛪ Missa dos Festeiros e da Comunidade em momento de fé e união.",
    hasCamera: true,
    hasRoute: false,
    duration: 60,
    icon: "Church"
  },
  {
    id: 2,
    time: "19:00",
    title: "Galeto com bar & cozinha completos",
    location: "Área de Alimentação",
    address: "Praça Central - Centro, Tijucas - SC",
    type: "alimentacao",
    date: "19/07/2025",
    description: "🍗 Galeto com bar & cozinha completos para todos os participantes.",
    hasCamera: false,
    hasRoute: false,
    duration: 180,
    icon: "Utensils"
  },
  {
    id: 3,
    time: "20:00",
    title: "Pista garantida com DJ Jr. Oliver",
    location: "Palco Principal",
    address: "Praça Central - Centro, Tijucas - SC",
    type: "entretenimento",
    date: "19/07/2025",
    description: "🎧 Pista garantida com DJ Jr. Oliver animando a noite.",
    hasCamera: true,
    hasRoute: false,
    duration: 240,
    icon: "Music"
  }
];

export const sundayEvents: Event[] = [
  {
    id: 4,
    time: "07:30",
    title: "Café da manhã quentinho à venda",
    location: "Área de Alimentação",
    address: "Praça Central - Centro, Tijucas - SC",
    type: "alimentacao",
    date: "20/07/2025",
    description: "☕ Café da manhã quentinho à venda para começar bem o dia.",
    hasCamera: false,
    hasRoute: false,
    duration: 90,
    icon: "Coffee"
  },
  {
    id: 5,
    time: "09:00",
    title: "Procissão automotiva (saída Capela Sta. Teresinha)",
    location: "Capela Santa Teresinha",
    address: "Rua Santa Teresinha, 123 - Centro, Tijucas - SC",
    type: "procissao",
    date: "20/07/2025",
    description: "🚛 Procissão automotiva saindo da Capela Santa Teresinha.",
    hasRoute: true,
    hasCamera: true,
    isLive: false,
    duration: 120,
    icon: "Truck"
  },
  {
    id: 6,
    time: "10:30",
    title: "Bênção dos veículos no retorno",
    location: "Capela Santa Teresinha",
    address: "Rua Santa Teresinha, 123 - Centro, Tijucas - SC",
    type: "religioso",
    date: "20/07/2025",
    description: "🙏 Bênção dos veículos no retorno em frente à Capela.",
    hasCamera: true,
    hasRoute: false,
    duration: 30,
    icon: "Church"
  },
  {
    id: 7,
    time: "11:00",
    title: "Entrega do Kit Festeiro + almoço caprichado",
    location: "Área Central do Evento",
    address: "Praça Central - Centro, Tijucas - SC",
    type: "alimentacao",
    date: "20/07/2025",
    description: "🎁 Entrega do Kit Festeiro + almoço caprichado para todos.",
    hasCamera: false,
    hasRoute: false,
    duration: 180,
    icon: "Gift"
  },
  {
    id: 8,
    time: "15:00",
    title: "Tarde dançante com Alciney & Sandro",
    location: "Palco Principal",
    address: "Praça Central - Centro, Tijucas - SC",
    type: "entretenimento",
    date: "20/07/2025",
    description: "💃 Tarde dançante com Alciney & Sandro para animar a galera.",
    hasCamera: true,
    hasRoute: false,
    duration: 240,
    icon: "Music"
  }
];

// Função para obter eventos por dia
export const getEventsByDay = (day: 'saturday' | 'sunday'): Event[] => {
  return day === 'saturday' ? saturdayEvents : sundayEvents;
};

// Função para obter todos os eventos
export const getAllEvents = (): Event[] => {
  return [...saturdayEvents, ...sundayEvents];
};

// Função para obter próximo evento
export const getNextEvent = (): { event: Event; date: Date } | null => {
  const now = new Date();
  const allEvents = getAllEvents();
  
  for (const event of allEvents) {
    const eventDate = new Date(`2025-07-${event.date.includes('19') ? '19' : '20'}T${event.time}:00`);
    if (eventDate > now) {
      return { event, date: eventDate };
    }
  }
  
  // Se não há eventos futuros, retorna o primeiro evento do sábado
  return saturdayEvents[0] ? { 
    event: saturdayEvents[0], 
    date: new Date(`2025-07-19T${saturdayEvents[0].time}:00`)
  } : null;
};

// Função para obter status do evento
export const getEventStatus = (event: Event): 'upcoming' | 'current' | 'past' => {
  const now = new Date();
  const eventDate = new Date(`2025-07-${event.date.includes('19') ? '19' : '20'}T${event.time}:00`);
  const eventEnd = new Date(eventDate.getTime() + event.duration * 60 * 1000);
  
  if (now < eventDate) return 'upcoming';
  if (now >= eventDate && now <= eventEnd) return 'current';
  return 'past';
};

// Função para obter cores por tipo
export const getEventTypeConfig = (type: Event['type']) => {
  switch (type) {
    case 'religioso':
      return {
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
        gradient: 'from-blue-500/10 to-blue-600/20',
        border: 'border-blue-200/50 dark:border-blue-800/50'
      };
    case 'procissao':
      return {
        color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
        gradient: 'from-red-500/10 to-red-600/20',
        border: 'border-red-200/50 dark:border-red-800/50'
      };
    case 'alimentacao':
      return {
        color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
        gradient: 'from-orange-500/10 to-orange-600/20',
        border: 'border-orange-200/50 dark:border-orange-800/50'
      };
    case 'entretenimento':
      return {
        color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
        gradient: 'from-green-500/10 to-green-600/20',
        border: 'border-green-200/50 dark:border-green-800/50'
      };
    default:
      return {
        color: 'text-muted-foreground bg-muted',
        gradient: 'from-muted/10 to-muted/20',
        border: 'border-muted/50'
      };
  }
};