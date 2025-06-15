import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ErrorBoundary, CarouselErrorFallback } from "@/components/ui/error-boundary";
import { GridSkeleton } from "@/components/ui/skeleton";
import { TouchFeedback, RippleEffect } from "@/components/ui/touch-feedback";
import { useQuickAccess } from "@/hooks/useQuickAccess";
import { THEME_COLORS, APP_TEXTS } from "@/constants";
import { Camera } from "lucide-react";

const QuickAccessCard = React.memo(({ item, index }: { item: any; index: number }) => {
  const { trackUsage } = useQuickAccess();

  const handleClick = React.useCallback(() => {
    trackUsage(item.id);
  }, [item.id, trackUsage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.05, // Reduced delay for better performance
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] // Optimized easing for mobile
      }}
      className="cursor-pointer"
    >
      <TouchFeedback scale={0.95}>
        <Link 
          to={item.route} 
          className="block" 
          onClick={handleClick}
          aria-label={`Acessar ${item.title}`}
        >
          <RippleEffect>
            <Card 
              className="p-4 bg-card hover:shadow-md transition-all border-border/50 relative"
              role="button"
              tabIndex={0}
            >
              {item.badge && (
                <div 
                  className="absolute -top-2 -right-2 w-6 h-6 bg-trucker-red text-trucker-red-foreground text-xs font-bold rounded-full flex items-center justify-center"
                  aria-label={`${item.badge.count} notificações`}
                >
                  {item.badge.count}
                </div>
              )}
              
              <div className="flex flex-col items-center gap-3">
                <div 
                  className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center`}
                  aria-hidden="true"
                >
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="text-xs font-medium text-center text-foreground leading-tight px-1">
                  {item.title}
                </span>
              </div>
            </Card>
          </RippleEffect>
        </Link>
      </TouchFeedback>
    </motion.div>
  );
});

export const QuickAccess = React.memo(() => {
  const { items, loading } = useQuickAccess();

  if (loading) {
    return (
      <div className="px-4 mb-6" aria-label="Carregando acesso rápido">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-muted rounded-lg animate-pulse" />
          <div className="w-24 h-4 bg-muted rounded animate-pulse" />
        </div>
        <GridSkeleton itemCount={9} columns={3} />
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={CarouselErrorFallback}>
      <section className="px-4 mb-6" aria-labelledby="quick-access-section">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-trucker-orange rounded-lg flex items-center justify-center">
            <Camera className="w-4 h-4 text-trucker-orange-foreground" aria-hidden="true" />
          </div>
          <h2 id="quick-access-section" className="text-lg font-bold text-foreground">
            Acesso Rápido
          </h2>
        </div>

        <div 
          className="grid grid-cols-3 gap-3"
          role="navigation"
          aria-label="Menu de acesso rápido"
        >
          {items.map((item, index) => (
            <QuickAccessCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </section>
    </ErrorBoundary>
  );
});