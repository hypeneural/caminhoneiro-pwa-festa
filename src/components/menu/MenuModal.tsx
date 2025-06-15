import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Heart, Star, Clock, Users, Share2, 
  Leaf, Shield, Flame, MapPin, Calendar,
  ThumbsUp, MessageCircle, Camera
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MenuItem, MenuReview } from "@/types/menu";
import { SimpleCarousel } from "@/components/ui/simple-carousel";

interface MenuModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  reviews: MenuReview[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const tagIcons = {
  'vegetarian': { icon: Leaf, label: 'Vegetariano', color: 'text-green-500' },
  'vegan': { icon: Leaf, label: 'Vegano', color: 'text-green-600' },
  'gluten-free': { icon: Shield, label: 'Sem Glúten', color: 'text-blue-500' },
  'spicy': { icon: Flame, label: 'Picante', color: 'text-red-500' },
  'large-portion': { icon: Users, label: 'Porção Grande', color: 'text-orange-500' }
};

export function MenuModal({
  item,
  isOpen,
  onClose,
  reviews,
  isFavorite,
  onToggleFavorite
}: MenuModalProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);

  if (!item) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: item.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback: copiar para clipboard
      const text = `${item.name} - ${item.description} - ${formatPrice(item.price)}`;
      navigator.clipboard.writeText(text);
    }
  };

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4 p-0 overflow-hidden max-h-[90vh]">
        <div className="bg-background relative">
          {/* Header with Images */}
          <div className="relative">
            {item.images.length > 1 ? (
              <div className="aspect-video relative">
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video relative">
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Header Actions */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onToggleFavorite}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isFavorite 
                      ? 'bg-red-500 text-white' 
                      : 'bg-black/20 backdrop-blur-sm text-white hover:bg-black/30'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </motion.button>
              </div>
            </div>

            {/* Promotion Badge */}
            {item.promotions && item.promotions.length > 0 && (
              <Badge className="absolute bottom-4 left-4 bg-trucker-red text-trucker-red-foreground border-0">
                🔥 {item.promotions[0].description}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              {/* Title and Rating */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {item.name}
                </h2>
                
                {item.rating && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">{item.rating.average}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({item.rating.count} avaliações)
                    </span>
                  </div>
                )}

                <p className="text-muted-foreground text-sm">
                  {item.longDescription || item.description}
                </p>
              </div>

              {/* Price and Time */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-trucker-blue">
                  {formatPrice(item.price)}
                </div>
                
                {item.preparationTime && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {item.preparationTime} min
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => {
                    const tagConfig = tagIcons[tag as keyof typeof tagIcons];
                    if (!tagConfig) {
                      return (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag === 'popular' ? 'Popular' : tag === 'new' ? 'Novo' : tag}
                        </Badge>
                      );
                    }
                    
                    const Icon = tagConfig.icon;
                    return (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Icon className={`w-3 h-3 mr-1 ${tagConfig.color}`} />
                        {tagConfig.label}
                      </Badge>
                    );
                  })}
                </div>
              )}

              <Separator />

              {/* Ingredients */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Ingredientes</h3>
                <div className="flex flex-wrap gap-1">
                  {item.ingredients.map((ingredient, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-orange-600">
                    ⚠️ Contém Alérgenos
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {item.allergens.map((allergen, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Nutritional Info */}
              {item.nutritionalInfo && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Informações Nutricionais</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {item.nutritionalInfo.calories && (
                      <div className="bg-muted p-2 rounded">
                        <span className="text-muted-foreground">Calorias:</span>
                        <span className="font-semibold ml-1">{item.nutritionalInfo.calories}</span>
                      </div>
                    )}
                    {item.nutritionalInfo.protein && (
                      <div className="bg-muted p-2 rounded">
                        <span className="text-muted-foreground">Proteína:</span>
                        <span className="font-semibold ml-1">{item.nutritionalInfo.protein}g</span>
                      </div>
                    )}
                    {item.nutritionalInfo.carbs && (
                      <div className="bg-muted p-2 rounded">
                        <span className="text-muted-foreground">Carboidratos:</span>
                        <span className="font-semibold ml-1">{item.nutritionalInfo.carbs}g</span>
                      </div>
                    )}
                    {item.nutritionalInfo.fat && (
                      <div className="bg-muted p-2 rounded">
                        <span className="text-muted-foreground">Gordura:</span>
                        <span className="font-semibold ml-1">{item.nutritionalInfo.fat}g</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Vendor Info */}
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-trucker-blue" />
                  Onde Encontrar
                </h3>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="font-medium">{item.vendor.name}</div>
                  <div className="text-sm text-muted-foreground">{item.vendor.location}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {item.availability.days.join(', ')} • {item.availability.hours.start} - {item.availability.hours.end}
                  </div>
                </div>
              </div>

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-trucker-blue" />
                    Avaliações ({reviews.length})
                  </h3>
                  
                  <div className="space-y-3">
                    <AnimatePresence>
                      {visibleReviews.map((review) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-muted p-3 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={review.author.avatar} />
                              <AvatarFallback>
                                {review.author.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{review.author.name}</span>
                                {review.verified && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    ✓ Verificado
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1 mb-2">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < review.rating 
                                        ? 'text-yellow-500 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-muted-foreground ml-1">
                                  {formatDate(review.date)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-foreground">{review.comment}</p>
                              
                              {review.photos && review.photos.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {review.photos.map((photo, index) => (
                                    <img
                                      key={index}
                                      src={photo}
                                      alt="Foto da avaliação"
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <button className="flex items-center gap-1 hover:text-foreground">
                                  <ThumbsUp className="w-3 h-3" />
                                  {review.likes}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {reviews.length > 2 && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="w-full text-sm"
                      >
                        {showAllReviews 
                          ? 'Ver menos avaliações' 
                          : `Ver mais ${reviews.length - 2} avaliações`
                        }
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}