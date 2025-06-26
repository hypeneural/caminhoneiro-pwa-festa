
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCheck, Church, Music, MapPin, Gift, Sparkles, Utensils, CloudRain, ChevronDown, Clock, ExternalLink } from "lucide-react";
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
  warning: 'bg-orange-50 border-orange-200 text-orange-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

const typeIconColors = {
  info: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-orange-600',
  error: 'text-red-600',
};

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);

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
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    
    // Só permite arrastar para baixo
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Se arrastou mais de 120px, fecha o modal
    if (dragOffset > 120) {
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ 
            y: dragOffset,
            opacity: 1,
            transition: { 
              type: "spring", 
              damping: 30, 
              stiffness: 400 
            }
          }}
          exit={{ 
            y: "100%", 
            opacity: 0,
            transition: { duration: 0.25, ease: "easeInOut" }
          }}
          className="relative w-full max-w-lg mx-4 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Handle para arrastar */}
          <div className="flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing">
            <motion.div 
              className="w-12 h-1.5 bg-gray-300 rounded-full"
              animate={{ 
                backgroundColor: isDragging ? '#9CA3AF' : '#D1D5DB' 
              }}
            />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-trucker-blue to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notificações</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500">
                    {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-trucker-blue to-blue-600 text-white rounded-2xl text-sm font-medium shadow-lg"
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar todas
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenChange(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="space-y-4 p-6">
                {[...Array(4)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-start gap-4 p-4 rounded-2xl animate-pulse"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: i * 0.1 } }}
                  >
                    <div className="w-14 h-14 bg-gray-200 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3 p-6">
                {notifications.map((notification, index) => {
                  const IconComponent = notification.icon ? iconMap[notification.icon] : Bell;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: 1,
                        transition: { 
                          delay: index * 0.05,
                          type: "spring",
                          damping: 20,
                          stiffness: 300
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNotificationClick(notification.id, notification.linkUrl)}
                      className={cn(
                        "flex items-start gap-4 p-5 rounded-3xl cursor-pointer transition-all duration-300 border-2 relative overflow-hidden shadow-sm hover:shadow-md",
                        !notification.read 
                          ? 'bg-gradient-to-r from-trucker-blue/5 to-blue-50/50 border-trucker-blue/20 shadow-lg' 
                          : 'bg-white border-gray-100 hover:bg-gray-50',
                        notification.linkUrl && 'active:bg-trucker-blue/10'
                      )}
                    >
                      {/* Glow effect para não lidas */}
                      {!notification.read && (
                        <div className="absolute inset-0 bg-gradient-to-r from-trucker-blue/5 to-transparent opacity-50" />
                      )}
                      
                      {/* Unread indicator */}
                      {!notification.read && (
                        <motion.div 
                          className="absolute top-5 right-5 w-3 h-3 bg-trucker-blue rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      {/* Icon */}
                      <motion.div 
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                          typeColors[notification.type] || typeColors.info
                        )}
                        whileHover={{ rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <IconComponent className={cn(
                          "w-7 h-7",
                          typeIconColors[notification.type] || typeIconColors.info
                        )} />
                      </motion.div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 relative">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className={cn(
                            "font-bold text-base leading-tight",
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          )}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-400 font-medium flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatTime(notification.timestamp)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          {notification.category && (
                            <span className="inline-block px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                              {notification.category}
                            </span>
                          )}
                          
                          {notification.linkUrl && (
                            <div className="flex items-center gap-1 text-trucker-blue text-xs font-semibold">
                              <span>Toque para abrir</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
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
                className="text-center py-20 px-6"
              >
                <motion.div 
                  className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Bell className="w-12 h-12 text-gray-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                  Você está em dia! Quando houver novidades importantes, elas aparecerão aqui.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
