import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Tag {
  id: number;
  nome: string;
  icone: string;
  cor: string;
}

interface TagSliderProps {
  tags: Tag[];
  selectedTagId: number | null;
  onTagSelect: (tagId: number | null) => void;
  isLoading?: boolean;
}

export const TagSlider: React.FC<TagSliderProps> = ({
  tags,
  selectedTagId,
  onTagSelect,
  isLoading = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="relative bg-background border-b">
        <div className="px-4 py-3">
          <div className="flex space-x-3 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-muted animate-pulse min-w-[120px] h-10"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Adiciona opção "Todas" no início
  const allTags = [
    { id: 0, nome: 'Todas', icone: 'fas fa-th-large', cor: '#6B7280' },
    ...tags
  ];

  return (
    <div className="relative bg-background border-b">
      <div className="px-4 py-3">
        {/* Scroll buttons - apenas em desktop */}
        <div className="hidden md:block">
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-full w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Deslizar para esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-full w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Deslizar para direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tags slider */}
        <div
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto scrollbar-hide tag-slider-container"
        >
          {allTags.map((tag) => {
            const isSelected = selectedTagId === (tag.id === 0 ? null : tag.id);
            
            return (
              <motion.button
                key={tag.id}
                onClick={() => onTagSelect(tag.id === 0 ? null : tag.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-full min-w-max transition-all duration-200 touch-feedback
                  ${isSelected 
                    ? 'text-white font-medium shadow-lg transform scale-105' 
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
                style={{
                  backgroundColor: isSelected ? tag.cor : undefined,
                }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Filtrar por ${tag.nome}`}
              >
                <div className="tag-icon">
                  <i className={`${tag.icone}`} />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {tag.nome}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Indicador de filtro ativo */}
      {selectedTagId && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Filtrando por: {tags.find(t => t.id === selectedTagId)?.nome}
            </span>
            <button
              onClick={() => onTagSelect(null)}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Limpar filtro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSlider; 