export type EventDay = 'saturday' | 'sunday';

export interface EventDayInfo {
  id: EventDay;
  tabLabel: string;
  title: string;
  dateLabel: string;
  isoDate: string;
  shortDate: string;
  focus: string;
  summary: string;
}

export interface Event {
  id: number;
  time: string;
  title: string;
  location: string;
  address: string;
  type: 'religioso' | 'procissao' | 'alimentacao' | 'entretenimento' | 'comunitario';
  date: string;
  description: string;
  hasRoute: boolean;
  isLive?: boolean;
  duration: number;
  icon: string;
  highlight?: string;
  price?: string;
  details?: string[];
}

export const eventDays: Record<EventDay, EventDayInfo> = {
  saturday: {
    id: 'saturday',
    tabLabel: 'Sáb 18/07',
    title: 'Sábado',
    dateLabel: '18 de julho de 2026',
    isoDate: '2026-07-18',
    shortDate: '18/07/26',
    focus: 'Abertura da festa',
    summary: 'Missa às 18h e bingo tradicional às 19h40, com cartelas à venda no local.'
  },
  sunday: {
    id: 'sunday',
    tabLabel: 'Dom 19/07',
    title: 'Domingo',
    dateLabel: '19 de julho de 2026',
    isoDate: '2026-07-19',
    shortDate: '19/07/26',
    focus: 'Procissão e confraternização',
    summary: 'Café da manhã, procissão automotiva, almoço festivo e tarde dançante com André e Cristiano.'
  }
};

export const eventAddress = 'Capela Santa Teresinha, bairro Universitário, Tijucas - SC';

export const scheduleSummary = {
  edition: 'XXII Festa de São Cristóvão',
  year: '2026',
  dateRange: '18 e 19 de julho de 2026',
  community: 'Comunidade da Capela Santa Teresinha',
  neighborhood: 'Bairro Universitário, Tijucas/SC',
  invitation: 'Reúna sua família e participe de dois dias de fé, tradição, confraternização e integração comunitária.',
  kitchenNotice: 'Durante os dois dias haverá serviço completo de bar e cozinha.',
  bingoPrice: 'Cartelas do bingo: R$ 8,00 a unidade ou 3 por R$ 20,00.'
};

export const saturdayEvents: Event[] = [
  {
    id: 1,
    time: '18:00',
    title: 'Missa de abertura',
    location: 'Capela Santa Teresinha',
    address: eventAddress,
    type: 'religioso',
    date: eventDays.saturday.isoDate,
    description: 'Celebração que abre oficialmente a XXII Festa de São Cristóvão, reunindo moradores, fiéis e visitantes em momento de fé.',
    hasRoute: false,
    duration: 70,
    icon: 'Church',
    highlight: 'Abertura oficial',
    details: ['Momento de fé e comunidade', 'Participação aberta ao público']
  },
  {
    id: 2,
    time: '19:40',
    title: 'Bingo tradicional',
    location: 'Área da festa',
    address: eventAddress,
    type: 'comunitario',
    date: eventDays.saturday.isoDate,
    description: 'Uma das atrações mais aguardadas da programação, com cartelas disponíveis no local.',
    hasRoute: false,
    duration: 140,
    icon: 'Ticket',
    highlight: 'Cartelas à venda',
    price: 'R$ 8,00 ou 3 por R$ 20,00',
    details: ['Cartela unitária: R$ 8,00', 'Promoção: 3 cartelas por R$ 20,00']
  }
];

export const sundayEvents: Event[] = [
  {
    id: 3,
    time: '07:30',
    title: 'Café da manhã',
    location: 'Área de alimentação',
    address: eventAddress,
    type: 'alimentacao',
    date: eventDays.sunday.isoDate,
    description: 'Abertura das atividades de domingo com café da manhã para acolher a comunidade logo cedo.',
    hasRoute: false,
    duration: 80,
    icon: 'Coffee',
    highlight: 'Comece o domingo na festa',
    details: ['Serviço de bar e cozinha', 'Atendimento à comunidade']
  },
  {
    id: 4,
    time: '09:00',
    title: 'Procissão automotiva',
    location: 'Saída da Capela Santa Teresinha',
    address: eventAddress,
    type: 'procissao',
    date: eventDays.sunday.isoDate,
    description: 'Momento de devoção dedicado a São Cristóvão, protetor dos motoristas e viajantes.',
    hasRoute: true,
    isLive: false,
    duration: 120,
    icon: 'Truck',
    highlight: 'Devoção sobre rodas',
    details: ['Participação de motoristas e famílias', 'Homenagem a São Cristóvão']
  },
  {
    id: 5,
    time: '12:00',
    title: 'Almoço festivo',
    location: 'Área de alimentação',
    address: eventAddress,
    type: 'alimentacao',
    date: eventDays.sunday.isoDate,
    description: 'Almoço comunitário para reunir famílias, visitantes e participantes após a procissão.',
    hasRoute: false,
    duration: 120,
    icon: 'Utensils',
    highlight: 'Confraternização',
    details: ['Almoço ao meio-dia', 'Completo serviço de bar e cozinha']
  },
  {
    id: 6,
    time: '14:00',
    title: 'Tarde dançante com André e Cristiano',
    location: 'Área da festa',
    address: eventAddress,
    type: 'entretenimento',
    date: eventDays.sunday.isoDate,
    description: 'Música e confraternização para encerrar a programação com animação para toda a comunidade.',
    hasRoute: false,
    duration: 240,
    icon: 'Music',
    highlight: 'Música ao vivo',
    details: ['Show com André e Cristiano', 'Tarde de integração comunitária']
  }
];

export const getEventsByDay = (day: EventDay): Event[] => {
  return day === 'saturday' ? saturdayEvents : sundayEvents;
};

export const getAllEvents = (): Event[] => {
  return [...saturdayEvents, ...sundayEvents].sort(
    (a, b) => getEventDateTime(a).getTime() - getEventDateTime(b).getTime()
  );
};

export const getEventDateTime = (event: Pick<Event, 'date' | 'time'>): Date => {
  return new Date(`${event.date}T${event.time}:00`);
};

export const getNextEvent = (): { event: Event; date: Date } | null => {
  const now = new Date();
  const allEvents = getAllEvents();
  const nextEvent = allEvents.find((event) => getEventDateTime(event) > now);

  if (nextEvent) {
    return { event: nextEvent, date: getEventDateTime(nextEvent) };
  }

  return allEvents[0] ? { event: allEvents[0], date: getEventDateTime(allEvents[0]) } : null;
};

export const getEventStatus = (event: Event): 'upcoming' | 'current' | 'past' => {
  const now = new Date();
  const eventDate = getEventDateTime(event);
  const eventEnd = new Date(eventDate.getTime() + event.duration * 60 * 1000);

  if (now < eventDate) return 'upcoming';
  if (now >= eventDate && now <= eventEnd) return 'current';
  return 'past';
};

export const getEventTypeConfig = (type: Event['type']) => {
  switch (type) {
    case 'religioso':
      return {
        label: 'Fé',
        color: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300',
        gradient: 'from-blue-500/10 to-blue-600/20',
        border: 'border-blue-200/50 dark:border-blue-800/50'
      };
    case 'procissao':
      return {
        label: 'Procissão',
        color: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300',
        gradient: 'from-red-500/10 to-red-600/20',
        border: 'border-red-200/50 dark:border-red-800/50'
      };
    case 'alimentacao':
      return {
        label: 'Gastronomia',
        color: 'text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300',
        gradient: 'from-orange-500/10 to-orange-600/20',
        border: 'border-orange-200/50 dark:border-orange-800/50'
      };
    case 'entretenimento':
      return {
        label: 'Música',
        color: 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300',
        gradient: 'from-green-500/10 to-green-600/20',
        border: 'border-green-200/50 dark:border-green-800/50'
      };
    case 'comunitario':
      return {
        label: 'Comunidade',
        color: 'text-violet-700 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-300',
        gradient: 'from-violet-500/10 to-violet-600/20',
        border: 'border-violet-200/50 dark:border-violet-800/50'
      };
    default:
      return {
        label: 'Evento',
        color: 'text-muted-foreground bg-muted',
        gradient: 'from-muted/10 to-muted/20',
        border: 'border-muted/50'
      };
  }
};
