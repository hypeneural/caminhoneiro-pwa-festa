import React, { useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Play, Eye, ArrowRight, Loader2 } from "lucide-react";
import { useShorts } from "@/hooks/useShorts";
import { ShortsModal } from "./ShortsModal";
import { Short } from "@/types/shorts";

interface ShortCardProps {
  short: Short;
  index: number;
  onClick: () => void;
}

const ShortCard = memo(({ short, index, onClick }: ShortCardProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="min-w-[120px] space-y-2"
  >
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative aspect-[9/16] bg-muted rounded-lg overflow-hidden cursor-pointer group"
    >
      <img
        src={short.thumb_url}
        alt={short.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      <div className="absolute inset-0 bg-black/20 group-active:bg-black/40 transition-colors" />
      
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
        >
          <Play className="w-6 h-6 text-gray-900 ml-0.5" fill="currentColor" />
        </motion.div>
      </div>

      <div className="absolute top-2 right-2">
        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Short
        </div>
      </div>
    </motion.div>

    <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
      {short.title}
    </h3>
  </motion.div>
));

ShortCard.displayName = "ShortCard";

export const ShortsCarousel = memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { data: shortsData, isLoading, error } = useShorts({ 
    limit: 6,
    sort: 'created_at',
    order: 'DESC'
  });

  console.log('🎬 ShortsCarousel debug:', { 
    isLoading, 
    error: error?.message, 
    dataLength: shortsData?.data?.length,
    data: shortsData 
  });

  const handleShortClick = useCallback((index: number) => {
    setSelectedIndex(index);
    setIsModalOpen(true);
  }, []);

  const handleViewAll = useCallback(() => {
    setSelectedIndex(0);
    setIsModalOpen(true);
  }, []);

  if (isLoading) {
    console.log('🎬 ShortsCarousel: Rendering loading state');
    return (
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Shorts</h2>
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[120px] space-y-2">
              <div className="aspect-[9/16] bg-muted animate-pulse rounded-lg" />
              <div className="h-4 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !shortsData?.data?.length) {
    console.log('🎬 ShortsCarousel: Error or no data, returning null');
    return null;
  }

  const shorts = shortsData.data;
  console.log('🎬 ShortsCarousel: Rendering with', shorts.length, 'shorts');

  return (
    <>
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Shorts</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleViewAll}
            className="flex items-center gap-1 text-sm text-primary font-medium"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {shorts.map((short, index) => (
            <ShortCard
              key={short.id}
              short={short}
              index={index}
              onClick={() => handleShortClick(index)}
            />
          ))}
        </div>
      </div>

      <ShortsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shorts={shorts}
        initialIndex={selectedIndex}
      />
    </>
  );
});

ShortsCarousel.displayName = "ShortsCarousel";