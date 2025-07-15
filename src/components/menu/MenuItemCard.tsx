import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { APIMenuItem } from '@/services/api/menuService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TouchFeedback } from '@/components/ui/touch-feedback';
import { memo, forwardRef } from 'react';
import * as Fa from 'react-icons/fa';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface MenuItemCardProps {
  item: APIMenuItem;
  isFavorite: boolean;
  onFavoriteToggle: (id: string) => void;
  onItemClick: (item: APIMenuItem) => void;
  viewMode?: 'grid' | 'list';
}

const CategoryIcon = memo(({ iconName }: { iconName: string }) => {
  const IconComponent = (Fa as any)[iconName];
  return IconComponent ? <IconComponent className="w-8 h-8 opacity-50" /> : null;
});

CategoryIcon.displayName = 'CategoryIcon';

const MotionCard = motion.create(Card);
const MotionDiv = motion.create("div");

export const MenuItemCard = memo(forwardRef<HTMLDivElement, MenuItemCardProps>(function MenuItemCard({
  item,
  isFavorite,
  onFavoriteToggle,
  onItemClick,
  viewMode = 'grid'
}, ref) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(parseFloat(item.price));

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle(item.id.toString());
  };

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.15 }}
      ref={ref}
    >
      <TouchFeedback>
        <MotionCard
          className={cn(
            'group overflow-hidden transition-all duration-200 active:scale-95',
            viewMode === 'list' ? 'flex' : 'flex flex-col'
          )}
          onClick={() => onItemClick(item)}
        >
          {/* Image Container */}
          <div className={cn(
            'relative overflow-hidden bg-muted',
            viewMode === 'list' ? 'w-32 h-32' : 'w-full'
          )}>
            <AspectRatio ratio={1}>
              {item.image_url ? (
                <OptimizedImage
                  src={item.image_url}
                  alt={item.name}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted">
                  <div className="p-4 rounded-full bg-muted-foreground/5">
                    <CategoryIcon iconName={item.icon_url} />
                  </div>
                </div>
              )}
            </AspectRatio>

            {/* Favorite Button */}
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'absolute top-1 right-1 h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm shadow-sm',
                isFavorite && 'text-red-500'
              )}
              onClick={handleFavoriteClick}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  isFavorite && 'fill-current'
                )}
              />
            </Button>

            {/* Availability Badge */}
            {item.is_available === 0 && (
              <Badge
                variant="destructive"
                className="absolute bottom-1 right-1 bg-background/90 backdrop-blur-sm text-xs"
              >
                Indisponível
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className={cn(
            'flex flex-col gap-1.5 p-3',
            viewMode === 'list' ? 'flex-1' : ''
          )}>
            <div className="space-y-1">
              <h3 className="font-medium leading-snug tracking-tight line-clamp-2">
                {item.name}
              </h3>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>

            <div className={cn(
              'flex items-center justify-between mt-auto',
              viewMode === 'list' ? 'mt-2' : 'mt-2'
            )}>
              <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5">
                {item.category_name}
              </Badge>
              <span className="text-sm font-semibold">
                {formattedPrice}
              </span>
            </div>
          </div>
        </MotionCard>
      </TouchFeedback>
    </MotionDiv>
  );
})); 