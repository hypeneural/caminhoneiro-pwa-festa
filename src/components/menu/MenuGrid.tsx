import { motion } from "framer-motion";
import { Heart, Clock, Star, Users, Leaf, Shield, Flame } from "lucide-react";
import { MenuItem } from "@/types/menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuGridProps {
  items: MenuItem[];
  loading: boolean;
  favorites: string[];
  onItemClick: (item: MenuItem) => void;
  onToggleFavorite: (itemId: string) => void;
}

const tagIcons = {
  'vegetarian': { icon: Leaf, color: 'text-green-500', bg: 'bg-green-100' },
  'vegan': { icon: Leaf, color: 'text-green-600', bg: 'bg-green-100' },
  'gluten-free': { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-100' },
  'spicy': { icon: Flame, color: 'text-red-500', bg: 'bg-red-100' },
  'large-portion': { icon: Users, color: 'text-orange-500', bg: 'bg-orange-100' }
};

const categoryLabels = {
  'main': 'PRINCIPAL',
  'snacks': 'PETISCO',
  'regional': 'REGIONAL',
  'drinks': 'BEBIDA',
  'desserts': 'SOBREMESA',
  'fast': 'LANCHE'
};

const categoryColors = {
  'main': 'bg-red-500',
  'snacks': 'bg-orange-500',
  'regional': 'bg-green-500',
  'drinks': 'bg-blue-500',
  'desserts': 'bg-yellow-500',
  'fast': 'bg-purple-500'
};

function MenuItemCard({ item, isFavorite, onItemClick, onToggleFavorite }: {
  item: MenuItem;
  isFavorite: boolean;
  onItemClick: (item: MenuItem) => void;
  onToggleFavorite: (itemId: string) => void;
}) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:border-trucker-blue/30 transition-all duration-300 hover:shadow-lg group">
        <CardContent className="p-0">
          {/* Image Container */}
          <div className="relative overflow-hidden">
            <AspectRatio ratio={4/3}>
              <img
                src={item.images[0]}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </AspectRatio>
            
            {/* Category Badge */}
            <Badge 
              className={`absolute top-2 left-2 ${categoryColors[item.category]} text-white border-0 text-xs font-bold px-2 py-1`}
            >
              {categoryLabels[item.category]}
            </Badge>

            {/* Favorite Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id);
              }}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Promotion Badge */}
            {item.promotions && item.promotions.length > 0 && (
              <Badge className="absolute bottom-2 left-2 bg-trucker-red text-trucker-red-foreground border-0 text-xs">
                🔥 Promoção
              </Badge>
            )}
          </div>

          {/* Content */}
          <div 
            className="p-4 cursor-pointer"
            onClick={() => onItemClick(item)}
          >
            {/* Name and Rating */}
            <div className="mb-2">
              <h3 className="font-bold text-foreground text-base line-clamp-2 mb-1">
                {item.name}
              </h3>
              
              {item.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-muted-foreground">
                    {item.rating.average} ({item.rating.count})
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.slice(0, 3).map((tag) => {
                const tagConfig = tagIcons[tag as keyof typeof tagIcons];
                if (!tagConfig) return null;
                
                const Icon = tagConfig.icon;
                return (
                  <div
                    key={tag}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${tagConfig.bg} ${tagConfig.color}`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                );
              })}
              {item.tags.includes('popular') && (
                <Badge variant="outline" className="text-xs px-2 py-0 text-trucker-blue border-trucker-blue/30">
                  Popular
                </Badge>
              )}
              {item.tags.includes('new') && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs px-2 py-0">
                  Novo
                </Badge>
              )}
            </div>

            {/* Price and Prep Time */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-trucker-blue">
                  {formatPrice(item.price)}
                </span>
                {item.preparationTime && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {item.preparationTime}min
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {item.vendor.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.vendor.location}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MenuItemSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <AspectRatio ratio={4/3}>
          <Skeleton className="w-full h-full" />
        </AspectRatio>
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MenuGrid({ items, loading, favorites, onItemClick, onToggleFavorite }: MenuGridProps) {
  if (loading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <MenuItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum prato encontrado
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Tente ajustar os filtros ou termo de busca para encontrar o que procura.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <MenuItemCard
              item={item}
              isFavorite={favorites.includes(item.id)}
              onItemClick={onItemClick}
              onToggleFavorite={onToggleFavorite}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}