import { motion } from "framer-motion";
import { Percent, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockPromotions } from "@/data/menuData";

export function PromotionsSection() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short'
    }).format(date);
  };

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 mb-3">
        <Percent className="w-5 h-5 text-trucker-red" />
        <h2 className="text-lg font-bold text-foreground">Ofertas Especiais</h2>
      </div>
      
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {mockPromotions.map((promotion) => (
          <motion.div
            key={promotion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-[280px]"
          >
            <Card className="overflow-hidden border-trucker-red/20 bg-gradient-to-br from-trucker-red/5 to-background">
              <CardContent className="p-0">
                {promotion.image && (
                  <div className="aspect-video relative">
                    <img
                      src={promotion.image}
                      alt={promotion.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-trucker-red text-trucker-red-foreground">
                      {promotion.type === 'combo' ? '🔥 COMBO' : 
                       promotion.type === 'happy-hour' ? '⏰ HAPPY HOUR' : 
                       '⭐ ESPECIAL'}
                    </Badge>
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-1">{promotion.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{promotion.description}</p>
                  
                  <div className="flex items-center justify-between">
                    {promotion.originalPrice && promotion.promotionalPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(promotion.originalPrice)}
                        </span>
                        <span className="text-lg font-bold text-trucker-red">
                          {formatPrice(promotion.promotionalPrice)}
                        </span>
                      </div>
                    ) : promotion.discountPercentage ? (
                      <span className="text-lg font-bold text-trucker-red">
                        -{promotion.discountPercentage}%
                      </span>
                    ) : null}
                    
                    {promotion.validUntil && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Até {formatDate(promotion.validUntil)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}