import { Camera, Map, CalendarDays, Route, Radio, Play, Video, Circle, BookText } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface QuickAccessItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  route: string;
  badge?: {
    count: number;
    type: 'notification' | 'update' | 'new';
  };
}

const quickAccessItems: QuickAccessItem[] = [
  // Primeira Linha
  {
    id: "galeria",
    title: "Galeria de Fotos",
    icon: Camera,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    route: "/galeria",
    badge: { count: 5, type: 'new' }
  },
  {
    id: "mapa",
    title: "Mapa em Tempo Real",
    icon: Map,
    color: "text-trucker-blue",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    route: "/mapa"
  },
  {
    id: "programacao",
    title: "Programação",
    icon: CalendarDays,
    color: "text-trucker-green",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    route: "/programacao",
    badge: { count: 2, type: 'update' }
  },
  
  // Segunda Linha
  {
    id: "rota",
    title: "Rota da Procissão",
    icon: Route,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    route: "/rota"
  },
  {
    id: "radio",
    title: "Rádio Ao Vivo",
    icon: Radio,
    color: "text-trucker-red",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    route: "/radio"
  },
  {
    id: "videos",
    title: "Vídeos",
    icon: Play,
    color: "text-trucker-orange",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    route: "/videos"
  },
  
  // Terceira Linha
  {
    id: "cameras",
    title: "Câmeras Ao Vivo",
    icon: Video,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
    route: "/cameras"
  },
  {
    id: "stories",
    title: "Stories",
    icon: Circle,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    route: "/stories"
  },
  {
    id: "historia",
    title: "História",
    icon: BookText,
    color: "text-amber-700",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    route: "/historia"
  }
];

export function QuickAccess() {
  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-trucker-orange rounded-lg flex items-center justify-center">
          <Camera className="w-4 h-4 text-trucker-orange-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Acesso Rápido</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {quickAccessItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
          >
            <Link to={item.route} className="block">
              <Card className="p-4 bg-card hover:shadow-md transition-all border-border/50 relative">
                {item.badge && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-trucker-red text-trucker-red-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge.count}
                  </div>
                )}
                
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="text-xs font-medium text-center text-foreground leading-tight px-1">
                    {item.title}
                  </span>
                </div>

                {/* Touch feedback */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  whileTap={{ scale: 1, opacity: 0.2 }}
                  className="absolute inset-0 bg-trucker-blue rounded-lg"
                />
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}