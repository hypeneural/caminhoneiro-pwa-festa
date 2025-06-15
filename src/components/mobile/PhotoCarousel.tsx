import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PhotoItem {
  id: string;
  imageUrl: string;
  category: string;
  likes: number;
  isLiked: boolean;
}

const mockPhotos: PhotoItem[] = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?auto=format&fit=crop&q=80&w=256",
    category: "Caminhões Chegando",
    likes: 127,
    isLiked: false
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?auto=format&fit=crop&q=80&w=256",
    category: "Momento de Oração",
    likes: 89,
    isLiked: true
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?auto=format&fit=crop&q=80&w=256",
    category: "Festa em Família",
    likes: 203,
    isLiked: false
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1487252665478-49b61b47f302?auto=format&fit=crop&q=80&w=256",
    category: "Shows e Música",
    likes: 156,
    isLiked: true
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1469041797191-50ace28483c3?auto=format&fit=crop&q=80&w=256",
    category: "Tradição Viva",
    likes: 94,
    isLiked: false
  }
];

export function PhotoCarousel() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Momentos Especiais</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-trucker-blue hover:text-trucker-blue/80">
          Ver galeria
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4">
        {mockPhotos.map((photo, index) => (
          <motion.div
            key={photo.id}
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
                    className={`text-sm ${photo.isLiked ? 'text-trucker-red' : 'text-muted-foreground'}`}
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
                    <div className="w-0 h-0 border-l-[8px] border-l-trucker-blue border-y-[6px] border-y-transparent ml-1" />
                  </div>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Auto-play controls */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <div className="flex gap-2">
          {mockPhotos.map((_, index) => (
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
}