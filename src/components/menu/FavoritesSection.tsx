import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/types/menu";

interface FavoritesSectionProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteItems: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  onToggleFavorite: (itemId: string) => void;
}

export function FavoritesSection({
  isOpen,
  onClose,
  favoriteItems,
  onItemClick,
  onToggleFavorite
}: FavoritesSectionProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const totalEstimated = favoriteItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              Meus Favoritos
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        {favoriteItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum favorito ainda</h3>
            <p className="text-muted-foreground text-sm">
              Adicione pratos aos favoritos tocando no coração
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total estimado:</p>
              <p className="text-xl font-bold text-trucker-blue">{formatPrice(totalEstimated)}</p>
            </div>

            <div className="space-y-3">
              {favoriteItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 p-3 bg-background border border-border rounded-lg"
                >
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <h4 
                      className="font-medium text-foreground cursor-pointer"
                      onClick={() => onItemClick(item)}
                    >
                      {item.name}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-lg font-bold text-trucker-blue">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleFavorite(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}