import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCheck, Church, Music, MapPin, Gift, Sparkles, Utensils, CloudRain, ChevronDown, Clock, ExternalLink } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useSponsors } from "@/hooks/useSponsors";
import { BannerCarousel } from "@/components/sponsors/BannerCarousel";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Notification } from "@/services/api/notificationService";
import { Banner } from "@/types/sponsors";

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type IconType = typeof Church | typeof Music | typeof MapPin | typeof Gift | typeof Sparkles | typeof Utensils | typeof CloudRain | typeof Bell;

const iconMap: Record<string, IconType> = {
  church: Church,
  music: Music,
  'map-pin': MapPin,
  gift: Gift,
  sparkles: Sparkles,
  utensils: Utensils,
  'cloud-rain': CloudRain,
  bell: Bell,
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
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } = useNotifications();
  const { sponsorsData } = useSponsors();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const [localNotifications, setNotifications] = useState(notifications);

  useEffect(() => {
    setNotifications(notifications);
  }, [notifications]);

  // Filter active banners for notification modal
  const activeBanners = sponsorsData.banners.filter(banner => banner.priority === 1);

  const formatTime = (timestamp: string) => {
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

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
      // Atualiza o estado local imediatamente para melhor UX
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      // Não mostra erro ao usuário, apenas mantém o estado atual
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

          {/* Banner Carousel Header */}
          {activeBanners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-2"
            >
              <BannerCarousel
                banners={activeBanners.slice(0, 3)}
                autoplayDelay={5000}
                showControls={false}
                showDots={true}
                className="rounded-xl overflow-hidden h-32 md:h-40"
              />
            </motion.div>
          )}
          
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
            {isLoading && notifications.length === 0 ? (
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
                  // Map notification type to icon
                  let IconComponent = iconMap[notification.type] || Bell;
                  
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
                          duration: 0.3
                        }
                      }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all",
                        "hover:shadow-lg hover:scale-[1.02]",
                        !notification.read && "bg-blue-50/50",
                        typeColors[notification.type]
                      )}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        "bg-gradient-to-br shadow-lg",
                        notification.type === 'success' && "from-green-500 to-green-600",
                        notification.type === 'warning' && "from-orange-500 to-orange-600",
                        notification.type === 'error' && "from-red-500 to-red-600",
                        (!notification.type || notification.type === 'info') && "from-blue-500 to-blue-600"
                      )}>
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={cn(
                            "font-semibold",
                            !notification.read && "font-bold",
                            typeIconColors[notification.type]
                          )}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap mt-1">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        
                        <p className={cn(
                          "text-sm mt-1",
                          !notification.read ? "text-gray-800" : "text-gray-600"
                        )}>
                          {notification.message}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Bell className="w-12 h-12 mb-4 text-gray-400" />
                <p className="text-lg font-medium">Nenhuma notificação</p>
                <p className="text-sm">Você está em dia!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
