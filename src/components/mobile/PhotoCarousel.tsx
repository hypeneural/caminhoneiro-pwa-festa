import React from "react";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary, CarouselErrorFallback } from "@/components/ui/error-boundary";
import { CarouselSkeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { TouchFeedback } from "@/components/ui/touch-feedback";
import { AccessibleButton } from "@/components/ui/accessible-button";
import { VirtualCarousel } from "@/components/ui/virtual-carousel";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
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
      transition={{ 
        delay: index * 0.1, 
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] // Optimized easing for mobile
      }}
      className="flex-shrink-0 w-64"
    >
      <TouchFeedback>
        <Card 
          className="overflow-hidden bg-card shadow-md border-border/50 cursor-pointer hover:shadow-lg transition-all group"
          role="article"
          aria-label={`Foto: ${photo.category}`}
        >
          <div className="relative aspect-square">
            <OptimizedImage
              src={photo.imageUrl}
              alt={`Foto da categoria ${photo.category}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
            {/* Category label */}
            <div className="absolute bottom-3 left-3 right-3">
              <Badge 
                variant="secondary" 
                className="bg-background/90 text-foreground text-xs mb-2"
                aria-label={`Categoria: ${photo.category}`}
              >
                {photo.category}
              </Badge>
            </div>

            {/* Like button and count */}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 rounded-full px-2 py-1">
              <AccessibleButton
                variant="ghost"
                size="sm"
                className={`text-sm h-auto p-1 ${isPhotoLiked ? 'text-trucker-red' : 'text-muted-foreground'}`}
                onClick={handleLikeClick}
                aria-label={isPhotoLiked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                ❤️
              </AccessibleButton>
              <span className="text-xs font-medium text-foreground" aria-label={`${photo.likes} curtidas`}>
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
      </TouchFeedback>
    </motion.div>
  );
});

export const PhotoCarousel = React.memo(() => {
  const { latestPhotos, loading } = usePhotos();
  const { navigateTo } = useNavigation();
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });
  
  const renderPhotoItem = React.useCallback((photo: any, index: number, isVisible: boolean) => {
    return <PhotoCard key={photo.id} photo={photo} index={index} />;
  }, []);

  return (
    <ErrorBoundary fallback={CarouselErrorFallback}>
      <section ref={intersectionRef} className="mb-6" aria-labelledby="photos-section">
        {loading ? (
          <div aria-label="Carregando fotos">
            <div className="flex items-center justify-between px-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-muted rounded-lg animate-pulse" />
                <div className="w-32 h-4 bg-muted rounded animate-pulse" />
              </div>
              <div className="w-20 h-6 bg-muted rounded animate-pulse" />
            </div>
            <CarouselSkeleton itemCount={4} itemWidth="w-64" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <h2 id="photos-section" className="text-lg font-bold text-foreground">
                  {APP_TEXTS.SECTION_PHOTOS}
                </h2>
              </div>
              <AccessibleButton 
                variant="ghost" 
                size="sm" 
                className={`text-${THEME_COLORS.TRUCKER_BLUE} hover:text-${THEME_COLORS.TRUCKER_BLUE}/80`}
                onClick={() => navigateTo(ROUTES.GALLERY)}
                aria-label="Ver galeria completa"
              >
                {APP_TEXTS.ACTION_SEE_GALLERY}
              </AccessibleButton>
            </div>

            {isIntersecting && (
              <VirtualCarousel
                items={latestPhotos}
                renderItem={renderPhotoItem}
                itemWidth={256}
                gap={16}
                className="px-4"
                overscan={2}
                autoPlay={true}
                autoPlayInterval={4000}
                showIndicators={true}
              />
            )}
          </>
        )}
      </section>
    </ErrorBoundary>
  );
});