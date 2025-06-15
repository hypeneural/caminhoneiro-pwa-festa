import React from "react";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePhotos } from "@/hooks/usePhotos";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES, THEME_COLORS, APP_TEXTS } from "@/constants";

const PhotoCard = React.memo(({ photo, index }: { photo: any; index: number }) => {
  const { toggleFavorite, isFavorite } = usePhotos();
  const isPhotoLiked = isFavorite(photo.id);

  const handleLikeClick = React.useCallback(() => {
    toggleFavorite(photo.id);
  }, [photo.id, toggleFavorite]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="flex-shrink-0 w-64"
    >
      <Card className="overflow-hidden bg-card shadow-md border-border/50 cursor-pointer hover:shadow-lg transition-all group">
        <div className="relative aspect-square">
          <img 
            src={photo.imageUrl}
            alt={photo.category}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            width={256}
            height={256}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Category label */}
          <div className="absolute bottom-3 left-3 right-3">
            <Badge variant="secondary" className="bg-background/90 text-foreground text-xs mb-2">
              {photo.category}
            </Badge>
          </div>

          {/* Like button and count */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 rounded-full px-2 py-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`text-sm ${isPhotoLiked ? 'text-trucker-red' : 'text-muted-foreground'}`}
              onClick={handleLikeClick}
            >
              ❤️
            </motion.button>
            <span className="text-xs font-medium text-foreground">
              {photo.likes}
            </span>
          </div>

          {/* Hover play button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-12 h-12 bg-background/90 rounded-full flex items-center justify-center">
              <div className={`w-0 h-0 border-l-[8px] border-l-${THEME_COLORS.TRUCKER_BLUE} border-y-[6px] border-y-transparent ml-1`} />
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
});

export const PhotoCarousel = React.memo(() => {
  const { latestPhotos, loading } = usePhotos();
  const { navigateTo } = useNavigation();

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-muted rounded-lg animate-pulse" />
            <div className="w-32 h-4 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-20 h-6 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-64">
              <div className="bg-muted rounded-lg aspect-square animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{APP_TEXTS.SECTION_PHOTOS}</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-${THEME_COLORS.TRUCKER_BLUE} hover:text-${THEME_COLORS.TRUCKER_BLUE}/80`}
          onClick={() => navigateTo(ROUTES.GALLERY)}
        >
          {APP_TEXTS.ACTION_SEE_GALLERY}
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4">
        {latestPhotos.map((photo, index) => (
          <PhotoCard key={photo.id} photo={photo} index={index} />
        ))}
      </div>

      {/* Auto-play controls */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <div className="flex gap-2">
          {latestPhotos.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === 0 ? 'bg-purple-600' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ⏸️ Pausar
        </motion.button>
      </div>
    </div>
  );
});