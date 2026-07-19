
import { Truck, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationsModal } from "./NotificationsModal";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount, loading, error } = useNotifications();

  const handleNotificationClick = () => {
    setIsNotificationsOpen(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-[calc(4rem+env(safe-area-inset-top,0px))] bg-background/92 backdrop-blur-xl border-b border-border/50 px-4 pt-safe flex items-center justify-between shadow-sm supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-trucker-blue-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Festa do Caminhoneiro</h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={handleNotificationClick}
            className="touch-feedback min-h-11 min-w-11 rounded-full bg-muted/50 hover:bg-muted/80 active:scale-95 transition flex items-center justify-center"
            disabled={loading}
            aria-label="Abrir notificações"
          >
            <Bell className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-pulse' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs font-bold bg-trucker-red animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {error && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
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
