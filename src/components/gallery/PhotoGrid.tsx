import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Skeleton } from '@/components/ui/skeleton';
import { Photo } from '@/types/gallery';

interface PhotoGridProps {
  photos: Photo[];
  loading: boolean;
  onPhotoClick: (photo: Photo) => void;
  favorites: string[];
}

const PhotoItem = memo(({ 
  photo, 
  onPhotoClick, 
  isFavorite 
}: { 
  photo: Photo; 
  onPhotoClick: (photo: Photo) => void; 
  isFavorite: boolean;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = useCallback(() => {
    onPhotoClick(photo);
  }, [photo, onPhotoClick]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer relative group"
      onClick={handleClick}
    >
      {!imageLoaded && (
        <Skeleton className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      <OptimizedImage
        src={photo.thumbnailUrl}
        alt={photo.title || `Foto ${photo.id}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onLoad={() => setImageLoaded(true)}
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      
      {/* Overlay with info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {photo.vehiclePlate && (
            <div className="text-white text-xs font-medium bg-black/40 rounded px-2 py-1 inline-block mb-1">
              {photo.vehiclePlate}
            </div>
          )}
          {photo.category && (
            <div className="text-white/80 text-xs capitalize">
              {photo.category.replace('_', ' ')}
            </div>
          )}
        </div>
      </div>

      {/* Favorite indicator */}
      {isFavorite && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-trucker-red rounded-full"></div>
      )}
    </motion.div>
  );
});

PhotoItem.displayName = 'PhotoItem';

export function PhotoGrid({ photos, loading, onPhotoClick, favorites }: PhotoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton
            key={index}
            className="aspect-square rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📷</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma foto encontrada
        </h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Tente ajustar os filtros ou usar termos de busca diferentes para encontrar mais fotos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
      {photos.map((photo, index) => (
        <PhotoItem
          key={photo.id}
          photo={photo}
          onPhotoClick={onPhotoClick}
          isFavorite={favorites.includes(photo.id)}
        />
      ))}
    </div>
  );
}