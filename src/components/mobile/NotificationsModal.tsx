import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCheck, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const { state, markNotificationAsRead } = useApp();
  const unreadCount = state.notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    state.notifications
      .filter(n => !n.read)
      .forEach(n => markNotificationAsRead(n.id));
  };

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
            {state.notifications.length > 0 ? (
              <div className="space-y-3">
                {state.notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => markNotificationAsRead(notification.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      !notification.read 
                        ? 'bg-trucker-blue/5 hover:bg-trucker-blue/10 border border-trucker-blue/20' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {!notification.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-trucker-blue mt-2 flex-shrink-0" />
                    )}
                    <div className={`flex-1 ${notification.read ? 'ml-[22px]' : ''}`}>
                      <h4 className={`font-semibold text-sm ${
                        !notification.read ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
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