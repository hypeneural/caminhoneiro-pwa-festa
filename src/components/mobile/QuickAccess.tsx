import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ErrorBoundary, CarouselErrorFallback } from "@/components/ui/error-boundary";
import { GridSkeleton } from "@/components/ui/skeleton";
import { TouchFeedback, RippleEffect } from "@/components/ui/touch-feedback";
import { useQuickAccess } from "@/hooks/useQuickAccess";
import { useDynamicBadges } from "@/hooks/useDynamicBadges";
import { THEME_COLORS, APP_TEXTS } from "@/constants";
import { Camera, Star, Heart, Zap, Clock } from "lucide-react";

const QuickAccessCard = React.memo(({ item, index }: { item: any; index: number }) => {
  const { trackUsage, isFavorite, toggleFavorite } = useQuickAccess();
  const { getBadgeForItem } = useDynamicBadges();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback(() => {
    trackUsage(item.id);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [item.id, trackUsage]);

  const handleLongPress = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    toggleFavorite(item.id);
    
    // Stronger haptic feedback for favorites
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 20]);
    }
  }, [item.id, toggleFavorite]);

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'new': return 'bg-emerald-500 text-white animate-pulse';
      case 'update': return 'bg-blue-500 text-white';
      case 'warning': return 'bg-amber-500 text-white animate-bounce';
      case 'notification': return 'bg-trucker-red text-white';
      default: return 'bg-trucker-red text-white';
    }
  };

  const getCardSize = (priority: number) => {
    // First 3 items get larger cards
    if (priority <= 3) return 'col-span-1 row-span-1';
    return 'col-span-1 row-span-1';
  };

  const isLiveItem = item.id === 'mapa' || item.id === 'cameras';
  const favorite = isFavorite(item.id);
  const dynamicBadge = getBadgeForItem(item.id);
  const displayBadge = dynamicBadge || item.badge;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        delay: index * 0.08,
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1],
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className={`cursor-pointer ${getCardSize(item.priority)}`}
    >
      <TouchFeedback scale={0.96} haptic>
        <Link 
          to={item.route} 
          className="block h-full" 
          onClick={handleClick}
          aria-label={`Acessar ${item.title}`}
        >
          <RippleEffect rippleColor="rgba(255,255,255,0.2)">
            <Card 
              className={`
                p-4 h-full relative overflow-hidden transition-all duration-300 group
                bg-gradient-to-br from-background/95 to-background/90
                backdrop-blur-md border border-border/30
                hover:border-border/60 hover:shadow-xl hover:shadow-primary/5
                ${favorite ? 'ring-2 ring-trucker-orange/50 border-trucker-orange/30' : ''}
                ${isLiveItem ? 'animate-pulse' : ''}
              `}
              role="button"
              tabIndex={0}
              onTouchStart={() => setIsPressed(true)}
              onTouchEnd={() => setIsPressed(false)}
              onTouchCancel={() => setIsPressed(false)}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-60" />
              
              {/* Live Indicator */}
              {isLiveItem && (
                <motion.div 
                  className="absolute top-2 left-2 w-2 h-2 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Favorite Star */}
              {favorite && (
                <motion.div 
                  className="absolute top-2 right-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Star className="w-4 h-4 text-trucker-orange fill-trucker-orange" />
                </motion.div>
              )}

              {/* Badge with Enhanced Design */}
              {displayBadge && (
                <motion.div
                  className={`
                    absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 text-xs font-bold 
                    rounded-full flex items-center justify-center shadow-lg
                    ${displayBadge.color || getBadgeVariant(displayBadge.type)}
                    ${displayBadge.pulse ? 'animate-pulse' : ''}
                  `}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                  aria-label={`${displayBadge.count} ${displayBadge.type}`}
                >
                  {displayBadge.count}
                </motion.div>
              )}
              
              <div className="relative z-10 flex flex-col items-center justify-center gap-3 h-full">
                {/* Icon Container with Enhanced Animation */}
                <motion.div 
                  className={`
                    w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center
                    shadow-lg group-hover:shadow-xl transition-all duration-300
                    ring-2 ring-white/10 group-hover:ring-white/20
                  `}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}
                  aria-hidden="true"
                >
                  <motion.div
                    animate={{ 
                      scale: isPressed ? 0.9 : 1,
                      rotate: isLiveItem ? [0, 2, -2, 0] : 0
                    }}
                    transition={{ 
                      duration: isLiveItem ? 3 : 0.2, 
                      repeat: isLiveItem ? Infinity : 0 
                    }}
                  >
                    <item.icon className={`w-7 h-7 ${item.color} drop-shadow-sm`} />
                  </motion.div>
                </motion.div>
                
                {/* Title with Better Typography */}
                <span className="text-xs font-semibold text-center text-foreground leading-tight px-1 max-w-full">
                  {item.title}
                </span>

                {/* Subtle Activity Indicator */}
                {isLiveItem && (
                  <motion.div 
                    className="text-[10px] text-emerald-600 font-medium"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    AO VIVO
                  </motion.div>
                )}
              </div>

              {/* Glassmorphism Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 pointer-events-none" />
            </Card>
          </RippleEffect>
        </Link>
      </TouchFeedback>
    </motion.div>
  );
});

const QuickAccessHeader = React.memo(() => (
  <motion.div 
    className="flex items-center justify-between mb-6"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center gap-3">
      <motion.div 
        className="w-8 h-8 bg-gradient-to-br from-trucker-orange to-trucker-red rounded-xl flex items-center justify-center shadow-lg"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
      >
        <Zap className="w-5 h-5 text-white" aria-hidden="true" />
      </motion.div>
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Acesso Rápido
        </h2>
        <p className="text-xs text-muted-foreground">Toque e segure para favoritar</p>
      </div>
    </div>
    
    <motion.div 
      className="flex items-center gap-1 px-2 py-1 bg-trucker-green/10 rounded-lg"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="w-2 h-2 bg-trucker-green rounded-full animate-pulse" />
      <span className="text-xs font-medium text-trucker-green">Online</span>
    </motion.div>
  </motion.div>
));

const EnhancedLoadingState = React.memo(() => (
  <div className="px-4 mb-6" aria-label="Carregando acesso rápido">
    <QuickAccessHeader />
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <motion.div
          key={index}
          className="h-24 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl"
          animate={{ 
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  </div>
));

export const QuickAccess = React.memo(() => {
  const { items, loading } = useQuickAccess();

  if (loading) {
    return <EnhancedLoadingState />;
  }

  return (
    <ErrorBoundary fallback={CarouselErrorFallback}>
      <motion.section 
        className="px-4 mb-8" 
        aria-labelledby="quick-access-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <QuickAccessHeader />

        <motion.div 
          className="grid grid-cols-3 gap-4"
          role="navigation"
          aria-label="Menu de acesso rápido"
          layout
        >
          <AnimatePresence mode="wait">
            {items.map((item, index) => (
              <QuickAccessCard key={item.id} item={item} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="mt-6 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <div className="flex items-center gap-4 px-4 py-2 bg-background/50 backdrop-blur-sm rounded-full border border-border/30">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-trucker-red" />
              <span className="text-xs text-muted-foreground">{items.filter((_, i) => i < 3).length} populares</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-trucker-blue" />
              <span className="text-xs text-muted-foreground">Atualizado agora</span>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </ErrorBoundary>
  );
});