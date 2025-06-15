import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

export const TrackerSkeleton = () => {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-trucker-blue" />
        <h2 className="text-lg font-bold text-foreground">São Cristóvão em Movimento</h2>
      </div>

      <Card className="p-4 space-y-4 shadow-lg border-primary/10">
        {/* Header com status AO VIVO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-16 h-5 bg-muted animate-pulse rounded"></div>
            <div className="w-2 h-2 bg-muted animate-pulse rounded-full"></div>
          </div>
          <div className="w-24 h-4 bg-muted animate-pulse rounded"></div>
        </div>

        {/* Mapa placeholder */}
        <div className="h-32 bg-muted animate-pulse rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 bg-muted-foreground/20 animate-pulse rounded"></div>
        </div>

        {/* Grid de telemetria */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-muted/50 rounded-lg p-3 space-y-2"
            >
              <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
              <div className="w-12 h-4 bg-muted animate-pulse rounded"></div>
              <div className="w-16 h-3 bg-muted animate-pulse rounded"></div>
            </motion.div>
          ))}
        </div>

        {/* Status e endereço */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted animate-pulse rounded"></div>
            <div className="w-20 h-4 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="w-full h-4 bg-muted animate-pulse rounded"></div>
        </div>
      </Card>
    </div>
  );
};