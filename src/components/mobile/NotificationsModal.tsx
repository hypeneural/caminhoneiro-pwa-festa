
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCheck, Church, Music, MapPin, Gift, Sparkles, Utensils, CloudRain, ChevronDown } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

const typeIconColors = {
  info: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
};

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = touch.clientY - rect.top;
    if (offset > 0) {
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset > 100) {
      onOpenChange(false);
    }
    setDragOffset(0);
  };

  const handleNotificationClick = (notificationId: string, linkUrl?: string) => {
    markAsRead(notificationId);
    
    if (linkUrl) {
      if (linkUrl.startsWith('http')) {
        window.open(linkUrl, '_blank');
      } else {
        window.location.href = linkUrl;
      }
    }
  };

  // Previne scroll do body quando modal está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ 
            y: dragOffset,
            opacity: 1,
            transition: { 
              type: "spring", 
              damping: 25, 
              stiffness: 300 
            }
          }}
          exit={{ 
            y: "100%", 
            opacity: 0,
            transition: { duration: 0.2 }
          }}
          className="relative w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-trucker-blue rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notificações</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500">
                    {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                  </p>
                )}
              </div>
            </div>
            
            {unreadCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-1.5 bg-trucker-blue text-white rounded-full text-sm font-medium"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas
              </motion.button>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading && notifications.length === 0 ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.05 }
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNotificationClick(notification.id, notification.linkUrl)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 relative overflow-hidden",
                        !notification.read 
                          ? 'bg-trucker-blue/5 border-trucker-blue/20 shadow-md' 
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100',
                        notification.linkUrl && 'active:bg-trucker-blue/10'
                      )}
                    >
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute top-4 right-4 w-3 h-3 bg-trucker-blue rounded-full animate-pulse" />
                      )}
                      
                      {/* Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        typeColors[notification.type] || typeColors.info
                      )}>
                        <IconComponent className={cn(
                          "w-6 h-6",
                          typeIconColors[notification.type] || typeIconColors.info
                        )} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={cn(
                            "font-semibold text-base leading-tight",
                            !notification.read ? 'text-gray-900' : 'text-gray-600'
                          )}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-400 font-medium flex-shrink-0">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed mb-2">
                          {notification.message}
                        </p>
                        
                        {notification.category && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                            {notification.category}
                          </span>
                        )}
                        
                        {notification.linkUrl && (
                          <div className="flex items-center gap-1 mt-2 text-trucker-blue text-sm font-medium">
                            <span>Toque para abrir</span>
                            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Você está em dia! Não há notificações pendentes no momento.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
