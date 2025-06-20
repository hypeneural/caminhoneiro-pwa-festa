import { Truck, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationsModal } from "./NotificationsModal";
import { useApp } from "@/contexts/AppContext";
import { useState, useEffect } from "react";

export function Header() {
  const { state, addNotification } = useApp();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const unreadCount = state.notifications.filter(n => !n.read).length;

  // Add some sample notifications on component mount
  useEffect(() => {
    if (state.notifications.length === 0) {
      addNotification({
        title: "Bem-vindo!",
        message: "Acompanhe a Festa do Caminhoneiro 2025 em tempo real",
        type: "info"
      });
      
      addNotification({
        title: "São Cristóvão em movimento",
        message: "A procissão está saindo da Igreja Central",
        type: "success"
      });
      
      addNotification({
        title: "Nova programação",
        message: "Show especial adicionado para hoje às 20h",
        type: "info"
      });
    }
  }, [state.notifications.length, addNotification]);

  const handleNotificationClick = () => {
    setIsNotificationsOpen(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border/50 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-trucker-blue-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Festa do Caminhoneiro</h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={handleNotificationClick}
            className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 transition-colors flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs font-bold bg-trucker-red animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </header>

      <NotificationsModal 
        open={isNotificationsOpen} 
        onOpenChange={setIsNotificationsOpen} 
      />
    </>
  );
}