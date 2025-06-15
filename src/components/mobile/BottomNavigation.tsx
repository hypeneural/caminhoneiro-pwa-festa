import { Home, Camera, Map, Calendar, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { MoreMenuSheet } from "./MoreMenuSheet";

interface BottomNavTab {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  isActive: boolean;
  badge?: {
    count: number;
    show: boolean;
  };
}

const navigationTabs: BottomNavTab[] = [
  {
    id: "home",
    title: "Home",
    icon: Home,
    route: "/",
    isActive: true
  },
  {
    id: "galeria",
    title: "Galeria",
    icon: Camera,
    route: "/galeria",
    isActive: false,
    badge: { count: 5, show: true }
  },
  {
    id: "mapa",
    title: "Mapa",
    icon: Map,
    route: "/mapa",
    isActive: false,
    badge: { count: 1, show: true }
  },
  {
    id: "programacao",
    title: "Agenda",
    icon: Calendar,
    route: "/programacao",
    isActive: false,
    badge: { count: 2, show: true }
  },
  {
    id: "mais",
    title: "Mais",
    icon: Menu,
    route: "/mais",
    isActive: false
  }
];

export function BottomNavigation() {
  const location = useLocation();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const getTabForRoute = (route: string) => {
    return navigationTabs.find(tab => tab.route === route) || navigationTabs[0];
  };

  const currentTab = getTabForRoute(location.pathname);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 shadow-lg pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navigationTabs.map((tab) => {
            const isActive = tab.id === currentTab.id;
            const isMoreTab = tab.id === "mais";

            if (isMoreTab) {
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setIsMoreMenuOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, y: 2 }}
                  className="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors relative text-muted-foreground hover:text-foreground"
                >
                  <div className="relative">
                    <tab.icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium mt-1 text-muted-foreground">
                    {tab.title}
                  </span>
                </motion.button>
              );
            }

            return (
              <Link key={tab.id} to={tab.route}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, y: 2 }}
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors relative ${
                    isActive 
                      ? 'text-trucker-blue' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="relative">
                    <tab.icon className={`w-6 h-6 ${
                      isActive ? 'text-trucker-blue' : 'text-muted-foreground'
                    }`} />
                    
                    {tab.badge?.show && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs font-bold bg-trucker-red"
                      >
                        {tab.badge.count}
                      </Badge>
                    )}
                  </div>
                  
                  <span className={`text-xs font-medium mt-1 ${
                    isActive ? 'text-trucker-blue' : 'text-muted-foreground'
                  }`}>
                    {tab.title}
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-trucker-blue rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              </Link>
            );
          })}
        </div>
      </nav>

      <MoreMenuSheet 
        open={isMoreMenuOpen} 
        onOpenChange={setIsMoreMenuOpen} 
      />
    </>
  );
}