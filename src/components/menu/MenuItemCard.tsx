import { Heart, Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { APIMenuItem } from '@/types/menu';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { memo, forwardRef, useState } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import * as Fa from 'react-icons/fa';

interface MenuItemCardProps {
  item: APIMenuItem;
  isFavorite: boolean;
  onFavoriteToggle: (id: string) => void;
  onItemClick: (item: APIMenuItem) => void;
  viewMode?: 'grid' | 'list';
}

const CategoryIcon = memo(({ iconName }: { iconName: string }) => {
  const IconComponent = (Fa as any)[iconName];
  return IconComponent ? <IconComponent className="w-6 h-6 opacity-60" /> : null;
});

CategoryIcon.displayName = 'CategoryIcon';

const MotionCard = motion.create(Card);

export const MenuItemCard = memo(forwardRef<HTMLDivElement, MenuItemCardProps>(function MenuItemCard({
  item,
  isFavorite,
  onFavoriteToggle,
  onItemClick,
  viewMode = 'grid'
}, ref) {
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { toast } = useToast();
  
  const cartQuantity = getItemQuantity(item.id);
  const isInCart = cartQuantity > 0;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(parseFloat(item.price));

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle(item.id.toString());
    
    toast({
      title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: item.name,
      duration: 2000,
    });
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      await addToCart(item, 1);
      
      // Show success feedback
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1000);
      
      toast({
        title: "Adicionado ao carrinho!",
        description: `${item.name} foi adicionado ao seu pedido.`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item ao carrinho.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 300);
    }
  };

  const handleQuantityChange = (e: React.MouseEvent, newQuantity: number) => {
    e.stopPropagation();
    updateQuantity(item.id, newQuantity);
  };

  const handleCardClick = () => {
    onItemClick(item);
  };

  if (viewMode === 'list') {
    return (
      <MotionCard
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        ref={ref}
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 bg-white border border-gray-100 rounded-2xl"
        onClick={handleCardClick}
      >
        <div className="flex p-4">
          {/* Image */}
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 mr-4">
            {item.image_url ? (
              <OptimizedImage
                src={item.image_url}
                alt={item.name}
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-100 to-gray-200">
                <CategoryIcon iconName={item.icon_url} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-base text-gray-900 line-clamp-2 pr-2">
                {item.name}
              </h3>
              
              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteClick}
                className="h-8 w-8 shrink-0 rounded-full hover:bg-red-50"
              >
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  animate={isFavorite ? { scale: [1, 1.2, 1] } : {}}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
                    )}
                  />
                </motion.div>
              </Button>
            </div>

            {item.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-bold text-green-600">
                  {formattedPrice}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    {item.category_name}
                  </Badge>
                </div>
              </div>

              {/* Cart Controls */}
              <div className="flex items-center gap-2">
                {isInCart ? (
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 bg-green-50 rounded-xl p-1 border border-green-200"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleQuantityChange(e, cartQuantity - 1)}
                      className="h-8 w-8 text-green-600 hover:bg-green-100 rounded-lg"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="min-w-[24px] text-center text-sm font-bold text-green-700 px-1">
                      {cartQuantity}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleQuantityChange(e, cartQuantity + 1)}
                      className="h-8 w-8 text-green-600 hover:bg-green-100 rounded-lg"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className={cn(
                        "bg-green-600 hover:bg-green-700 text-white h-9 px-4 rounded-xl font-medium transition-all duration-200",
                        justAdded && "bg-green-500"
                      )}
                    >
                      {isAddingToCart ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : justAdded ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </MotionCard>
    );
  }

  // Grid view
  return (
    <MotionCard
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      ref={ref}
      className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md rounded-2xl"
      onClick={handleCardClick}
    >
      <div className="relative">
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gray-100">
          <AspectRatio ratio={4/3}>
            {item.image_url ? (
              <OptimizedImage
                src={item.image_url}
                alt={item.name}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-100 to-gray-200">
                <CategoryIcon iconName={item.icon_url} />
              </div>
            )}
          </AspectRatio>

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Favorite Button */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-3 right-3"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavoriteClick}
              className="h-9 w-9 bg-white/90 hover:bg-white shadow-md rounded-full backdrop-blur-sm"
            >
              <motion.div
                animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-all duration-300",
                    isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                  )}
                />
              </motion.div>
            </Button>
          </motion.div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
              {item.category_name}
            </Badge>
          </div>

          {/* Add to Cart Button (Grid) */}
          <div className="absolute bottom-3 right-3">
            {isInCart ? (
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-white rounded-full p-1 shadow-lg border border-green-200"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleQuantityChange(e, cartQuantity - 1)}
                  className="h-7 w-7 text-green-600 hover:bg-green-50 rounded-full"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <span className="min-w-[20px] text-center text-xs font-bold text-green-700 px-1">
                  {cartQuantity}
                </span>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleQuantityChange(e, cartQuantity + 1)}
                  className="h-7 w-7 text-green-600 hover:bg-green-50 rounded-full"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  size="icon"
                  className={cn(
                    "bg-green-600 hover:bg-green-700 text-white h-10 w-10 rounded-full shadow-lg border-2 border-white transition-all duration-300",
                    justAdded && "bg-green-500 scale-110"
                  )}
                >
                  {isAddingToCart ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : justAdded ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.3 }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2 leading-tight min-h-[40px]">
            {item.name}
          </h3>

          {item.description && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[32px]">
              {item.description}
            </p>
          )}

          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-green-600">
              {formattedPrice}
            </span>
            
            {isInCart && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"
              >
                <ShoppingCart className="w-3 h-3" />
                <span className="font-medium">{cartQuantity}</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </MotionCard>
  );
})); 