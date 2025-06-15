import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
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
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer"
    >
      <Link to={item.route} className="block" onClick={handleClick}>
        <Card className="p-4 bg-card hover:shadow-md transition-all border-border/50 relative">
          {item.badge && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-trucker-red text-trucker-red-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {item.badge.count}
            </div>
          )}
          
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <span className="text-xs font-medium text-center text-foreground leading-tight px-1">
              {item.title}
            </span>
          </div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 1, opacity: 0.2 }}
            className="absolute inset-0 bg-trucker-blue rounded-lg"
          />
        </Card>
      </Link>
    </motion.div>
  );
});

export const QuickAccess = React.memo(() => {
  const { items, loading } = useQuickAccess();

  if (loading) {
    return (
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-muted rounded-lg animate-pulse" />
          <div className="w-24 h-4 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="p-4 bg-muted rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-trucker-orange rounded-lg flex items-center justify-center">
          <Camera className="w-4 h-4 text-trucker-orange-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Acesso Rápido</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map((item, index) => (
          <QuickAccessCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
});