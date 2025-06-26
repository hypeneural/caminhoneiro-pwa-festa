
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCheck, X, Church, Music, MapPin, Gift, Sparkles, Utensils, CloudRain } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconMap = {
  church: Church,
  music: Music,
  'map-pin': MapPin,
  gift: Gift,
  sparkles: Sparkles,
  utensils: Utensils,
  'cloud-rain': CloudRain,
};

const typeColors = {
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-700',
  success: 'bg-green-500/10 border-green-500/20 text-green-700',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700',
  error: 'bg-red-500/10 border-red-500/20 text-red-700',
};

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleNotificationClick = (notificationId: string, linkUrl?: string) => {
    markAsRead(notificationId);
    
    if (linkUrl) {
      // Se tem URL, navega para ela
      window.location.href = linkUrl;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-trucker-blue rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-trucker-blue-foreground" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Notificações</DialogTitle>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="py-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification, index) => {
                  const IconComponent = notification.icon ? iconMap[notification.icon] : Bell;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification.id, notification.linkUrl)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                        !notification.read 
                          ? 'bg-trucker-blue/5 hover:bg-trucker-blue/10 border border-trucker-blue/20' 
                          : 'hover:bg-muted/50',
                        notification.linkUrl && 'hover:scale-[1.02]'
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        typeColors[notification.type] || typeColors.info
                      )}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "font-semibold text-sm leading-tight",
                            !notification.read ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-trucker-blue flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground/70">
                            {formatTime(notification.timestamp)}
                          </p>
                          {notification.category && (
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {notification.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Nenhuma notificação</h3>
                <p className="text-muted-foreground text-sm">
                  Você está em dia! Não há notificações pendentes.
                </p>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {unreadCount > 0 && (
          <div className="p-4 border-t border-border/50">
            <Button 
              onClick={markAllAsRead} 
              className="w-full bg-trucker-blue hover:bg-trucker-blue/90"
              size="sm"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como lidas ({unreadCount})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
