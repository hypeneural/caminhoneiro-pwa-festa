import { Grid3x3, Camera, Map, Calendar, Menu, Home } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

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
  {
    id: "galeria",
    title: "Galeria",
    icon: Camera,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    route: "/galeria",
    badge: { count: 5, type: 'new' }
  },
  {
    id: "mapa",
    title: "Mapa",
    icon: Map,
    color: "text-trucker-blue",
    bgColor: "bg-blue-50",
    route: "/mapa"
  },
  {
    id: "programacao",
    title: "Programação",
    icon: Calendar,
    color: "text-trucker-green",
    bgColor: "bg-green-50",
    route: "/programacao",
    badge: { count: 2, type: 'update' }
  },
  {
    id: "radio",
    title: "Rádio",
    icon: Menu,
    color: "text-trucker-red",
    bgColor: "bg-red-50",
    route: "/radio"
  },
  {
    id: "videos",
    title: "Vídeos",
    icon: Home,
    color: "text-trucker-orange",
    bgColor: "bg-orange-50",
    route: "/videos"
  },
  {
    id: "historia",
    title: "História",
    icon: Grid3x3,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    route: "/historia"
  }
];

export function QuickAccess() {
  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-trucker-orange rounded-lg flex items-center justify-center">
          <Grid3x3 className="w-4 h-4 text-trucker-orange-foreground" />
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
                <span className="text-xs font-medium text-center text-foreground leading-tight">
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}