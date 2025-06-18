import React from 'react';
import { ArrowUpDown, Clock, Eye, Heart, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface SortModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: string;
  onSortChange: (sort: string) => void;
}

const sortOptions = [
  {
    value: 'newest',
    label: 'Mais Recentes',
    description: 'Ordenar por data decrescente',
    icon: Clock,
    color: 'text-blue-500'
  },
  {
    value: 'oldest',
    label: 'Mais Antigas',
    description: 'Ordenar por data crescente',
    icon: Calendar,
    color: 'text-amber-500'
  },
  {
    value: 'mostViewed',
    label: 'Mais Visualizadas',
    description: 'Ordenar por número de visualizações',
    icon: Eye,
    color: 'text-green-500'
  },
  {
    value: 'mostLiked',
    label: 'Mais Curtidas',
    description: 'Ordenar por número de curtidas',
    icon: Heart,
    color: 'text-red-500'
  }
];

export function SortModal({ 
  isOpen, 
  onClose, 
  currentSort, 
  onSortChange 
}: SortModalProps) {
  const handleSortSelect = (sortValue: string) => {
    onSortChange(sortValue);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ArrowUpDown className="w-5 h-5 text-trucker-blue" />
            Ordenar Fotos
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-2 pb-4">
          {sortOptions.map((option, index) => {
            const Icon = option.icon;
            const isSelected = currentSort === option.value;
            
            return (
              <motion.div
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  className={`w-full h-auto p-4 justify-start ${
                    isSelected 
                      ? 'bg-trucker-blue text-trucker-blue-foreground' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleSortSelect(option.value)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? 'bg-trucker-blue-foreground/20' 
                        : 'bg-muted'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        isSelected 
                          ? 'text-trucker-blue-foreground' 
                          : option.color
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${
                        isSelected 
                          ? 'text-trucker-blue-foreground' 
                          : 'text-foreground'
                      }`}>
                        {option.label}
                      </div>
                      <div className={`text-xs ${
                        isSelected 
                          ? 'text-trucker-blue-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-trucker-blue-foreground rounded-full"
                      />
                    )}
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          <p>• A ordenação será aplicada imediatamente</p>
          <p>• Sua preferência será salva para próximas sessões</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}