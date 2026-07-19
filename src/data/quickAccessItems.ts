import { QuickAccessItem } from '@/types/quickAccess';
import { Camera, Map, CalendarDays, Route, Radio, ChefHat, BookText, Shield, Users, Heart, Phone, Mic, Lightbulb } from "lucide-react";

export const quickAccessItems: QuickAccessItem[] = [
  // Primeira Linha
  {
    id: "galeria",
    title: "Galeria de Fotos",
    icon: Camera,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    route: "/galeria",
    category: "media",
    priority: 7,
    description: "Veja as melhores fotos do evento",
    isActive: true
  },
  {
    id: "mapa",
    title: "Como Chegar",
    icon: Map,
    color: "text-trucker-blue",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    route: "/mapa",
    category: "navigation",
    priority: 3,
    description: "Veja o caminho até a Capela Santa Teresinha",
    isActive: true
  },
  {
    id: "programacao",
    title: "Programação 2026",
    icon: CalendarDays,
    color: "text-trucker-green",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    route: "/programacao",
    category: "schedule",
    priority: 1,
    description: "Confira os horários de 18 e 19 de julho",
    isActive: true
  },
  {
    id: "contato-igreja",
    title: "Contato Capela",
    icon: Phone,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    route: "#",
    category: "info",
    priority: 4,
    description: "Fale com a comunidade da Capela Santa Teresinha",
    isActive: true
  },
  {
    id: "menu",
    title: "Bar e Cozinha",
    icon: ChefHat,
    color: "text-trucker-orange",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    route: "/menu",
    category: "info",
    priority: 5,
    description: "Serviço completo nos dois dias de festa",
    isActive: true
  },
  
  // Segunda Linha
  {
    id: "sao-cristovao",
    title: "São Cristóvão",
    icon: Shield,
    color: "text-trucker-yellow",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    route: "/sao-cristovao",
    category: "info",
    priority: 6,
    description: "Conheça o padroeiro dos motoristas",
    isActive: true
  },
  {
    id: "radio",
    title: "Rádio Ao Vivo",
    icon: Radio,
    color: "text-trucker-red",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    route: "/radio",
    category: "media",
    priority: 11,
    description: "Ouça a rádio oficial do evento",
    isActive: true
  },
  {
    id: "podcast",
    title: "Podcast",
    icon: Mic,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    route: "/podcast",
    category: "media",
    priority: 12,
    description: "Ouça nossos podcasts exclusivos",
    isActive: true
  },
  {
    id: "noticias",
    title: "Notícias",
    icon: BookText,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    route: "/noticias",
    category: "info",
    priority: 8,
    description: "Últimas notícias do evento",
    isActive: true
  },
  
  // Terceira Linha
  {
    id: "rota",
    title: "Rota da Procissão",
    icon: Route,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    route: "/rota-completa",
    category: "navigation",
    priority: 2,
    description: "Veja as informações da procissão automotiva",
    isActive: true
  },
  {
    id: "vocesabia",
    title: "Você Sabia?",
    icon: Lightbulb,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    route: "/vocesabia",
    category: "info",
    priority: 13,
    description: "Curiosidades da festa",
    isActive: true
  },
  {
    id: "faq",
    title: "Dúvidas",
    icon: Heart,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    route: "/faq",
    category: "info",
    priority: 9,
    description: "Perguntas frequentes",
    isActive: true
  },
  {
    id: "historia",
    title: "História",
    icon: Users,
    color: "text-amber-700",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    route: "/historia",
    category: "info",
    priority: 10,
    description: "Conheça a história da festa",
    isActive: true
  }
];
